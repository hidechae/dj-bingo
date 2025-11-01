/**
 * ゲーム管理画面の状態管理とAPI操作を提供するカスタムフック
 *
 * 管理画面でゲームの情報取得、楽曲の演奏状態変更、ステータス変更、
 * 楽曲リストの更新などを行うための機能を提供します。
 */
import { api } from "~/utils/api";

/**
 * ゲーム管理画面の状態管理とAPI操作を提供するカスタムフック
 *
 * @param gameId - 管理対象のゲームID
 * @returns ゲームデータ、参加者データ、および操作用のmutation
 */
export const useGameManagement = (gameId: string) => {
  // ゲーム情報の取得
  const { data: bingoGame, refetch: refetchGame } =
    api.bingo.getByIdForAdmin.useQuery({ id: gameId }, { enabled: !!gameId });

  // 参加者一覧の取得
  const { data: participants, refetch: refetchParticipants } =
    api.bingo.getParticipants.useQuery(
      { gameId: gameId },
      { enabled: !!gameId }
    );

  // グリッド未完成の参加者一覧の取得
  // ゲームステータス変更時の警告表示に使用
  const { data: incompleteParticipants } =
    api.bingo.getIncompleteGridParticipants.useQuery(
      { gameId },
      { enabled: !!gameId }
    );

  /**
   * 楽曲の演奏状態を変更するmutation
   * 成功時にゲーム情報と参加者情報を再取得
   */
  const markSongMutation = api.bingo.markSongAsPlayed.useMutation({
    onSuccess: () => {
      void refetchGame();
      void refetchParticipants();
    },
  });

  /**
   * ゲームステータスを変更するmutation
   * 成功時にゲーム情報と参加者情報を再取得
   */
  const changeStatusMutation = api.bingo.changeStatus.useMutation({
    onSuccess: () => {
      void refetchGame();
      void refetchParticipants();
    },
  });

  /**
   * 楽曲リストを更新するmutation
   * 成功時にゲーム情報を再取得
   */
  const updateSongsMutation = api.bingo.updateSongs.useMutation({
    onSuccess: () => {
      void refetchGame();
    },
  });

  /**
   * ビンゴゲームのタイトルを更新するmutation
   * 成功時にゲーム情報を再取得
   */
  const updateTitleMutation = api.bingo.updateTitle.useMutation({
    onSuccess: () => {
      void refetchGame();
    },
  });

  /**
   * 楽曲の演奏状態をトグルする（演奏済み⇔未演奏）
   *
   * @param songId - 対象の楽曲ID
   * @param isPlayed - 現在の演奏状態
   */
  const toggleSongPlayed = (songId: string, isPlayed: boolean) => {
    markSongMutation.mutate({ songId, isPlayed: !isPlayed });
  };

  return {
    bingoGame,
    participants,
    incompleteParticipants,
    refetchGame,
    refetchParticipants,
    markSongMutation,
    changeStatusMutation,
    updateSongsMutation,
    updateTitleMutation,
    toggleSongPlayed,
  };
};
