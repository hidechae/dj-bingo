import { type NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import { useBingoPlay } from "~/hooks/useBingoPlay";
import { WinnerBanner } from "~/components/bingo/WinnerBanner";
import { BingoGrid } from "~/components/bingo/BingoGrid";
import { IncompleteGridWarning } from "~/components/bingo/IncompleteGridWarning";
import { WinStatus } from "~/components/bingo/WinStatus";
import { RecentlyPlayedSongs } from "~/components/bingo/RecentlyPlayedSongs";

const PlayBingo: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [continueWithIncompleteGrid, setContinueWithIncompleteGrid] =
    useState(false);

  const { bingoStatus, refetch } = useBingoPlay(id);

  if (!bingoStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  const { participant, grid, gridSize, hasWon } = bingoStatus;
  const playedSongsCount = grid.filter((cell: any) => cell?.isPlayed).length;
  const totalSongs = participant.bingoGame.songs.length;
  const playedSongs = participant.bingoGame.songs.filter(
    (s: any) => s.isPlayed
  );

  return (
    <>
      <Head>
        <title>ビンゴプレイ - {participant.bingoGame.title}</title>
        <meta name="description" content="ビンゴゲームプレイ中" />
      </Head>
      <main className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c] py-4">
        <div className="max-w-4xl mx-auto px-4">
          <WinnerBanner hasWon={hasWon} />

          <div className="bg-white rounded-lg shadow-xl p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {participant.bingoGame.title}
              </h1>
              <h2 className="text-lg text-gray-700 mb-1">
                {participant.name}さんのビンゴ
              </h2>
              <p className="text-sm text-gray-500">
                演奏済み楽曲: {playedSongs.length} / {totalSongs} | あなたのマス:{" "}
                {playedSongsCount} / {grid.length}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Bingo Grid */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 text-center">
                  ビンゴグリッド
                </h3>

                <IncompleteGridWarning
                  isGridComplete={participant.isGridComplete}
                  gameStatus={participant.bingoGame.status}
                  gameId={id}
                  continueWithIncompleteGrid={continueWithIncompleteGrid}
                  onContinue={() => setContinueWithIncompleteGrid(true)}
                  onGoToSetup={() => router.push(`/game/${id}/setup`)}
                />

                <BingoGrid grid={grid} gridSize={gridSize} />

                {/* Win Status */}
                <div className="text-center mt-6">
                  <WinStatus
                    hasWon={hasWon}
                    wonAt={participant.wonAt}
                    grid={grid}
                    gridSize={gridSize}
                  />
                </div>
              </div>

              {/* Recently Played Songs */}
              <RecentlyPlayedSongs playedSongs={playedSongs} />
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => refetch()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                状態を更新
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default PlayBingo;
