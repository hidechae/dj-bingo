import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { api } from "~/utils/api";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useInitialLoading } from "~/hooks/useInitialLoading";
import { ConfirmDialog } from "~/components/ui/ConfirmDialog";

const AdminDashboard: NextPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeGameDropdown, setActiveGameDropdown] = useState<string | null>(
    null
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingGame, setDeletingGame] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const utils = api.useUtils();
  const { data: bingoGames, isLoading } = api.bingo.getAllByUser.useQuery(
    undefined,
    { enabled: !!session }
  );

  const deleteMutation = api.bingo.delete.useMutation({
    onSuccess: () => {
      // Refetch the games list after deletion
      void utils.bingo.getAllByUser.invalidate();
    },
    onError: (error) => {
      alert(`削除に失敗しました: ${error.message}`);
    },
  });

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-dropdown]")) {
        setShowDropdown(false);
        setActiveGameDropdown(null);
      }
    };

    if (showDropdown || activeGameDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown, activeGameDropdown]);

  const handleDeleteGame = (gameId: string, gameTitle: string) => {
    if (deleteMutation.isPending) return;
    setDeletingGame({ id: gameId, title: gameTitle });
    setShowDeleteConfirm(true);
  };

  const confirmDeleteGame = () => {
    if (!deletingGame) return;
    deleteMutation.mutate({ gameId: deletingGame.id });
    setShowDeleteConfirm(false);
    setDeletingGame(null);
  };

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
        <div className="sticky top-0 z-50 bg-white shadow-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <h1 className="text-xl font-semibold text-gray-900">
                DJ Bingo 管理画面
              </h1>
              <div className="relative" data-dropdown>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="cursor-pointer rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  title="メニュー"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </button>
                {showDropdown && (
                  <div className="ring-opacity-5 absolute right-0 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          void router.push("/admin/profile");
                        }}
                        className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                      >
                        マイページ
                      </button>
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          void signOut();
                        }}
                        className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                      >
                        ログアウト
                      </button>
                    </div>
                  </div>
                )}
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
                  className="relative overflow-hidden rounded-lg bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <Link
                    href={`/admin/game/${game.id}`}
                    className="block cursor-pointer p-6"
                  >
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
                  </Link>
                  <div className="absolute top-2 right-2" data-dropdown>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveGameDropdown(
                          activeGameDropdown === game.id ? null : game.id
                        );
                      }}
                      className="cursor-pointer rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title="メニュー"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                        />
                      </svg>
                    </button>
                    {activeGameDropdown === game.id && (
                      <div className="ring-opacity-5 absolute right-0 z-10 mt-2 w-32 rounded-md bg-white shadow-lg ring-1 ring-black">
                        <div className="py-1">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setActiveGameDropdown(null);
                              handleDeleteGame(game.id, game.title);
                            }}
                            disabled={deleteMutation.isPending}
                            className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deleteMutation.isPending ? "削除中..." : "削除"}
                          </button>
                        </div>
                      </div>
                    )}
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

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="ビンゴの削除"
        message={`「${deletingGame?.title}」を削除しますか？この操作は取り消せません。\n関連する楽曲、参加者データもすべて削除されます。`}
        confirmLabel="削除"
        confirmVariant="danger"
        onConfirm={confirmDeleteGame}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeletingGame(null);
        }}
      />
    </>
  );
};

export default AdminDashboard;
