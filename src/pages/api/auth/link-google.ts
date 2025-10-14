import { type NextApiRequest, type NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";
import { createRepositories } from "~/server/repositories";
import { db } from "~/server/db";
import { z } from "zod";

const linkGoogleSchema = z.object({
  googleId: z.string(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { googleId, accessToken, refreshToken } = linkGoogleSchema.parse(
      req.body
    );

    const repositories = createRepositories(db);

    // Check if this Google account is already linked to another user
    const existingAccount =
      await repositories.account.findByProviderAndProviderAccountId(
        "google",
        googleId
      );

    if (existingAccount && existingAccount.userId !== session.user.id) {
      return res.status(409).json({
        message: "このGoogleアカウントは既に別のユーザーに関連付けられています",
      });
    }

    // Check if the current user already has a Google account linked
    const userGoogleAccount =
      await repositories.account.findByProviderAndUserId(
        "google",
        session.user.id
      );

    if (userGoogleAccount) {
      return res.status(409).json({
        message: "このユーザーには既にGoogleアカウントが関連付けられています",
      });
    }

    // Link the Google account
    await repositories.account.create({
      userId: session.user.id,
      type: "oauth",
      provider: "google",
      providerAccountId: googleId,
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    return res.status(200).json({
      success: true,
      message: "Googleアカウントが正常に関連付けられました",
    });
  } catch (error) {
    console.error("Google account linking error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "入力データが正しくありません",
        errors: error.issues,
      });
    }

    return res.status(500).json({
      message: "内部サーバーエラーが発生しました",
    });
  }
}
