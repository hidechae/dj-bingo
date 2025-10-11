import { type NextPage } from "next";
import Head from "next/head";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  GameStatus,
  BingoSize,
  getStatusDisplay,
  isValidStatusTransition,
  getRequiredSongCount,
} from "~/types";
import { useGameManagement } from "~/hooks/useGameManagement";
import { useSongEditor } from "~/hooks/useSongEditor";
import { useParticipantSort } from "~/hooks/useParticipantSort";
import { GameInfoSidebar } from "~/components/admin/GameInfoSidebar";
import { SongList } from "~/components/admin/SongList";
import { ParticipantTable } from "~/components/admin/ParticipantTable";
import { SortableHeader } from "~/components/admin/SortableHeader";
import { StatusChangeModal } from "~/components/admin/StatusChangeModal";
import { AdminManagement } from "~/components/admin/AdminManagement";

const AdminGameManagement: NextPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] =
    useState<GameStatus | null>(null);
  const [showAdminManagement, setShowAdminManagement] = useState(false);
  const [activeTab, setActiveTab] = useState<"songs" | "participants">("songs");

  const {
    bingoGame,
    participants,
    incompleteParticipants,
    changeStatusMutation,
    updateSongsMutation,
    toggleSongPlayed,
    markSongMutation,
  } = useGameManagement(id as string);

  const {
    songEditingMode,
    editingSongs,
    setSongEditingMode,
    startEditing,
    cancelEditing,
    addSong,
    updateSong,
    removeSong,
    getValidSongs,
  } = useSongEditor();

  const { sortField, sortDirection, handleSort, sortParticipants } =
    useParticipantSort();

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

  const handleStatusChange = (newStatus: GameStatus) => {
    const currentStatus = bingoGame?.status as GameStatus;

    if (!isValidStatusTransition(currentStatus, newStatus)) {
      alert(
        `「${getStatusDisplay(currentStatus).text}」から「${getStatusDisplay(newStatus).text}」への変更はできません。`
      );
      return;
    }

    if (newStatus === GameStatus.ENTRY && bingoGame) {
      const requiredSongs = getRequiredSongCount(bingoGame.size as BingoSize);
      if (bingoGame.songs.length < requiredSongs) {
        alert(
          `エントリーを開始するには最低${requiredSongs}曲必要です。現在${bingoGame.songs.length}曲です。`
        );
        return;
      }
    }

    const needsConfirmation =
      (currentStatus === GameStatus.PLAYING &&
        newStatus === GameStatus.ENTRY) ||
      (currentStatus === GameStatus.ENTRY &&
        newStatus === GameStatus.EDITING) ||
      (currentStatus === GameStatus.ENTRY &&
        newStatus === GameStatus.PLAYING &&
        incompleteParticipants &&
        incompleteParticipants.length > 0);

    if (needsConfirmation) {
      setPendingStatusChange(newStatus);
      setShowConfirmModal(true);
    } else {
      changeStatusMutation.mutate({
        gameId: id as string,
        newStatus,
      });
    }
  };

  const confirmStatusChange = (
    options: {
      preservePlayedSongs?: boolean;
      preserveParticipants?: boolean;
    } = {}
  ) => {
    if (pendingStatusChange) {
      changeStatusMutation.mutate(
        {
          gameId: id as string,
          newStatus: pendingStatusChange,
          options,
        },
        {
          onSuccess: () => {
            setShowConfirmModal(false);
            setPendingStatusChange(null);
          },
        }
      );
    }
  };

  const handleSongEdit = () => {
    if (songEditingMode) {
      updateSongsMutation.mutate(
        {
          gameId: id as string,
          songs: getValidSongs(),
        },
        {
          onSuccess: () => {
            setSongEditingMode(false);
          },
        }
      );
    } else {
      startEditing(bingoGame?.songs || []);
    }
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

  const sortedParticipants = participants ? sortParticipants(participants) : [];

  return (
    <>
      <Head>
        <title>{bingoGame.title} - 管理画面</title>
        <meta name="description" content="ビンゴゲーム管理" />
      </Head>
      <main className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <h1 className="text-xl font-semibold text-gray-900">
                {bingoGame.title} - 管理画面
              </h1>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowAdminManagement(true)}
                  className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                >
                  管理者の管理
                </button>
                <button
                  onClick={() => router.push("/admin")}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ダッシュボードに戻る
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <GameInfoSidebar
              bingoGame={bingoGame}
              participants={participants || []}
              qrCodeDataUrl={qrCodeDataUrl}
              gameUrl={`${window.location.origin}/game/${id}`}
              onStatusChange={handleStatusChange}
              isChangingStatus={changeStatusMutation.isPending}
            />

            <div className="lg:col-span-2">
              {/* Tab Navigation */}
              <div className="mb-6">
                <nav className="flex space-x-8" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab("songs")}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "songs"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    楽曲リスト
                  </button>
                  <button
                    onClick={() => setActiveTab("participants")}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "participants"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    参加者一覧
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              {activeTab === "songs" && (
                <SongList
                  bingoGame={bingoGame}
                  songEditingMode={songEditingMode}
                  editingSongs={editingSongs}
                  onSongEdit={handleSongEdit}
                  onAddSong={addSong}
                  onUpdateSong={updateSong}
                  onRemoveSong={removeSong}
                  onCancelEdit={cancelEditing}
                  onToggleSongPlayed={toggleSongPlayed}
                  isSaving={updateSongsMutation.isPending}
                  isMarkingPlayed={markSongMutation.isPending}
                />
              )}

              {activeTab === "participants" && (
                <div className="rounded-lg bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-lg font-medium text-gray-900">参加者一覧</h3>
                  {participants && participants.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <SortableHeader
                              label="名前"
                              field="name"
                              currentSortField={sortField}
                              sortDirection={sortDirection}
                              onSort={handleSort}
                            />
                            <SortableHeader
                              label="グリッド状態"
                              field="isGridComplete"
                              currentSortField={sortField}
                              sortDirection={sortDirection}
                              onSort={handleSort}
                            />
                            <SortableHeader
                              label="勝利状態"
                              field="hasWon"
                              currentSortField={sortField}
                              sortDirection={sortDirection}
                              onSort={handleSort}
                            />
                            <SortableHeader
                              label="参加時間"
                              field="createdAt"
                              currentSortField={sortField}
                              sortDirection={sortDirection}
                              onSort={handleSort}
                            />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {sortedParticipants.map((participant) => (
                            <tr key={participant.id}>
                              <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
                                {participant.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                    participant.isGridComplete
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {participant.isGridComplete ? "完成" : "設定中"}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {participant.hasWon ? (
                                  <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                                    勝利！
                                  </span>
                                ) : (
                                  <span className="text-sm text-gray-500">未勝利</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                                {new Date(participant.createdAt).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="py-4 text-center text-gray-500">
                      まだ参加者がいません
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <StatusChangeModal
        isOpen={showConfirmModal}
        currentStatus={bingoGame.status as GameStatus}
        pendingStatus={pendingStatusChange!}
        incompleteParticipants={incompleteParticipants}
        onConfirm={confirmStatusChange}
        onCancel={() => {
          setShowConfirmModal(false);
          setPendingStatusChange(null);
        }}
      />

      {showAdminManagement && (
        <AdminManagement
          gameId={id as string}
          onClose={() => setShowAdminManagement(false)}
        />
      )}
    </>
  );
};

export default AdminGameManagement;
