import { type NextApiRequest, type NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";
import { env } from "~/env";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if Google OAuth is configured
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      return res.status(500).json({ message: "Google OAuth not configured" });
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const redirectUri = `${baseUrl}/api/auth/callback/google-link`;

    // Create Google OAuth URL with specific parameters for linking
    const googleOAuthUrl = new URL(
      "https://accounts.google.com/o/oauth2/v2/auth"
    );
    googleOAuthUrl.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
    googleOAuthUrl.searchParams.set("redirect_uri", redirectUri);
    googleOAuthUrl.searchParams.set("response_type", "code");
    googleOAuthUrl.searchParams.set("scope", "openid email profile");
    googleOAuthUrl.searchParams.set("state", `link_${session.user.id}`);
    googleOAuthUrl.searchParams.set("access_type", "offline");
    googleOAuthUrl.searchParams.set("prompt", "consent");

    // Redirect to Google OAuth
    res.redirect(302, googleOAuthUrl.toString());
  } catch (error) {
    console.error("Google OAuth linking error:", error);
    return res.status(500).json({
      message: "内部サーバーエラーが発生しました",
    });
  }
}
