import { type NextApiRequest, type NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";
import { createRepositories } from "~/server/repositories";
import { db } from "~/server/db";
import { env } from "~/env";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { code, state, error } = req.query;

    if (error) {
      console.error("Google OAuth error:", error);
      return res.redirect("/admin/profile?error=oauth_error");
    }

    if (!code || !state) {
      return res.redirect("/admin/profile?error=missing_parameters");
    }

    // Verify state parameter
    const stateStr = Array.isArray(state) ? state[0] : state;
    if (!stateStr?.startsWith("link_")) {
      return res.redirect("/admin/profile?error=invalid_state");
    }

    const userId = stateStr.replace("link_", "");

    // Get current session and verify user
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id || session.user.id !== userId) {
      return res.redirect("/admin/profile?error=unauthorized");
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code: Array.isArray(code) ? code[0]! : (code as string),
        client_id: env.GOOGLE_CLIENT_ID!,
        client_secret: env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/callback/google-link`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", await tokenResponse.text());
      return res.redirect("/admin/profile?error=token_exchange_failed");
    }

    const tokens = await tokenResponse.json();

    // Get user info from Google
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      console.error("User info fetch failed:", await userInfoResponse.text());
      return res.redirect("/admin/profile?error=user_info_failed");
    }

    const googleUser = await userInfoResponse.json();

    const repositories = createRepositories(db);

    // Check if this Google account is already linked to another user
    const existingAccount =
      await repositories.account.findByProviderAndProviderAccountId(
        "google",
        googleUser.id
      );

    if (existingAccount && existingAccount.userId !== userId) {
      return res.redirect("/admin/profile?error=account_already_linked");
    }

    // Check if the current user already has a Google account linked
    const userGoogleAccount =
      await repositories.account.findByProviderAndUserId("google", userId);

    if (userGoogleAccount) {
      return res.redirect("/admin/profile?error=user_already_has_google");
    }

    // Link the Google account
    await repositories.account.create({
      userId,
      type: "oauth",
      provider: "google",
      providerAccountId: googleUser.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_in
        ? Math.floor(Date.now() / 1000) + tokens.expires_in
        : null,
      token_type: tokens.token_type,
      scope: tokens.scope,
      id_token: tokens.id_token,
    });

    // Redirect to profile page with success message
    return res.redirect("/admin/profile?success=google_linked");
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return res.redirect("/admin/profile?error=internal_error");
  }
}
