import { Resend } from "resend";
import { MagicLinkEmail } from "~/components/email/MagicLinkEmail";
import { AdminInviteEmail } from "~/components/email/AdminInviteEmail";
import { env } from "~/env";

const resend = new Resend(env.RESEND_API_KEY);

/**
 * メール送信元アドレスを取得
 * 環境変数から取得し、表示名「DJ Bingo」を付与
 */
const getFromEmail = (): string => {
  const emailAddress = env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  return `DJ Bingo <${emailAddress}>`;
};

/**
 * Magic Linkメールを送信
 */
export const sendMagicLinkEmail = async ({
  email,
  url,
  host,
}: {
  email: string;
  url: string;
  host: string;
}) => {
  try {
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: [email],
      subject: `DJ Bingoにログイン`,
      react: MagicLinkEmail({ url, host }),
    });

    if (error) {
      console.error("Failed to send magic link email:", error);
      throw new Error("Failed to send verification email");
    }

    console.log("✅ Magic link email sent to:", email, data);
    return { success: true, data };
  } catch (error) {
    console.error("Error sending magic link:", error);
    throw error;
  }
};

/**
 * 管理者招待メールを送信
 */
export const sendAdminInviteEmail = async ({
  to,
  adminName,
  gameTitle,
  inviterName,
  loginUrl,
}: {
  to: string;
  adminName: string;
  gameTitle: string;
  inviterName: string;
  loginUrl: string;
}) => {
  try {
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: [to],
      subject: `DJ Bingoゲーム「${gameTitle}」の管理者に追加されました`,
      react: AdminInviteEmail({
        adminName,
        gameTitle,
        inviterName,
        loginUrl,
      }),
    });

    if (error) {
      console.error("Failed to send admin invite email:", error);
      throw new Error("Failed to send admin invite email");
    }

    console.log("✅ Admin invite email sent to:", to, data);
    return { success: true, data };
  } catch (error) {
    console.error("Error sending admin invite email:", error);
    throw error;
  }
};
