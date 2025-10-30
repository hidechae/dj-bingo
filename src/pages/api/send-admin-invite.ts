import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "~/env";
import { getServerAuthSession } from "~/server/auth";
import { sendAdminInviteEmail } from "~/server/services/emailService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // POSTメソッドのみ許可
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 認証チェック
    const session = await getServerAuthSession({ req, res });
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { to, adminName, gameTitle, inviterName, loginUrl } = req.body as {
      to: string;
      adminName: string;
      gameTitle: string;
      inviterName: string;
      loginUrl: string;
    };

    // 必須パラメータのチェック
    if (!to || !adminName || !gameTitle || !inviterName || !loginUrl) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Resend APIキーが設定されていない場合はエラー
    if (!env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      return res.status(500).json({
        error: "Email service is not configured",
      });
    }

    // メール送信
    const result = await sendAdminInviteEmail({
      to,
      adminName,
      gameTitle,
      inviterName,
      loginUrl,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in send-admin-invite API:", error);
    return res.status(500).json({
      error: "Failed to send email",
    });
  }
}
