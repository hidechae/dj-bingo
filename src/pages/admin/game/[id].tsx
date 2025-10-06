import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { api } from "~/utils/api";
import QRCode from "qrcode";

type ParticipantSortField = "name" | "createdAt" | "isGridComplete" | "hasWon";
type SortDirection = "asc" | "desc";

enum GameStatus {
  EDITING = "EDITING",
  ENTRY = "ENTRY", 
  PLAYING = "PLAYING",
  FINISHED = "FINISHED"
}

const getStatusDisplay = (status: GameStatus) => {
  switch (status) {
    case GameStatus.EDITING: return { text: "編集中", color: "bg-gray-100 text-gray-800" };
    case GameStatus.ENTRY: return { text: "エントリー中", color: "bg-blue-100 text-blue-800" };
    case GameStatus.PLAYING: return { text: "ゲーム中", color: "bg-green-100 text-green-800" };
    case GameStatus.FINISHED: return { text: "終了", color: "bg-red-100 text-red-800" };
  }
};

const AdminGameManagement: NextPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [sortField, setSortField] = useState<ParticipantSortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    newStatus: GameStatus;
    requiresConfirmation: boolean;
    options?: { preservePlayedSongs?: boolean; preserveParticipants?: boolean };
  } | null>(null);
  const [songEditingMode, setSongEditingMode] = useState(false);
  const [editingSongs, setEditingSongs] = useState<Array<{id?: string; title: string; artist: string}>>([]);

  const { data: bingoGame, refetch: refetchGame } = api.bingo.getById.useQuery(
    { id: id as string },
    { enabled: !!id }
  );

  const { data: participants, refetch: refetchParticipants } = api.bingo.getParticipants.useQuery(
    { bingoGameId: id as string },
    { enabled: !!id }
  );

  const markSongMutation = api.bingo.markSongAsPlayed.useMutation({
    onSuccess: () => {
      void refetchGame();
      void refetchParticipants();
    },
  });

  const changeStatusMutation = api.bingo.changeStatus.useMutation({
    onSuccess: () => {
      void refetchGame();
      void refetchParticipants();
      setShowConfirmModal(false);
      setPendingStatusChange(null);
    },
  });

  const updateSongsMutation = api.bingo.updateSongs.useMutation({
    onSuccess: () => {
      void refetchGame();
      setSongEditingMode(false);
    },
  });

  const { data: incompleteParticipants } = api.bingo.getIncompleteGridParticipants.useQuery(
    { gameId: id as string },
    { enabled: !!id }
  );

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      void router.push("/auth/signin");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (id) {
      const participantUrl = `${window.location.origin}/game/${id}`;
      QRCode.toDataURL(participantUrl)
        .then(setQrCodeDataUrl)
        .catch(console.error);
    }
  }, [id]);

  const toggleSongPlayed = (songId: string, isPlayed: boolean) => {
    markSongMutation.mutate({ songId, isPlayed: !isPlayed });
  };

  const handleStatusChange = (newStatus: GameStatus) => {
    const currentStatus = bingoGame?.status as GameStatus;
    
    // Check if confirmation is needed
    if (currentStatus === GameStatus.PLAYING && newStatus === GameStatus.ENTRY) {
      // Going back from PLAYING to ENTRY - confirm about played songs
      setPendingStatusChange({
        newStatus,
        requiresConfirmation: true,
      });
      setShowConfirmModal(true);
    } else if (currentStatus === GameStatus.ENTRY && newStatus === GameStatus.EDITING) {
      // Going back from ENTRY to EDITING - confirm about participants  
      setPendingStatusChange({
        newStatus,
        requiresConfirmation: true,
      });
      setShowConfirmModal(true);
    } else if (currentStatus === GameStatus.ENTRY && newStatus === GameStatus.PLAYING) {
      // Going from ENTRY to PLAYING - check for incomplete grids
      if (incompleteParticipants && incompleteParticipants.length > 0) {
        setPendingStatusChange({
          newStatus,
          requiresConfirmation: true,
        });
        setShowConfirmModal(true);
      } else {
        // No incomplete grids, proceed directly
        changeStatusMutation.mutate({
          gameId: id as string,
          newStatus,
        });
      }
    } else {
      // Direct status change
      changeStatusMutation.mutate({
        gameId: id as string,
        newStatus,
      });
    }
  };

  const confirmStatusChange = (options: { preservePlayedSongs?: boolean; preserveParticipants?: boolean } = {}) => {
    if (pendingStatusChange) {
      changeStatusMutation.mutate({
        gameId: id as string,
        newStatus: pendingStatusChange.newStatus,
        options,
      });
    }
  };

  const handleSongEdit = () => {
    if (songEditingMode) {
      // Save changes
      updateSongsMutation.mutate({
        gameId: id as string,
        songs: editingSongs.filter(song => song.title.trim() !== ""),
      });
    } else {
      // Enter edit mode
      setEditingSongs(bingoGame?.songs?.map((song: any) => ({ 
        id: song.id, 
        title: song.title, 
        artist: song.artist || "" 
      })) || []);
      setSongEditingMode(true);
    }
  };

  const addEditingSong = () => {
    setEditingSongs([...editingSongs, { title: "", artist: "" }]);
  };

  const updateEditingSong = (index: number, field: 'title' | 'artist', value: string) => {
    const updated = [...editingSongs];
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: value };
      setEditingSongs(updated);
    }
  };

  const removeEditingSong = (index: number) => {
    setEditingSongs(editingSongs.filter((_, i) => i !== index));
  };

  const handleSort = (field: ParticipantSortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortParticipants = (participants: any[]) => {
    return [...participants].sort((a: any, b: any) => {
      let aValue, bValue;
      
      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case "isGridComplete":
          aValue = a.isGridComplete ? 1 : 0;
          bValue = b.isGridComplete ? 1 : 0;
          break;
        case "hasWon":
          aValue = a.hasWon ? 1 : 0;
          bValue = b.hasWon ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (!session || !bingoGame) {
    return null;
  }

  const winnersCount = participants?.filter((p: any) => p.hasWon).length ?? 0;
  const completedGridsCount = participants?.filter((p: any) => p.isGridComplete).length ?? 0;

  return (
    <>
      <Head>
        <title>{bingoGame.title} - 管理画面</title>
        <meta name="description" content="ビンゴゲーム管理" />
      </Head>
      <main className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                {bingoGame.title} - 管理画面
              </h1>
              <button
                onClick={() => router.push("/admin")}
                className="text-gray-500 hover:text-gray-700"
              >
                ダッシュボードに戻る
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* QR Code and Game Info */}
            <div className="space-y-6">
              {(bingoGame.status as GameStatus) === GameStatus.ENTRY && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">参加用QRコード</h3>
                  {qrCodeDataUrl && (
                    <div className="text-center">
                      <Image 
                        src={qrCodeDataUrl} 
                        alt="QR Code for game participation"
                        width={200}
                        height={200}
                        className="mx-auto mb-4"
                      />
                      <p className="text-sm text-gray-600">
                        参加者はこのQRコードをスキャンして参加
                      </p>
                      <p className="text-xs text-gray-500 mt-2 break-all">
                        {`${window.location.origin}/game/${id}`}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">ゲーム情報</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium">状態:</span>{" "}
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusDisplay(bingoGame.status as GameStatus).color}`}>
                      {getStatusDisplay(bingoGame.status as GameStatus).text}
                    </span>
                  </div>
                  <p><span className="font-medium">サイズ:</span> {bingoGame.size}</p>
                  <p><span className="font-medium">楽曲数:</span> {bingoGame.songs.length}</p>
                  <p><span className="font-medium">参加者数:</span> {participants?.length ?? 0}</p>
                  <p><span className="font-medium">グリッド完成:</span> {completedGridsCount}</p>
                  <p><span className="font-medium">勝者数:</span> {winnersCount}</p>
                </div>
              </div>

              {/* Status Controls */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">ステータス変更</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleStatusChange(GameStatus.EDITING)}
                    disabled={(bingoGame.status as GameStatus) === GameStatus.EDITING || changeStatusMutation.isPending}
                    className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    編集中
                  </button>
                  <button
                    onClick={() => handleStatusChange(GameStatus.ENTRY)}
                    disabled={(bingoGame.status as GameStatus) === GameStatus.ENTRY || changeStatusMutation.isPending}
                    className="px-3 py-2 text-sm rounded-md border border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    エントリー中
                  </button>
                  <button
                    onClick={() => handleStatusChange(GameStatus.PLAYING)}
                    disabled={(bingoGame.status as GameStatus) === GameStatus.PLAYING || changeStatusMutation.isPending}
                    className="px-3 py-2 text-sm rounded-md border border-green-300 text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ゲーム中
                  </button>
                  <button
                    onClick={() => handleStatusChange(GameStatus.FINISHED)}
                    disabled={(bingoGame.status as GameStatus) === GameStatus.FINISHED || changeStatusMutation.isPending}
                    className="px-3 py-2 text-sm rounded-md border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    終了
                  </button>
                </div>
              </div>
            </div>

            {/* Songs List */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">楽曲リスト</h3>
                  {(bingoGame.status as GameStatus) === GameStatus.EDITING && (
                    <div className="flex gap-2">
                      {songEditingMode && (
                        <button
                          onClick={addEditingSong}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          曲を追加
                        </button>
                      )}
                      <button
                        onClick={handleSongEdit}
                        disabled={updateSongsMutation.isPending}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        {songEditingMode ? "保存" : "編集"}
                      </button>
                      {songEditingMode && (
                        <button
                          onClick={() => {
                            setSongEditingMode(false);
                            setEditingSongs([]);
                          }}
                          className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                        >
                          キャンセル
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                {songEditingMode ? (
                  // Edit mode
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {editingSongs.map((song, index) => (
                      <div key={index} className="flex gap-4 items-center p-3 border border-gray-200 rounded-lg">
                        <input
                          type="text"
                          value={song.title}
                          onChange={(e) => updateEditingSong(index, 'title', e.target.value)}
                          placeholder="曲名"
                          className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border"
                        />
                        <input
                          type="text"
                          value={song.artist}
                          onChange={(e) => updateEditingSong(index, 'artist', e.target.value)}
                          placeholder="アーティスト名"
                          className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border"
                        />
                        <button
                          onClick={() => removeEditingSong(index)}
                          className="text-red-600 hover:text-red-800 px-2"
                        >
                          削除
                        </button>
                      </div>
                    ))}
                  </div>
                ) : bingoGame.songs.length > 0 ? (
                  // Display mode - show improved UI with sections for played/unplayed
                  <div>
                
                {/* Unplayed Songs Section */}
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-700 mb-3">未演奏 ({bingoGame.songs.filter((s: any) => !s.isPlayed).length}曲)</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {bingoGame.songs
                      .filter((song: any) => !song.isPlayed)
                      .map((song: any) => (
                        <div
                          key={song.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 border-gray-200"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{song.artist} - {song.title}</p>
                          </div>
                          {(bingoGame.status as GameStatus) === GameStatus.PLAYING && (
                            <button
                              onClick={() => toggleSongPlayed(song.id, song.isPlayed)}
                              disabled={markSongMutation.isPending}
                              className="px-4 py-2 rounded text-sm font-medium transition-colors bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
                            >
                              演奏済みにする
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                  {bingoGame.songs.filter((s: any) => !s.isPlayed).length === 0 && (
                    <p className="text-gray-500 text-center py-4">すべての楽曲が演奏済みです</p>
                  )}
                </div>

                {/* Played Songs Section */}
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-3">演奏済み ({bingoGame.songs.filter((s: any) => s.isPlayed).length}曲)</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {bingoGame.songs
                      .filter((song: any) => song.isPlayed)
                      .map((song: any) => (
                        <div
                          key={song.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-green-50 border-green-200"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{song.artist} - {song.title}</p>
                            <p className="text-xs text-gray-600">
                              演奏時間: {new Date(song.playedAt).toLocaleString()}
                            </p>
                          </div>
                          {(bingoGame.status as GameStatus) === GameStatus.PLAYING && (
                            <button
                              onClick={() => toggleSongPlayed(song.id, song.isPlayed)}
                              disabled={markSongMutation.isPending}
                              className="px-4 py-2 rounded text-sm font-medium transition-colors bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              未演奏に戻す
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                  {bingoGame.songs.filter((s: any) => s.isPlayed).length === 0 && (
                    <p className="text-gray-500 text-center py-4">まだ演奏された楽曲はありません</p>
                  )}
                </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>まだ楽曲が登録されていません</p>
                    {(bingoGame.status as GameStatus) === GameStatus.EDITING && (
                      <p className="text-sm">「編集」ボタンから楽曲を追加してください</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Participants List */}
          {participants && participants.length > 0 && (
            <div className="mt-8 bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">参加者一覧</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("name")}
                      >
                        <div className="flex items-center">
                          名前
                          {sortField === "name" && (
                            <span className="ml-1">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("createdAt")}
                      >
                        <div className="flex items-center">
                          参加時間
                          {sortField === "createdAt" && (
                            <span className="ml-1">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("isGridComplete")}
                      >
                        <div className="flex items-center">
                          グリッド状態
                          {sortField === "isGridComplete" && (
                            <span className="ml-1">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("hasWon")}
                      >
                        <div className="flex items-center">
                          勝利状態
                          {sortField === "hasWon" && (
                            <span className="ml-1">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortParticipants(participants).map((participant: any) => (
                      <tr key={participant.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {participant.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(participant.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            participant.isGridComplete
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {participant.isGridComplete ? "完成" : "設定中"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {participant.hasWon ? (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              勝利！
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">未勝利</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && pendingStatusChange && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">ステータス変更の確認</h3>
              <div className="mt-2 px-7 py-3">
                {pendingStatusChange.newStatus === GameStatus.ENTRY && 
                 (bingoGame?.status as GameStatus) === GameStatus.PLAYING && (
                  <div className="text-sm text-gray-500 space-y-3">
                    <p>「ゲーム中」から「エントリー中」に戻します。</p>
                    <p>演奏済み楽曲の状態を維持しますか？</p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => confirmStatusChange({ preservePlayedSongs: true })}
                        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                      >
                        維持する
                      </button>
                      <button
                        onClick={() => confirmStatusChange({ preservePlayedSongs: false })}
                        className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                      >
                        リセットする
                      </button>
                    </div>
                  </div>
                )}

                {pendingStatusChange.newStatus === GameStatus.EDITING && 
                 (bingoGame?.status as GameStatus) === GameStatus.ENTRY && (
                  <div className="text-sm text-gray-500 space-y-3">
                    <p>「エントリー中」から「編集中」に戻します。</p>
                    <p>参加者のエントリー状態を維持しますか？</p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => confirmStatusChange({ preserveParticipants: true })}
                        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                      >
                        維持する
                      </button>
                      <button
                        onClick={() => confirmStatusChange({ preserveParticipants: false })}
                        className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                      >
                        削除する
                      </button>
                    </div>
                  </div>
                )}

                {pendingStatusChange.newStatus === GameStatus.PLAYING && 
                 (bingoGame?.status as GameStatus) === GameStatus.ENTRY && (
                  <div className="text-sm text-gray-500 space-y-3">
                    <p>「エントリー中」から「ゲーム中」に変更します。</p>
                    {incompleteParticipants && incompleteParticipants.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                        <p className="font-medium text-yellow-800">警告</p>
                        <p className="text-yellow-700">
                          {incompleteParticipants.length}人の参加者がまだグリッドを完成させていません：
                        </p>
                        <ul className="text-yellow-700 text-xs mt-1 list-disc list-inside">
                          {incompleteParticipants.map((p: any) => (
                            <li key={p.id}>{p.name}</li>
                          ))}
                        </ul>
                        <p className="text-yellow-700 mt-2">
                          ゲーム中に変更すると、参加者はグリッドを編集できなくなります。
                        </p>
                      </div>
                    )}
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => confirmStatusChange()}
                        className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                      >
                        変更する
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2 justify-center mt-4">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setPendingStatusChange(null);
                  }}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded text-sm hover:bg-gray-400"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminGameManagement;