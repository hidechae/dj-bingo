import { type NextPage } from "next";
import Head from "next/head";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";
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
import { BingoNotificationModal } from "~/components/admin/BingoNotificationModal";
import { SpotifyImportModal } from "~/components/admin/SpotifyImportModal";
import { SongFormModal } from "~/components/admin/SongFormModal";
import { StatusStepper } from "~/components/admin/StatusStepper";
import { useInitialLoading } from "~/hooks/useInitialLoading";
import { Button, type ButtonColor } from "~/components/ui/Button";
import type { Song } from "~/types";

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
  const [showSpotifyImportModal, setShowSpotifyImportModal] = useState(false);
  const [showSongFormModal, setShowSongFormModal] = useState(false);
  const [songFormMode, setSongFormMode] = useState<"add" | "edit">("add");
  const [editingSongData, setEditingSongData] = useState<Song | null>(null);
  const [newWinners, setNewWinners] = useState<string[]>([]);
  const previousParticipantsRef = useRef<typeof participants>(null);

  const utils = api.useUtils();

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

  const deleteMutation = api.bingo.delete.useMutation({
    onSuccess: () => {
      void router.push("/admin");
    },
    onError: (error) => {
      alert(`削除に失敗しました: ${error.message}`);
    },
  });

  const songMutation = updateSongsMutation;

  const { sortField, sortDirection, handleSort, sortParticipants } =
    useParticipantSort();

  // Spotify連携が有効かどうかを確認
  const { data: spotifyStatus } = api.spotify.isSpotifyEnabled.useQuery(
    undefined,
    {
      enabled: !!session,
    }
  );

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

  // 参加者の変更を監視して、新しくビンゴになった人を検出
  useEffect(() => {
    if (!participants || !previousParticipantsRef.current) {
      previousParticipantsRef.current = participants;
      return;
    }

    const previousParticipants = previousParticipantsRef.current;
    const winners: string[] = [];

    // 前回のデータと比較して、新しくhasWon=trueになった参加者を検出
    participants.forEach((participant) => {
      const previousParticipant = previousParticipants.find(
        (p) => p.id === participant.id
      );
      if (
        previousParticipant &&
        !previousParticipant.hasWon &&
        participant.hasWon
      ) {
        winners.push(participant.name);
      }
    });

    if (winners.length > 0) {
      setNewWinners(winners);
    }

    previousParticipantsRef.current = participants;
  }, [participants]);

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

  const handleAddSong = () => {
    setSongFormMode("add");
    setEditingSongData(null);
    setShowSongFormModal(true);
  };

  const handleEditSong = (song: Song) => {
    setSongFormMode("edit");
    setEditingSongData(song);
    setShowSongFormModal(true);
  };

  const handleDeleteSong = (songId: string) => {
    if (songMutation.isPending) return;
    if (confirm("この楽曲を削除しますか？")) {
      const updatedSongs = bingoGame!.songs
        .filter((song) => song.id !== songId)
        .map((song) => ({ title: song.title, artist: song.artist || "" }));
      songMutation.mutate({
        gameId: id as string,
        songs: updatedSongs,
      });
    }
  };

  const handleSongFormSave = (data: { title: string; artist: string }) => {
    if (songFormMode === "add") {
      const updatedSongs = [
        ...bingoGame!.songs.map((song) => ({
          title: song.title,
          artist: song.artist || "",
        })),
        { title: data.title, artist: data.artist },
      ];
      songMutation.mutate(
        {
          gameId: id as string,
          songs: updatedSongs,
        },
        {
          onSuccess: () => {
            setShowSongFormModal(false);
          },
        }
      );
    } else if (editingSongData) {
      const updatedSongs = bingoGame!.songs.map((song) =>
        song.id === editingSongData.id
          ? { title: data.title, artist: data.artist }
          : { title: song.title, artist: song.artist || "" }
      );
      songMutation.mutate(
        {
          gameId: id as string,
          songs: updatedSongs,
        },
        {
          onSuccess: () => {
            setShowSongFormModal(false);
            setEditingSongData(null);
          },
        }
      );
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

  const handleDelete = () => {
    if (!id || deleteMutation.isPending) return;
    if (
      confirm(
        "このビンゴを削除しますか？この操作は取り消せません。\n関連する楽曲、参加者データもすべて削除されます。"
      )
    ) {
      deleteMutation.mutate({ gameId: id as string });
    }
  };

  const handleSpotifyImport = (
    tracks: Array<{ title: string; artist: string }>
  ) => {
    // Spotifyからのインポートは一括で楽曲を追加する既存のAPIを使用
    const existingSongs = bingoGame!.songs.map((song) => ({
      title: song.title,
      artist: song.artist || "",
    }));
    updateSongsMutation.mutate(
      {
        gameId: id as string,
        songs: [...existingSongs, ...tracks],
      },
      {
        onSuccess: () => {
          setShowSpotifyImportModal(false);
        },
      }
    );
  };
  if (status === "loading" || !bingoGame) {
    return null; // グローバルローディングオーバーレイが表示される
  }

  if (!session) {
    return null;
  }

  const sortedParticipants = participants ? sortParticipants(participants) : [];
  const currentStatus = bingoGame.status as GameStatus;

  return (
    <>
      <Head>
        <title>{bingoGame.title} - 管理画面</title>
        <meta name="description" content="ビンゴゲーム管理" />
      </Head>
      <main className="min-h-screen bg-gray-50 pb-20">
        <div className="sticky top-0 z-50 bg-white shadow-sm">
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
                      <div className="border-t border-gray-100"></div>
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          handleDelete();
                        }}
                        disabled={deleteMutation.isPending}
                        className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deleteMutation.isPending ? "削除中..." : "削除"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status Stepper */}
        <StatusStepper currentStatus={currentStatus} />

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <GameInfoSidebar
              bingoGame={bingoGame}
              participants={participants || []}
              qrCodeDataUrl={qrCodeDataUrl}
              gameUrl={`${window.location.origin}/game/${id}`}
              gameId={id as string}
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
                  onAddSong={handleAddSong}
                  onEditSong={handleEditSong}
                  onDeleteSong={handleDeleteSong}
                  onToggleSongPlayed={toggleSongPlayed}
                  onSpotifyImport={
                    spotifyStatus?.enabled
                      ? () => setShowSpotifyImportModal(true)
                      : undefined
                  }
                  isMarkingPlayed={markSongMutation.isPending}
                  isDeletingSong={songMutation.isPending}
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

      <BingoNotificationModal
        isOpen={newWinners.length > 0}
        winnerNames={newWinners}
        onClose={() => setNewWinners([])}
      />

      <SpotifyImportModal
        isOpen={showSpotifyImportModal}
        onImport={handleSpotifyImport}
        onClose={() => setShowSpotifyImportModal(false)}
      />

      <SongFormModal
        isOpen={showSongFormModal}
        mode={songFormMode}
        initialData={
          editingSongData
            ? {
                title: editingSongData.title,
                artist: editingSongData.artist || "",
              }
            : undefined
        }
        onSave={handleSongFormSave}
        onCancel={() => {
          setShowSongFormModal(false);
          setEditingSongData(null);
        }}
        isSaving={songMutation.isPending}
      />

      {/* Status Change Footer */}
      <div className="fixed right-0 bottom-0 left-0 border-t border-gray-200 bg-white shadow-lg">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-end gap-3">
            {[
              {
                status: GameStatus.EDITING,
                forwardLabel: "編集中に変更",
                backLabel: "編集中に戻す",
              },
              {
                status: GameStatus.ENTRY,
                forwardLabel: "エントリー開始",
                backLabel: "エントリー中に戻す",
              },
              {
                status: GameStatus.PLAYING,
                forwardLabel: "ゲーム開始",
                backLabel: "ゲーム中に戻す",
              },
              {
                status: GameStatus.FINISHED,
                forwardLabel: "ゲーム終了",
                backLabel: "終了に戻す",
              },
            ]
              .filter(
                ({ status }) =>
                  status !== currentStatus &&
                  isValidStatusTransition(currentStatus, status)
              )
              .map(({ status, forwardLabel, backLabel }) => {
                const statusOrder = [
                  GameStatus.EDITING,
                  GameStatus.ENTRY,
                  GameStatus.PLAYING,
                  GameStatus.FINISHED,
                ];
                const currentIndex = statusOrder.indexOf(currentStatus);
                const targetIndex = statusOrder.indexOf(status);
                const isForward = targetIndex > currentIndex;
                const label = isForward ? forwardLabel : backLabel;

                return (
                  <Button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={changeStatusMutation.isPending}
                    variant={isForward ? "primary" : "outline"}
                    color={getStatusColor(status)}
                  >
                    {label}
                  </Button>
                );
              })}
          </div>
        </div>
      </div>
    </>
  );
};

const getStatusColor = (status: GameStatus): ButtonColor => {
  switch (status) {
    case GameStatus.EDITING:
      return "gray";
    case GameStatus.ENTRY:
      return "blue";
    case GameStatus.PLAYING:
      return "green";
    case GameStatus.FINISHED:
      return "red";
    default:
      return "gray";
  }
};

export default AdminGameManagement;
