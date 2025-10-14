import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { api } from "~/utils/api";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useInitialLoading } from "~/hooks/useInitialLoading";

const AdminDashboard: NextPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: bingoGames, isLoading } = api.bingo.getAllByUser.useQuery(
    undefined,
    { enabled: !!session }
  );

  // 重要な初期データロード中はグローバルローディングを表示
  useInitialLoading({
    isLoading: status === "loading" || (!!session && isLoading),
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      void router.push("/auth/signin");
    }
  }, [session, status, router]);

  if (status === "loading" || (!!session && isLoading)) {
    return null; // グローバルローディングオーバーレイが表示される
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <Head>
        <title>管理者ダッシュボード - DJ Bingo</title>
        <meta name="description" content="DJ Bingo 管理者ダッシュボード" />
      </Head>
      <main className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <h1 className="text-xl font-semibold text-gray-900">
                DJ Bingo 管理画面
              </h1>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {session.user?.name}さん
                </span>
                <Link
                  href="/admin/profile"
                  className="cursor-pointer text-sm text-gray-500 hover:text-gray-700"
                >
                  プロフィール
                </Link>
                <button
                  onClick={() => signOut()}
                  className="cursor-pointer text-sm text-gray-500 hover:text-gray-700"
                >
                  ログアウト
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              ビンゴゲーム一覧
            </h2>
            <Link
              href="/admin/create"
              className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              新しいビンゴを作成
            </Link>
          </div>

          {bingoGames && bingoGames.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {bingoGames.map((game) => (
                <Link
                  key={game.id}
                  href={`/admin/game/${game.id}`}
                  className="block cursor-pointer overflow-hidden rounded-lg bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="p-6">
                    <h3 className="mb-2 text-lg font-medium text-gray-900">
                      {game.title}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-500">
                      <p>サイズ: {game.size}</p>
                      <p>楽曲数: {game.songs.length}</p>
                      <p>参加者数: {game.participants.length}</p>
                      <p>
                        作成日: {new Date(game.createdAt).toLocaleDateString()}
                      </p>
                      <div className="mt-2">
                        {game.createdBy === session.user.id ? (
                          <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                            作成者
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                            管理者
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-lg text-gray-500">
                まだビンゴゲームがありません
              </p>
              <Link
                href="/admin/create"
                className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
              >
                最初のビンゴを作成する
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default AdminDashboard;
