/**
 * ビンゴグリッド設定画面の状態管理を提供するカスタムフック
 *
 * 参加者がビンゴグリッドに楽曲を配置する際の状態管理と操作を提供します。
 * グリッド上の位置選択、楽曲の割り当て、バリデーション、保存などの機能を含みます。
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { api } from "~/utils/api";
import { BingoSize, getGridSize } from "~/types";

/**
 * ビンゴグリッド設定画面の状態管理を提供するカスタムフック
 *
 * @param gameId - 設定対象のゲームID
 * @returns グリッド設定の状態と操作関数
 */
export const useBingoSetup = (gameId: string | string[] | undefined) => {
  const router = useRouter();
  const [sessionToken, setSessionToken] = useState<string>("");
  // 各グリッド位置に割り当てられた楽曲ID（position → songId）
  const [selectedSongs, setSelectedSongs] = useState<{
    [position: number]: string;
  }>({});
  const [gridSize, setGridSize] = useState(3);
  // 現在選択中のグリッド位置（null = 未選択）
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);

  // 参加者情報の取得
  const { data: participant } = api.participant.getBySessionToken.useQuery(
    { sessionToken, bingoGameId: gameId as string },
    { enabled: !!sessionToken && !!gameId }
  );

  /**
   * グリッドへの楽曲割り当てを保存するmutation
   * 成功時はプレイ画面へ遷移
   */
  const assignSongsMutation = api.participant.assignSongs.useMutation({
    onSuccess: () => {
      void router.push(`/game/${gameId}/play`);
    },
  });

  // セッショントークンの取得と認証チェック
  useEffect(() => {
    const token = localStorage.getItem("dj-bingo-session");
    if (token) {
      setSessionToken(token);
    } else {
      // セッショントークンがない場合は参加画面へリダイレクト
      void router.push(`/game/${gameId}`);
    }
  }, [gameId, router]);

  // 参加者のステータスチェックとリダイレクト処理
  useEffect(() => {
    if (participant) {
      // 別のゲームの参加者の場合はリダイレクト
      if (participant.bingoGameId !== gameId) {
        void router.push(`/game/${gameId}`);
        return;
      }

      // グリッド編集はENTRYステータスでのみ許可
      if (participant.bingoGame.status !== "ENTRY") {
        if (participant.isGridComplete) {
          // グリッド完成済みの場合はプレイ画面へ
          void router.push(`/game/${gameId}/play`);
        } else {
          if (participant.bingoGame.status === "PLAYING") {
            // ゲーム中なら未完成でもプレイ画面へ
            void router.push(`/game/${gameId}/play`);
          } else {
            // その他のステータスは参加画面へ
            void router.push(`/game/${gameId}`);
          }
        }
        return;
      }

      // グリッド完成済みの場合はプレイ画面へリダイレクト
      if (participant.isGridComplete) {
        void router.push(`/game/${gameId}/play`);
        return;
      }

      // ゲームのサイズに基づいてグリッドサイズを設定
      const size = getGridSize(participant.bingoGame.size as BingoSize);
      setGridSize(size);

      // 既存の楽曲割り当てがあれば初期化
      const assignments: { [position: number]: string } = {};
      participant.participantSongs.forEach((ps) => {
        assignments[ps.position] = ps.songId;
      });
      setSelectedSongs(assignments);
    }
  }, [participant, gameId, router]);

  /**
   * 指定位置に楽曲を割り当てる（内部用）
   *
   * @param position - グリッド上の位置
   * @param songId - 割り当てる楽曲ID
   */
  const handleSongSelect = (position: number, songId: string) => {
    setSelectedSongs((prev) => ({ ...prev, [position]: songId }));
  };

  /**
   * グリッド上の位置を選択する
   *
   * @param position - 選択する位置
   */
  const handlePositionSelect = (position: number) => {
    setSelectedPosition(position);
  };

  /**
   * 選択中の位置に楽曲を割り当てる
   * 既に使用済みの楽曲は割り当てできない
   *
   * @param songId - 割り当てる楽曲ID
   */
  const handleSongAssign = (songId: string) => {
    if (selectedPosition !== null && !isSongUsed(songId)) {
      handleSongSelect(selectedPosition, songId);
      setSelectedPosition(null); // 割り当て後は選択を解除
    }
  };

  /**
   * 指定位置の楽曲割り当てをクリアする
   *
   * @param position - クリアする位置
   */
  const handleClearPosition = (position: number) => {
    setSelectedSongs((prev) => {
      const newSongs = { ...prev };
      delete newSongs[position];
      return newSongs;
    });
    // クリアした位置が選択中だった場合は選択も解除
    if (selectedPosition === position) {
      setSelectedPosition(null);
    }
  };

  /**
   * すべての楽曲割り当てをクリアする
   */
  const handleClearAll = () => {
    setSelectedSongs({});
    setSelectedPosition(null);
  };

  /**
   * グリッド設定を保存してゲームを開始する
   * すべてのマスが埋まっているかバリデーション
   */
  const handleSubmit = () => {
    if (!participant) return;

    const totalPositions = gridSize * gridSize;
    const assignments = Object.keys(selectedSongs).map((pos) => ({
      position: parseInt(pos),
      songId: selectedSongs[parseInt(pos)]!,
    }));

    // すべてのマスが埋まっているかチェック
    if (assignments.length !== totalPositions) {
      alert("すべてのマスに楽曲を選択してください");
      return;
    }

    assignSongsMutation.mutate({
      sessionToken,
      bingoGameId: gameId as string,
      songAssignments: assignments,
    });
  };

  /**
   * 指定された楽曲が既に使用済みかチェック
   *
   * @param songId - チェックする楽曲ID
   * @returns 使用済みの場合 true
   */
  const isSongUsed = (songId: string) => {
    return Object.values(selectedSongs).includes(songId);
  };

  return {
    participant,
    selectedSongs,
    gridSize,
    selectedPosition,
    assignSongsMutation,
    handlePositionSelect,
    handleSongAssign,
    handleClearPosition,
    handleClearAll,
    handleSubmit,
    isSongUsed,
  };
};
