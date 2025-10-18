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
import { api } from "~/utils/api";
import { useGameManagement } from "~/hooks/useGameManagement";
import { useSongEditor } from "~/hooks/useSongEditor";
import { useParticipantSort } from "~/hooks/useParticipantSort";
import { GameInfoSidebar } from "~/components/admin/GameInfoSidebar";
import { SongList } from "~/components/admin/SongList";
import { ParticipantTable } from "~/components/admin/ParticipantTable";
import { StatusChangeModal } from "~/components/admin/StatusChangeModal";
import { AdminManagement } from "~/components/admin/AdminManagement";
import { TitleEditModal } from "~/components/admin/TitleEditModal";
import { useInitialLoading } from "~/hooks/useInitialLoading";

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
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTitleEditModal, setShowTitleEditModal] = useState(false);

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

  const duplicateMutation = api.bingo.duplicate.useMutation({
    onSuccess: (data) => {
      void router.push(`/admin/game/${data.id}`);
    },
  });

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

  // 認証とゲームデータロード中はグローバルローディングを表示
  useInitialLoading({
    isLoading: status === "loading" || (!!session && !bingoGame),
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-dropdown]")) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

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

  const handleTitleSave = (newTitle: string) => {
    updateTitleMutation.mutate(
      {
        gameId: id as string,
        title: newTitle,
      },
      {
        onSuccess: () => {
          setShowTitleEditModal(false);
        },
        onError: (error) => {
          alert(`タイトルの更新に失敗しました: ${error.message}`);
        },
      }
    );
  };

  const handleDuplicate = () => {
    if (!id || duplicateMutation.isPending) return;
    if (
      confirm(
        "このビンゴを複製しますか？複製されたビンゴは編集状態で作成されます。"
      )
    ) {
      duplicateMutation.mutate({ gameId: id as string });
    }
  };
  if (status === "loading" || !bingoGame) {
    return null; // グローバルローディングオーバーレイが表示される
  }

  if (!session) {
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
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push("/admin")}
                  className="cursor-pointer text-gray-500 hover:text-gray-700"
                  title="ダッシュボードに戻る"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <h1 className="text-xl font-semibold text-gray-900">
                  {bingoGame.title} - 管理画面
                </h1>
              </div>
              <div className="relative" data-dropdown>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="cursor-pointer rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  title="メニュー"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </button>
                {showDropdown && (
                  <div className="ring-opacity-5 absolute right-0 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          setShowTitleEditModal(true);
                        }}
                        className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                      >
                        名前の変更
                      </button>
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          handleDuplicate();
                        }}
                        disabled={duplicateMutation.isPending}
                        className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {duplicateMutation.isPending ? "複製中..." : "複製"}
                      </button>
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          setShowAdminManagement(true);
                        }}
                        className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                      >
                        管理者の管理
                      </button>
                    </div>
                  </div>
                )}
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
                    className={`cursor-pointer border-b-2 px-1 py-2 text-sm font-medium whitespace-nowrap ${
                      activeTab === "songs"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    }`}
                  >
                    楽曲リスト
                  </button>
                  <button
                    onClick={() => setActiveTab("participants")}
                    className={`cursor-pointer border-b-2 px-1 py-2 text-sm font-medium whitespace-nowrap ${
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

      <TitleEditModal
        isOpen={showTitleEditModal}
        currentTitle={bingoGame.title}
        onSave={handleTitleSave}
        onCancel={() => setShowTitleEditModal(false)}
        isSaving={updateTitleMutation.isPending}
      />
    </>
  );
};

export default AdminGameManagement;
