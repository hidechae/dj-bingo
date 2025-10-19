import { type NextPage } from "next";
import Head from "next/head";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { api, type RouterOutputs } from "~/utils/api";
import { BingoSize } from "~/types";
import { useInitialLoading } from "~/hooks/useInitialLoading";

const CreateBingo: NextPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [size, setSize] = useState<BingoSize>(BingoSize.THREE_BY_THREE);

  const createBingoMutation = api.bingo.create.useMutation({
    onSuccess: (data: RouterOutputs["bingo"]["create"]) => {
      void router.push(`/admin/game/${data.id}`);
    },
  });

  // 認証チェック中はグローバルローディングを表示
  useInitialLoading({ isLoading: status === "loading" });

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      void router.push("/auth/signin");
    }
  }, [session, status, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createBingoMutation.mutate({
      title,
      size,
      songs: [],
    });
  };

  if (status === "loading") {
    return null; // グローバルローディングオーバーレイが表示される
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <Head>
        <title>ビンゴ作成 - DJ Bingo</title>
        <meta name="description" content="新しいビンゴゲームを作成" />
      </Head>
      <main className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-50 bg-white shadow-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center gap-4">
              <button
                onClick={() => router.back()}
                className="cursor-pointer text-gray-500 hover:text-gray-700"
                title="戻る"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                新しいビンゴを作成
              </h1>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="rounded-lg bg-white px-6 py-8 shadow-sm">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    ビンゴ名
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-xs focus:border-blue-500 focus:ring-blue-500"
                    placeholder="例: 2025年ヒット曲ビンゴ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    ビンゴサイズ
                  </label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value as BingoSize)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-xs focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value={BingoSize.THREE_BY_THREE}>3x3 (9曲)</option>
                    <option value={BingoSize.FOUR_BY_FOUR}>4x4 (16曲)</option>
                    <option value={BingoSize.FIVE_BY_FIVE}>5x5 (25曲)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={createBingoMutation.isPending}
                className="cursor-pointer rounded-lg bg-blue-600 px-8 py-3 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createBingoMutation.isPending ? "作成中..." : "ビンゴを作成"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
};

export default CreateBingo;
