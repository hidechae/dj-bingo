import { type NextPage } from "next";
import Head from "next/head";
import { signIn, getProviders } from "next-auth/react";
import { type GetServerSideProps } from "next";
import { type LiteralUnion, type ClientSafeProvider } from "next-auth/react";
import { type BuiltInProviderType } from "next-auth/providers/index";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

interface SignInProps {
  providers: Record<
    LiteralUnion<BuiltInProviderType>,
    ClientSafeProvider
  > | null;
}

const SignIn: NextPage<SignInProps> = ({ providers }) => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  // URLパラメータからエラーを取得
  useEffect(() => {
    if (router.query.error === "OAuthAccountNotLinked") {
      setError(
        "このメールアドレスは既に別の方法で登録されています。最初に使用した方法でログインしてください。"
      );
    }
  }, [router.query.error]);

  // デバッグ用：コンソールに出力
  console.log("Providers:", providers);
  console.log(
    "Provider IDs:",
    providers ? Object.keys(providers) : "No providers"
  );

  // Filter out email provider from OAuth providers for display
  const oauthProviders = providers
    ? Object.values(providers).filter((provider) => provider.id !== "email")
    : [];
  const hasEmailProvider = providers
    ? Object.values(providers).some((provider) => provider.id === "email")
    : false;

  // Additional debugging
  console.log(
    "OAuth Providers:",
    oauthProviders.map((p) => p.id)
  );
  console.log("Has Email Provider:", hasEmailProvider);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("email", {
        email,
        redirect: false,
        callbackUrl: "/admin",
      });

      if (result?.error) {
        setError("メール送信に失敗しました。もう一度お試しください。");
      } else if (result?.ok) {
        setEmailSent(true);
      }
    } catch (err) {
      console.error("Sign in error:", err);
      setError("ログインに失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>ログイン - DJ Bingo</title>
        <meta name="description" content="DJ Bingo 管理者ログイン" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="container flex max-w-md flex-col items-center justify-center gap-8 px-4 py-16">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-[3rem]">
            管理者ログイン
          </h1>

          {/* グローバルエラーメッセージ */}
          {error && router.query.error && (
            <div className="w-full rounded-lg border border-red-500/50 bg-red-500/20 p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-200">{error}</p>
                  <p className="mt-1 text-xs text-red-300">
                    アカウントを連携したい場合は、マイページから設定できます。
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex w-full flex-col gap-6">
            {/* Email Authentication Form - Passwordless */}
            {(hasEmailProvider ||
              !providers ||
              Object.keys(providers).length === 0) && (
              <div>
                {emailSent ? (
                  <div className="rounded-lg bg-white/10 p-6">
                    <div className="text-center">
                      <div className="mb-4 flex justify-center">
                        <div className="rounded-full bg-green-600 p-3">
                          <svg
                            className="h-8 w-8 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      </div>
                      <h2 className="mb-2 text-xl font-bold text-white">
                        メールを送信しました
                      </h2>
                      <p className="mb-4 text-white/70">
                        {email}にログインリンクを送信しました。
                        <br />
                        メールをご確認ください。
                      </p>
                      <p className="text-sm text-white/50">
                        リンクは10分間有効です。
                      </p>
                      <p className="mt-3 text-sm text-yellow-300/80">
                        ⚠️
                        メールが届かない場合は、迷惑メールフォルダもご確認ください。
                      </p>
                      <button
                        onClick={() => {
                          setEmailSent(false);
                          setEmail("");
                        }}
                        className="mt-4 text-sm text-blue-300 underline hover:text-blue-200"
                      >
                        別のメールアドレスでログイン
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-white/10 p-6">
                    <form
                      onSubmit={handleEmailSignIn}
                      className="flex flex-col gap-4"
                    >
                      <div>
                        <label
                          htmlFor="email"
                          className="mb-1 block text-sm font-medium text-white"
                        >
                          メールアドレス
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full rounded-md border-2 border-white/30 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          placeholder="example@example.com"
                        />
                        <p className="mt-1 text-xs text-white/60">
                          ログインリンクをメールで送信します
                        </p>
                      </div>
                      {error && (
                        <div className="text-center text-sm text-red-300">
                          {error}
                        </div>
                      )}
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isLoading ? "送信中..." : "ログインリンクを送信"}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* OAuth Providers */}
            {oauthProviders.length > 0 && !emailSent && (
              <div className="flex flex-col gap-3">
                {(hasEmailProvider ||
                  !providers ||
                  Object.keys(providers).length === 0) && (
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/30" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-gradient-to-b from-[#2e026d] to-[#15162c] px-2 text-white/70">
                        または
                      </span>
                    </div>
                  </div>
                )}
                {oauthProviders.map((provider) => (
                  <button
                    key={provider.name}
                    onClick={() =>
                      signIn(provider.id, { callbackUrl: "/admin" })
                    }
                    className="w-full cursor-pointer rounded-lg bg-white px-8 py-4 text-lg font-semibold text-gray-900 transition-colors hover:bg-gray-100"
                  >
                    {provider.name}でサインイン
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="text-center text-white/70">
            <p>管理者のみがビンゴゲームを作成・管理できます</p>
          </div>
        </div>
      </main>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  console.log("🔄 SIGNIN PAGE - getServerSideProps called");

  try {
    const providers = await getProviders();
    console.log("📋 PROVIDERS LOADED:");

    if (providers) {
      const providerIds = Object.keys(providers);
      console.log(`  - Total providers: ${providerIds.length}`);
      providerIds.forEach((id) => {
        console.log(`  - ${id}: ${providers[id]?.name}`);
      });

      const hasEmail = providerIds.includes("email");
      const hasGoogle = providerIds.includes("google");
      console.log(`  - Has email provider: ${hasEmail}`);
      console.log(`  - Has Google provider: ${hasGoogle}`);
    } else {
      console.log("  - No providers found (null/undefined)");
    }

    return {
      props: { providers: providers ?? {} },
    };
  } catch (error) {
    console.error("❌ Error in getServerSideProps:", error);
    return {
      props: { providers: {} },
    };
  }
};

export default SignIn;
