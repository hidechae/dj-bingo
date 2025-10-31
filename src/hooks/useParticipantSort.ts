/**
 * 参加者一覧のソート機能を提供するカスタムフック
 *
 * 管理画面の参加者テーブルで、名前・参加時間・グリッド状態・勝利状態・勝利曲数による
 * ソート機能を実装するために使用します。
 */
import { useState } from "react";
import { type Participant, type Song } from "~/types";

/** ソート可能なフィールド */
export type ParticipantSortField =
  | "name"
  | "createdAt"
  | "isGridComplete"
  | "hasWon"
  | "wonSongNumber";

/** ソート方向 */
export type SortDirection = "asc" | "desc";

/**
 * 勝利時点で何曲プレイされていたかを計算
 */
const getWinSongNumber = (wonAt: Date | null, songs: Song[]): number | null => {
  if (!wonAt) return null;

  // wonAt時点でプレイされていた曲の数を計算
  const playedSongs = songs.filter(
    (song) => song.playedAt && new Date(song.playedAt) <= wonAt
  );

  return playedSongs.length;
};

/**
 * 参加者一覧のソート機能を提供するカスタムフック
 *
 * @returns ソート状態と操作関数
 */
export const useParticipantSort = () => {
  // デフォルトは参加時間の降順（新しい順）
  const [sortField, setSortField] = useState<ParticipantSortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  /**
   * ソートフィールドを変更する
   * 同じフィールドをクリックした場合はソート方向を反転
   *
   * @param field - ソート対象のフィールド
   */
  const handleSort = (field: ParticipantSortField) => {
    if (sortField === field) {
      // 同じフィールドなら方向を反転
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // 新しいフィールドなら昇順から開始
      setSortField(field);
      setSortDirection("asc");
    }
  };

  /**
   * 参加者の配列を現在のソート設定に基づいてソートする
   *
   * @param participants - ソート対象の参加者配列
   * @param songs - 勝利曲数を計算するための楽曲配列
   * @returns ソートされた参加者配列
   */
  const sortParticipants = (
    participants: Participant[],
    songs: Song[] = []
  ) => {
    return [...participants].sort((a, b) => {
      let aValue, bValue;

      // フィールドごとに比較値を取得
      switch (sortField) {
        case "name":
          // 名前は大文字小文字を区別せずに比較
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "createdAt":
          // 日時はDateオブジェクトに変換して比較
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case "isGridComplete":
          // ブール値は数値に変換して比較
          aValue = a.isGridComplete ? 1 : 0;
          bValue = b.isGridComplete ? 1 : 0;
          break;
        case "hasWon":
          // ブール値は数値に変換して比較
          aValue = a.hasWon ? 1 : 0;
          bValue = b.hasWon ? 1 : 0;
          break;
        case "wonSongNumber":
          // 勝利曲数を計算して比較（nullは最後に配置）
          aValue = getWinSongNumber(a.wonAt, songs) ?? Infinity;
          bValue = getWinSongNumber(b.wonAt, songs) ?? Infinity;
          break;
        default:
          return 0;
      }

      // ソート方向に応じて比較結果を返す
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  return {
    sortField,
    sortDirection,
    handleSort,
    sortParticipants,
  };
};
