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
        <div className="mx-auto max-w-4xl px-4">
          <WinnerBanner hasWon={hasWon} />

          <div className="rounded-lg bg-white p-6 shadow-xl">
            {/* Header */}
            <div className="mb-6 text-center">
              <h1 className="mb-2 text-2xl font-bold text-gray-900">
                {participant.bingoGame.title}
              </h1>
              <h2 className="mb-1 text-lg text-gray-700">
                {participant.name}さんのビンゴ
              </h2>
              <p className="text-sm text-gray-500">
                演奏済み楽曲: {playedSongs.length} / {totalSongs} |
                あなたのマス: {playedSongsCount} / {grid.length}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Bingo Grid */}
              <div className="space-y-4 lg:col-span-2">
                <h3 className="text-center text-lg font-semibold text-gray-900">
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
                <div className="mt-6 text-center">
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
                className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
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
