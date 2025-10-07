import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useSession } from "next-auth/react";

const Home: NextPage = () => {
  const { data: session } = useSession();

  return (
    <>
      <Head>
        <title>DJ Bingo</title>
        <meta name="description" content="Interactive DJ Bingo game" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-linear-to-b from-[#2e026d] to-[#15162c]">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            DJ <span className="text-[hsl(280,100%,70%)]">Bingo</span>
          </h1>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
            {session ? (
              <Link
                className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20"
                href="/admin"
              >
                <h3 className="text-2xl font-bold">管理者画面 →</h3>
                <div className="text-lg">
                  ビンゴゲームの作成・管理を行います
                </div>
              </Link>
            ) : (
              <Link
                className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20"
                href="/auth/signin"
              >
                <h3 className="text-2xl font-bold">管理者ログイン →</h3>
                <div className="text-lg">
                  Google認証でログインしてビンゴを作成
                </div>
              </Link>
            )}

            <div className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white">
              <h3 className="text-2xl font-bold">参加者の方</h3>
              <div className="text-lg">
                QRコードを読み込んで参加してください
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;
