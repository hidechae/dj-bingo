import { type NextPage } from "next";
import Head from "next/head";
import { signIn, getProviders } from "next-auth/react";
import { type GetServerSideProps } from "next";
import { type LiteralUnion, type ClientSafeProvider } from "next-auth/react";
import { type BuiltInProviderType } from "next-auth/providers/index";

interface SignInProps {
  providers: Record<
    LiteralUnion<BuiltInProviderType>,
    ClientSafeProvider
  > | null;
}

const SignIn: NextPage<SignInProps> = ({ providers }) => {
  // デバッグ用：コンソールに出力
  console.log("Providers:", providers);

  return (
    <>
      <Head>
        <title>ログイン - DJ Bingo</title>
        <meta name="description" content="DJ Bingo 管理者ログイン" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-linear-to-b from-[#2e026d] to-[#15162c]">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-[3rem]">
            管理者ログイン
          </h1>

          {!providers || Object.keys(providers).length === 0 ? (
            <div className="text-center text-white">
              <p className="mb-2 text-xl">
                認証プロバイダーが設定されていません
              </p>
              <p className="text-sm text-white/70">
                環境変数を確認してください
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {Object.values(providers).map((provider) => (
                <button
                  key={provider.name}
                  onClick={() => signIn(provider.id, { callbackUrl: "/admin" })}
                  className="cursor-pointer rounded-lg bg-white px-8 py-4 text-lg font-semibold text-gray-900 transition-colors hover:bg-gray-100"
                >
                  {provider.name}でサインイン
                </button>
              ))}
            </div>
          )}

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
