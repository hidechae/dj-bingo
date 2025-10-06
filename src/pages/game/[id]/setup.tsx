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
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <SetupHeader
              gameTitle={participant.bingoGame.title}
              selectedCount={selectedCount}
              totalPositions={totalPositions}
              selectedPosition={selectedPosition}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

            <div className="mt-8 flex justify-between items-center">
              <button
                onClick={handleClearAll}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                すべてクリア
              </button>

              <button
                onClick={handleSubmit}
                disabled={
                  selectedCount !== totalPositions ||
                  assignSongsMutation.isPending
                }
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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
