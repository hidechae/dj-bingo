import { type NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useBingoSetup } from "~/hooks/useBingoSetup";
import { SetupHeader } from "~/components/bingo/SetupHeader";
import { SetupGrid } from "~/components/bingo/SetupGrid";
import { SongSelectionList } from "~/components/bingo/SongSelectionList";

const SetupBingo: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;

  const {
    participant,
    selectedSongs,
    gridSize,
    selectedPosition,
    assignSongsMutation,
    handlePositionSelect,
    handleSongAssign,
    handleClearPosition,
    handleClearAll,
    handleSubmit,
    isSongUsed,
  } = useBingoSetup(id);

  if (!participant) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  const availableSongs = participant.bingoGame.songs;
  const totalPositions = gridSize * gridSize;
  const selectedCount = Object.keys(selectedSongs).length;

  return (
    <>
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

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <SetupGrid
                gridSize={gridSize}
                selectedSongs={selectedSongs}
                selectedPosition={selectedPosition}
                availableSongs={availableSongs}
                onPositionSelect={handlePositionSelect}
                onClearPosition={handleClearPosition}
              />

              <SongSelectionList
                songs={availableSongs}
                selectedPosition={selectedPosition}
                isSongUsed={isSongUsed}
                onSongAssign={handleSongAssign}
              />
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={handleClearAll}
                className="px-4 py-2 text-gray-600 transition-colors hover:text-gray-800"
              >
                すべてクリア
              </button>

              <button
                onClick={handleSubmit}
                disabled={
                  selectedCount !== totalPositions ||
                  assignSongsMutation.isPending
                }
                className="rounded-lg bg-blue-600 px-8 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {assignSongsMutation.isPending ? "設定中..." : "ビンゴを開始"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default SetupBingo;
