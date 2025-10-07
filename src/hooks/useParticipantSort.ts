/**
 * 参加者一覧のソート機能を提供するカスタムフック
 *
 * 管理画面の参加者テーブルで、名前・参加時間・グリッド状態・勝利状態による
 * ソート機能を実装するために使用します。
 */
import { useState } from "react";
import { type Participant } from "~/types";

/** ソート可能なフィールド */
export type ParticipantSortField =
  | "name"
  | "createdAt"
  | "isGridComplete"
  | "hasWon";

/** ソート方向 */
export type SortDirection = "asc" | "desc";

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
   * @returns ソートされた参加者配列
   */
  const sortParticipants = (participants: Participant[]) => {
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
