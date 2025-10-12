import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { signIn, getProviders } from "next-auth/react";
import { type GetServerSideProps } from "next";
import { type LiteralUnion, type ClientSafeProvider } from "next-auth/react";
import { type BuiltInProviderType } from "next-auth/providers/index";
import { useState } from "react";
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
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // デバッグ用：コンソールに出力
  console.log("Providers:", providers);
  console.log("Provider IDs:", providers ? Object.keys(providers) : "No providers");

  // Filter out credentials provider from OAuth providers for display
  const oauthProviders = providers ? Object.values(providers).filter(provider => provider.id !== "credentials") : [];
  const hasCredentialsProvider = providers ? Object.values(providers).some(provider => provider.id === "credentials") : false;
  
  // Additional debugging
  console.log("OAuth Providers:", oauthProviders.map(p => p.id));
  console.log("Has Credentials Provider:", hasCredentialsProvider);

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("メールアドレスまたはパスワードが正しくありません");
      } else if (result?.ok) {
        await router.push("/admin");
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
      <main className="flex min-h-screen flex-col items-center justify-center bg-linear-to-b from-[#2e026d] to-[#15162c]">
        <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16 max-w-md">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-[3rem]">
            管理者ログイン
          </h1>

          <div className="w-full flex flex-col gap-6">
            {/* Email/Password Authentication Form - Always show as fallback */}
            {(hasCredentialsProvider || (!providers || Object.keys(providers).length === 0)) && (
              <div>
                {(!providers || Object.keys(providers).length === 0) && (
                  <div className="text-center text-white mb-4">
                    <p className="text-sm text-white/70">
                      プロバイダーの読み込み中またはメール認証のみ利用可能
                    </p>
                  </div>
                )}
                <div className="bg-white/10 rounded-lg p-6">
                  <form onSubmit={handleCredentialsSignIn} className="flex flex-col gap-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
                        メールアドレス
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="example@example.com"
                      />
                    </div>
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-white mb-1">
                        パスワード
                      </label>
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="パスワードを入力"
                      />
                    </div>
                    {error && (
                      <div className="text-red-300 text-sm text-center">
                        {error}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? "ログイン中..." : "ログイン"}
                    </button>
                  </form>
                  <div className="mt-4 text-center">
                    <Link
                      href="/auth/register"
                      className="text-blue-300 hover:text-blue-200 text-sm underline"
                    >
                      アカウントをお持ちでない方はこちら
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* OAuth Providers */}
            {oauthProviders.length > 0 && (
                <div className="flex flex-col gap-3">
                  {(hasCredentialsProvider || (!providers || Object.keys(providers).length === 0)) && (
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/30" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white/70">または</span>
                      </div>
                    </div>
                  )}
                  {oauthProviders.map((provider) => (
                    <button
                      key={provider.name}
                      onClick={() => signIn(provider.id, { callbackUrl: "/admin" })}
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
  const providers = await getProviders();
  return {
    props: { providers: providers ?? {} },
  };
};

export default SignIn;
