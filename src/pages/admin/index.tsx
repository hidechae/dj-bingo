import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { api } from "~/utils/api";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const AdminDashboard: NextPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const { data: bingoGames, isLoading, refetch } = api.bingo.getAllByUser.useQuery(
    undefined,
    { enabled: !!session }
  );

  const duplicateMutation = api.bingo.duplicate.useMutation({
    onSuccess: (data) => {
      void refetch();
      void router.push(`/admin/game/${data.id}`);
      setDuplicatingId(null);
    },
    onError: () => {
      setDuplicatingId(null);
    },
  });

  const handleQuickDuplicate = (gameId: string) => {
    if (duplicatingId || duplicateMutation.isLoading) return; // Prevent multiple duplications
    setDuplicatingId(gameId);
    duplicateMutation.mutate({ gameId });
  };

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
                <div
                  key={game.id}
                  className="overflow-hidden rounded-lg bg-white shadow-sm"
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
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={`/admin/game/${game.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        管理
                      </Link>
                      <Link
                        href={`/game/${game.id}`}
                        className="text-sm font-medium text-green-600 hover:text-green-800"
                      >
                        参加用URL
                      </Link>
                      <button
                        onClick={() => handleQuickDuplicate(game.id)}
                        disabled={duplicatingId === game.id || duplicateMutation.isLoading}
                        className="text-sm font-medium text-purple-600 hover:text-purple-800 disabled:opacity-50"
                      >
                        {duplicatingId === game.id ? "複製中..." : "クイック複製"}
                      </button>
                      <Link
                        href={`/admin/duplicate/${game.id}`}
                        className="text-sm font-medium text-orange-600 hover:text-orange-800"
                      >
                        編集して複製
                      </Link>
                    </div>
                  </div>
                </div>
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
