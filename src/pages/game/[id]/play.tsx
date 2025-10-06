import { type NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { api } from "~/utils/api";

const PlayBingo: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [sessionToken, setSessionToken] = useState<string>("");

  const { data: bingoStatus, refetch } = api.participant.getBingoStatus.useQuery(
    { sessionToken },
    { 
      enabled: !!sessionToken,
      refetchInterval: 5000, // Poll every 5 seconds for updates
    }
  );

  useEffect(() => {
    const token = localStorage.getItem("dj-bingo-session");
    if (token) {
      setSessionToken(token);
    } else {
      void router.push(`/game/${id}`);
    }
  }, [id, router]);

  useEffect(() => {
    if (bingoStatus && bingoStatus.participant) {
      // Check if participant is for the correct game
      if (bingoStatus.participant.bingoGameId !== id) {
        void router.push(`/game/${id}`);
        return;
      }

      // If grid is not complete, only redirect to setup if game is still in ENTRY status
      if (!bingoStatus.participant.isGridComplete) {
        if (bingoStatus.participant.bingoGame.status === 'ENTRY') {
          void router.push(`/game/${id}/setup`);
          return;
        }
        // If game is PLAYING/FINISHED, allow playing with incomplete grid
      }
    }
  }, [bingoStatus, id, router]);

  const checkWinCondition = (grid: any[], gridSize: number): boolean => {
    // Check rows
    for (let i = 0; i < gridSize; i++) {
      let rowWin = true;
      for (let j = 0; j < gridSize; j++) {
        if (!grid[i * gridSize + j]?.isPlayed) {
          rowWin = false;
          break;
        }
      }
      if (rowWin) return true;
    }

    // Check columns
    for (let j = 0; j < gridSize; j++) {
      let colWin = true;
      for (let i = 0; i < gridSize; i++) {
        if (!grid[i * gridSize + j]?.isPlayed) {
          colWin = false;
          break;
        }
      }
      if (colWin) return true;
    }

    // Check diagonals
    let diagWin1 = true;
    let diagWin2 = true;
    for (let i = 0; i < gridSize; i++) {
      if (!grid[i * gridSize + i]?.isPlayed) diagWin1 = false;
      if (!grid[i * gridSize + (gridSize - 1 - i)]?.isPlayed) diagWin2 = false;
    }
    
    return diagWin1 || diagWin2;
  };

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
  const playedSongs = participant.bingoGame.songs.filter((s: any) => s.isPlayed);

  return (
    <>
      <Head>
        <title>ビンゴプレイ - {participant.bingoGame.title}</title>
        <meta name="description" content="ビンゴゲームプレイ中" />
      </Head>
      <main className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c] py-4">
        <div className="max-w-4xl mx-auto px-4">
          
          {/* Winner Banner */}
          {hasWon && (
            <div className="bg-yellow-500 text-black p-4 rounded-lg mb-6 text-center animate-bounce">
              <h2 className="text-2xl font-bold">🎉 ビンゴ！おめでとうございます！ 🎉</h2>
              <p className="mt-2">管理者に勝利をお伝えください</p>
            </div>
          )}

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
                演奏済み楽曲: {playedSongs.length} / {totalSongs} | 
                あなたのマス: {playedSongsCount} / {grid.length}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Bingo Grid */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 text-center">
                  ビンゴグリッド
                </h3>
                
                {/* Incomplete Grid Warning */}
                {!participant.isGridComplete && (
                  <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-3 mx-auto max-w-md">
                    <div className="text-yellow-800 text-sm text-center">
                      <strong>⚠️ グリッド未完成</strong><br />
                      ゲーム開始時にグリッド設定が完了していませんでした。<br />
                      空白のマスではビンゴになりません。
                    </div>
                  </div>
                )}
                <div 
                  className={`grid gap-2 max-w-md mx-auto`}
                  style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
                >
                  {grid.map((cell: any, index: number) => (
                    <div
                      key={index}
                      className={`aspect-square border-2 rounded-lg p-2 text-xs transition-all duration-300 ${
                        cell?.isPlayed 
                          ? "bg-green-500 text-white border-green-600 shadow-lg transform scale-105" 
                          : "bg-white border-gray-300"
                      }`}
                    >
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        {cell ? (
                          <>
                            <div className={`font-medium ${cell.isPlayed ? 'text-white' : 'text-gray-900'}`}>
                              {cell.song.title}
                            </div>
                            {cell.song.artist && (
                              <div className={`text-xs mt-1 ${cell.isPlayed ? 'text-green-100' : 'text-gray-500'}`}>
                                {cell.song.artist}
                              </div>
                            )}
                            {cell.isPlayed && (
                              <div className="text-xs mt-1 font-bold text-green-100">
                                ✓ 演奏済み
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-gray-400 text-xs">
                            空白
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Win Status */}
                <div className="text-center mt-6">
                  {hasWon ? (
                    <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-4">
                      <div className="text-yellow-800 font-bold text-lg">
                        🏆 ビンゴ達成！ 🏆
                      </div>
                      <div className="text-yellow-700 text-sm mt-1">
                        勝利時刻: {participant.wonAt ? new Date(participant.wonAt).toLocaleString() : ''}
                      </div>
                    </div>
                  ) : checkWinCondition(grid, gridSize) ? (
                    <div className="bg-green-100 border border-green-400 rounded-lg p-4">
                      <div className="text-green-800 font-bold">
                        ビンゴ達成の可能性があります！
                      </div>
                      <div className="text-green-700 text-sm mt-1">
                        システムが確認中です...
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-100 border border-blue-400 rounded-lg p-4">
                      <div className="text-blue-800 font-bold">
                        ゲーム進行中
                      </div>
                      <div className="text-blue-700 text-sm mt-1">
                        DJの選曲をお待ちください
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Recently Played Songs */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  最近演奏された楽曲
                </h3>
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {playedSongs
                    .sort((a: any, b: any) => new Date(b.playedAt!).getTime() - new Date(a.playedAt!).getTime())
                    .slice(0, 10)
                    .map((song: any) => (
                      <div
                        key={song.id}
                        className="p-3 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <div className="font-medium text-green-900">{song.artist ? `${song.artist} - ${song.title}` : song.title}</div>
                        <div className="text-xs text-green-600 mt-1">
                          {new Date(song.playedAt!).toLocaleTimeString()}
                        </div>
                      </div>
                    ))
                  }
                </div>

                {playedSongs.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <p>まだ楽曲が演奏されていません</p>
                    <p className="text-sm mt-2">DJの選曲をお待ちください</p>
                  </div>
                )}
              </div>
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