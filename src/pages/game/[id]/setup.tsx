import { type NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import { useBingoSetup } from "~/hooks/useBingoSetup";
import { SetupHeader } from "~/components/bingo/SetupHeader";
import { SetupGrid } from "~/components/bingo/SetupGrid";
import { SongSelectionModal } from "~/components/bingo/SongSelectionModal";
import { ConfirmModal } from "~/components/bingo/ConfirmModal";
import { useInitialLoading } from "~/hooks/useInitialLoading";
import { useAlert } from "~/hooks/useAlert";

const SetupBingo: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [confirmAction, setConfirmAction] = useState<
    "clear" | "auto" | "submit" | null
  >(null);
  const { showAlert, AlertComponent } = useAlert();

  const {
    participant,
    selectedSongs,
    gridSize,
    selectedPosition,
    isModalOpen,
    assignSongsMutation,
    handlePositionSelect,
    handleSongAssign,
    handleClearPosition,
    handleClearAll,
    handleAutoSetup,
    handleSubmit,
    handleModalClose,
    isSongUsed,
  } = useBingoSetup(id, {
    onAlert: (message, options) => {
      showAlert(message, {
        variant: options?.variant || "info",
        title: options?.variant === "error" ? "エラー" : "お知らせ",
      });
    },
  });

  // 初期ロード中はグローバルローディングを表示
  useInitialLoading({ isLoading: !participant || !participant?.bingoGame });

  const handleConfirmAction = () => {
    if (confirmAction === "clear") {
      handleClearAll();
    } else if (confirmAction === "auto") {
      handleAutoSetup();
    } else if (confirmAction === "submit") {
      handleSubmit();
    }
    setConfirmAction(null);
  };

  if (!participant || !participant.bingoGame) {
    return null; // ローディングオーバーレイが表示されるため、この画面は不要
  }

  const availableSongs = participant.bingoGame.songs;
  const totalPositions = gridSize * gridSize;
  const selectedCount = Object.keys(selectedSongs).length;

  const confirmConfig = {
    clear: {
      title: "すべてクリア",
      message:
        "設定した楽曲をすべてクリアします。この操作は取り消せません。よろしいですか？",
      confirmText: "クリアする",
      confirmButtonColor: "red" as const,
    },
    auto: {
      title: "ランダム設定",
      message:
        "利用可能な楽曲からランダムに選択してグリッドを埋めます。現在の設定は上書きされます。よろしいですか？",
      confirmText: "ランダム設定する",
      confirmButtonColor: "green" as const,
    },
    submit: {
      title: "ビンゴを開始",
      message:
        "この設定でビンゴを開始します。開始後は楽曲の変更ができません。よろしいですか？",
      confirmText: "ビンゴを開始",
      confirmButtonColor: "blue" as const,
    },
  };

  return (
    <>
      <AlertComponent />
      <Head>
        <title>ビンゴ設定 - {participant.bingoGame.title}</title>
        <meta name="description" content="ビンゴの楽曲を設定" />
      </Head>
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-4xl px-4">
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <SetupHeader
              gameTitle={participant.bingoGame.title}
              selectedCount={selectedCount}
              totalPositions={totalPositions}
              selectedPosition={selectedPosition}
            />

            <SetupGrid
              gridSize={gridSize}
              selectedSongs={selectedSongs}
              selectedPosition={selectedPosition}
              availableSongs={availableSongs}
              onPositionSelect={handlePositionSelect}
              onClearPosition={handleClearPosition}
            />

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <button
                  onClick={() => setConfirmAction("clear")}
                  className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-800"
                >
                  すべてクリア
                </button>
                <button
                  onClick={() => setConfirmAction("auto")}
                  disabled={availableSongs.length < totalPositions}
                  className="cursor-pointer rounded-lg bg-green-600 px-6 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  title={
                    availableSongs.length < totalPositions
                      ? `楽曲数が不足しています（必要: ${totalPositions}曲、利用可能: ${availableSongs.length}曲）`
                      : "ランダムに楽曲を自動設定"
                  }
                >
                  ランダム設定
                </button>
              </div>

              <button
                onClick={() => setConfirmAction("submit")}
                disabled={
                  selectedCount !== totalPositions ||
                  assignSongsMutation.isPending
                }
                className="cursor-pointer rounded-lg bg-blue-600 px-8 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {assignSongsMutation.isPending ? "設定中..." : "ビンゴを開始"}
              </button>
            </div>
          </div>
        </div>

        <SongSelectionModal
          isOpen={isModalOpen}
          songs={availableSongs}
          selectedPosition={selectedPosition}
          isSongUsed={isSongUsed}
          onSongSelect={handleSongAssign}
          onClose={handleModalClose}
        />

        {confirmAction && (
          <ConfirmModal
            isOpen={!!confirmAction}
            title={confirmConfig[confirmAction].title}
            message={confirmConfig[confirmAction].message}
            confirmText={confirmConfig[confirmAction].confirmText}
            confirmButtonColor={confirmConfig[confirmAction].confirmButtonColor}
            onConfirm={handleConfirmAction}
            onCancel={() => setConfirmAction(null)}
          />
        )}
      </main>
    </>
  );
};

export default SetupBingo;
