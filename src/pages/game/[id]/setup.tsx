import { type NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { api } from "~/utils/api";

const SetupBingo: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [sessionToken, setSessionToken] = useState<string>("");
  const [selectedSongs, setSelectedSongs] = useState<{ [position: number]: string }>({});
  const [gridSize, setGridSize] = useState(3);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);

  const { data: participant } = api.participant.getBySessionToken.useQuery(
    { sessionToken },
    { enabled: !!sessionToken }
  );

  const assignSongsMutation = api.participant.assignSongs.useMutation({
    onSuccess: () => {
      void router.push(`/game/${id}/play`);
    },
  });

  useEffect(() => {
    const token = localStorage.getItem("dj-bingo-session");
    if (token) {
      setSessionToken(token);
    } else {
      void router.push(`/game/${id}`);
    }
  }, [id, router]);

  useEffect(() => {
    if (participant) {
      // Check if participant is for the correct game
      if (participant.bingoGameId !== id) {
        void router.push(`/game/${id}`);
        return;
      }

      // If grid is already complete, redirect to play
      if (participant.isGridComplete) {
        void router.push(`/game/${id}/play`);
        return;
      }

      // Set grid size based on bingo game
      const size = getGridSize(participant.bingoGame.size);
      setGridSize(size);

      // Initialize with existing assignments if any
      const assignments: { [position: number]: string } = {};
      participant.participantSongs.forEach((ps: any) => {
        assignments[ps.position] = ps.songId;
      });
      setSelectedSongs(assignments);
    }
  }, [participant, id, router]);

  const getGridSize = (size: any): number => {
    switch (size) {
      case "THREE_BY_THREE":
        return 3;
      case "FOUR_BY_FOUR":
        return 4;
      case "FIVE_BY_FIVE":
        return 5;
      default:
        return 3;
    }
  };

  const handleSongSelect = (position: number, songId: string) => {
    setSelectedSongs(prev => ({ ...prev, [position]: songId }));
  };

  const handlePositionSelect = (position: number) => {
    setSelectedPosition(position);
  };

  const handleSongAssign = (songId: string) => {
    if (selectedPosition !== null && !isSongUsed(songId)) {
      handleSongSelect(selectedPosition, songId);
      setSelectedPosition(null); // Clear selection after assignment
    }
  };

  const handleClearPosition = (position: number) => {
    setSelectedSongs(prev => {
      const newSongs = { ...prev };
      delete newSongs[position];
      return newSongs;
    });
    // If we cleared the currently selected position, clear the selection
    if (selectedPosition === position) {
      setSelectedPosition(null);
    }
  };

  const handleSubmit = () => {
    if (!participant) return;

    const totalPositions = gridSize * gridSize;
    const assignments = Object.keys(selectedSongs).map(pos => ({
      position: parseInt(pos),
      songId: selectedSongs[parseInt(pos)]!,
    }));

    if (assignments.length !== totalPositions) {
      alert("すべてのマスに楽曲を選択してください");
      return;
    }

    assignSongsMutation.mutate({
      sessionToken,
      songAssignments: assignments,
    });
  };

  const getAvailableSongs = () => {
    if (!participant) return [];
    
    // Get unique songs by shuffling them for this participant
    return [...participant.bingoGame.songs].sort(() => Math.random() - 0.5);
  };

  const isSongUsed = (songId: string) => {
    return Object.values(selectedSongs).includes(songId);
  };

  if (!participant) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  const availableSongs = getAvailableSongs();
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
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                ビンゴ設定
              </h1>
              <h2 className="text-lg text-gray-700">
                {participant.bingoGame.title}
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                各マスに楽曲を選択してください ({selectedCount}/{totalPositions})
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {selectedPosition !== null 
                  ? `マス${selectedPosition + 1}が選択されています。楽曲を選んでください。`
                  : "まずマスを選択してから、楽曲を選んでください。"
                }
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Bingo Grid */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">ビンゴグリッド</h3>
                <div 
                  className={`grid gap-2`}
                  style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
                >
                  {Array.from({ length: totalPositions }, (_, index) => (
                    <div
                      key={index}
                      onClick={() => handlePositionSelect(index)}
                      className={`aspect-square border-2 rounded-lg p-2 text-xs cursor-pointer transition-all relative ${
                        selectedPosition === index
                          ? "bg-yellow-100 border-yellow-400 border-solid shadow-md"
                          : selectedSongs[index] 
                          ? "bg-blue-50 border-blue-300 hover:bg-blue-100" 
                          : "bg-gray-50 border-gray-300 border-dashed hover:bg-gray-100"
                      }`}
                    >
                      {selectedSongs[index] && (
                        <>
                          <div className="h-full flex items-center justify-center text-center pr-4">
                            {availableSongs.find(s => s.id === selectedSongs[index])?.title}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClearPosition(index);
                            }}
                            className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
                            title="このマスをクリア"
                          >
                            ×
                          </button>
                        </>
                      )}
                      {!selectedSongs[index] && (
                        <div className="h-full flex items-center justify-center text-gray-400 text-center">
                          マス {index + 1}
                        </div>
                      )}
                      {selectedPosition === index && (
                        <div className="absolute inset-0 border-2 border-yellow-500 rounded-lg pointer-events-none"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Song Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">楽曲一覧</h3>
                {selectedPosition !== null && (
                  <p className="text-sm text-green-600 bg-green-50 p-2 rounded">
                    マス{selectedPosition + 1}に設定する楽曲を選択してください
                  </p>
                )}
                {selectedPosition === null && (
                  <p className="text-sm text-gray-500 bg-gray-50 p-2 rounded">
                    先にビンゴグリッドでマスを選択してください
                  </p>
                )}
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {availableSongs.map((song) => (
                    <div
                      key={song.id}
                      className={`p-3 border rounded-lg transition-colors ${
                        isSongUsed(song.id)
                          ? "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
                          : selectedPosition === null
                          ? "bg-white border-gray-200 cursor-not-allowed opacity-60"
                          : "bg-white border-gray-200 hover:bg-green-50 hover:border-green-300 cursor-pointer"
                      }`}
                      onClick={() => handleSongAssign(song.id)}
                    >
                      <div className="font-medium text-gray-900">{song.title}</div>
                      {song.artist && (
                        <div className="text-sm text-gray-500">{song.artist}</div>
                      )}
                      {isSongUsed(song.id) && (
                        <div className="text-xs text-gray-400 mt-1">選択済み</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-between items-center">
              <button
                onClick={() => setSelectedSongs({})}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                すべてクリア
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={selectedCount !== totalPositions || assignSongsMutation.isPending}
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