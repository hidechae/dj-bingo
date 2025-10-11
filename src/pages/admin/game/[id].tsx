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
  const [titleEditingMode, setTitleEditingMode] = useState(false);
  const [editingTitle, setEditingTitle] = useState("");

  const {
    bingoGame,
    participants,
    incompleteParticipants,
    changeStatusMutation,
    updateSongsMutation,
    updateTitleMutation,
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

  const handleTitleEdit = () => {
    if (titleEditingMode) {
      // Save title
      if (editingTitle.trim()) {
        updateTitleMutation.mutate(
          {
            gameId: id as string,
            title: editingTitle.trim(),
          },
          {
            onSuccess: () => {
              setTitleEditingMode(false);
            },
            onError: (error) => {
              alert(`タイトルの更新に失敗しました: ${error.message}`);
            },
          }
        );
      }
    } else {
      // Start editing
      setEditingTitle(bingoGame?.title || "");
      setTitleEditingMode(true);
    }
  };

  const handleTitleCancel = () => {
    setTitleEditingMode(false);
    setEditingTitle("");
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
              <div className="flex items-center gap-3">
                {titleEditingMode ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleTitleEdit();
                        } else if (e.key === "Escape") {
                          handleTitleCancel();
                        }
                      }}
                      className="text-xl font-semibold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none focus:border-blue-700 min-w-0 flex-1"
                      autoFocus
                      required
                    />
                    <button
                      onClick={handleTitleEdit}
                      disabled={!editingTitle.trim() || updateTitleMutation.isPending}
                      className="text-green-600 hover:text-green-800 disabled:opacity-50"
                      title="保存"
                    >
                      ✓
                    </button>
                    <button
                      onClick={handleTitleCancel}
                      disabled={updateTitleMutation.isPending}
                      className="text-red-600 hover:text-red-800"
                      title="キャンセル"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-semibold text-gray-900">
                      {bingoGame.title} - 管理画面
                    </h1>
                    <button
                      onClick={handleTitleEdit}
                      className="text-gray-400 hover:text-gray-600"
                      title="ビンゴ名を編集"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
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
                    className={`border-b-2 px-1 py-2 text-sm font-medium whitespace-nowrap ${
                      activeTab === "songs"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    }`}
                  >
                    楽曲リスト
                  </button>
                  <button
                    onClick={() => setActiveTab("participants")}
                    className={`border-b-2 px-1 py-2 text-sm font-medium whitespace-nowrap ${
                      activeTab === "participants"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
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
                <ParticipantTable
                  participants={sortedParticipants}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
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
