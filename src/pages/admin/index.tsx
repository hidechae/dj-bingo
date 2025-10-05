import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { api } from "~/utils/api";
import { useRouter } from "next/router";
import { useEffect } from "react";

const AdminDashboard: NextPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: bingoGames, isLoading } = api.bingo.getAllByUser.useQuery(
    undefined,
    { enabled: !!session }
  );

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      void router.push("/auth/signin");
    }
  }, [session, status, router]);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
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
        <div className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                DJ Bingo 管理画面
              </h1>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {session.user?.name}さん
                </span>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ログアウト
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">ビンゴゲーム一覧</h2>
            <Link
              href="/admin/create"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              新しいビンゴを作成
            </Link>
          </div>

          {bingoGames && bingoGames.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {bingoGames.map((game: any) => (
                <div
                  key={game.id}
                  className="bg-white overflow-hidden shadow rounded-lg"
                >
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {game.title}
                    </h3>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>サイズ: {game.size}</p>
                      <p>楽曲数: {game.songs.length}</p>
                      <p>参加者数: {game.participants.length}</p>
                      <p>作成日: {new Date(game.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Link
                        href={`/admin/game/${game.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        管理
                      </Link>
                      <Link
                        href={`/game/${game.id}`}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        参加用URL
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                まだビンゴゲームがありません
              </p>
              <Link
                href="/admin/create"
                className="mt-4 inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
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