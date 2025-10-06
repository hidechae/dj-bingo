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

const AdminGameManagement: NextPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [sortField, setSortField] = useState<ParticipantSortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

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

              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">ゲーム情報</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">サイズ:</span> {bingoGame.size}</p>
                  <p><span className="font-medium">楽曲数:</span> {bingoGame.songs.length}</p>
                  <p><span className="font-medium">参加者数:</span> {participants?.length ?? 0}</p>
                  <p><span className="font-medium">グリッド完成:</span> {completedGridsCount}</p>
                  <p><span className="font-medium">勝者数:</span> {winnersCount}</p>
                </div>
              </div>
            </div>

            {/* Songs List */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">楽曲リスト</h3>
                
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
                          <button
                            onClick={() => toggleSongPlayed(song.id, song.isPlayed)}
                            disabled={markSongMutation.isPending}
                            className="px-4 py-2 rounded text-sm font-medium transition-colors bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
                          >
                            演奏済みにする
                          </button>
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
                          <button
                            onClick={() => toggleSongPlayed(song.id, song.isPlayed)}
                            disabled={markSongMutation.isPending}
                            className="px-4 py-2 rounded text-sm font-medium transition-colors bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            未演奏に戻す
                          </button>
                        </div>
                      ))}
                  </div>
                  {bingoGame.songs.filter((s: any) => s.isPlayed).length === 0 && (
                    <p className="text-gray-500 text-center py-4">まだ演奏された楽曲はありません</p>
                  )}
                </div>
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
    </>
  );
};

export default AdminGameManagement;