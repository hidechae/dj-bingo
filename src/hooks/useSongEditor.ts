/**
 * 楽曲リストの編集機能を提供するカスタムフック
 *
 * 管理画面のゲーム編集時に、楽曲の追加・編集・削除を行うための
 * 状態管理と操作関数を提供します。
 */
import { useState } from "react";

/** 編集中の楽曲の型定義 */
export type EditingSong = {
  id?: string;
  title: string;
  artist: string;
};

/**
 * 楽曲リストの編集機能を提供するカスタムフック
 *
 * @returns 編集状態と操作関数
 */
export const useSongEditor = () => {
  const [songEditingMode, setSongEditingMode] = useState(false);
  const [editingSongs, setEditingSongs] = useState<EditingSong[]>([]);

  /**
   * 編集モードを開始する
   * 既存の楽曲リストを編集用にコピー
   *
   * @param songs - 編集対象の楽曲配列
   */
  const startEditing = (songs: any[]) => {
    setEditingSongs(
      songs.map((song: any) => ({
        id: song.id,
        title: song.title,
        artist: song.artist || "",
      }))
    );
    setSongEditingMode(true);
  };

  /**
   * 編集をキャンセルする
   * 編集中の内容を破棄して編集モードを終了
   */
  const cancelEditing = () => {
    setSongEditingMode(false);
    setEditingSongs([]);
  };

  /**
   * 新しい空の楽曲を追加する
   */
  const addSong = () => {
    setEditingSongs([...editingSongs, { title: "", artist: "" }]);
  };

  /**
   * 指定されたインデックスの楽曲フィールドを更新する
   *
   * @param index - 更新する楽曲のインデックス
   * @param field - 更新するフィールド（title または artist）
   * @param value - 新しい値
   */
  const updateSong = (
    index: number,
    field: "title" | "artist",
    value: string
  ) => {
    const updated = [...editingSongs];
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: value };
      setEditingSongs(updated);
    }
  };

  /**
   * 指定されたインデックスの楽曲を削除する
   *
   * @param index - 削除する楽曲のインデックス
   */
  const removeSong = (index: number) => {
    setEditingSongs(editingSongs.filter((_, i) => i !== index));
  };

  /**
   * タイトルが空でない有効な楽曲のみを取得する
   * 保存時にこのメソッドを使用して空の楽曲を除外
   *
   * @returns 有効な楽曲の配列
   */
  const getValidSongs = () => {
    return editingSongs.filter((song) => song.title.trim() !== "");
  };

  return {
    songEditingMode,
    editingSongs,
    setSongEditingMode,
    startEditing,
    cancelEditing,
    addSong,
    updateSong,
    removeSong,
    getValidSongs,
  };
};
