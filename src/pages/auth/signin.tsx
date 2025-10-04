import { type NextPage } from "next";
import Head from "next/head";
import { signIn, getProviders } from "next-auth/react";
import { type GetServerSideProps } from "next";

interface SignInProps {
  providers: any;
}

const SignIn: NextPage<SignInProps> = ({ providers }) => {
  return (
    <>
      <Head>
        <title>ログイン - DJ Bingo</title>
        <meta name="description" content="DJ Bingo 管理者ログイン" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-[3rem]">
            管理者ログイン
          </h1>
          
          <div className="flex flex-col gap-4">
            {Object.values(providers).map((provider: any) => (
              <button
                key={provider.name}
                onClick={() => signIn(provider.id, { callbackUrl: "/admin" })}
                className="rounded-lg bg-white px-8 py-4 text-lg font-semibold text-gray-900 hover:bg-gray-100 transition-colors"
              >
                {provider.name}でサインイン
              </button>
            ))}
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