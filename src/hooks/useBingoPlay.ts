/**
 * ビンゴプレイ画面の状態管理を提供するカスタムフック
 *
 * 参加者のビンゴ状態（グリッド、演奏済み楽曲、勝利状態など）を
 * リアルタイムで取得・更新する機能を提供します。
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { api } from "~/utils/api";

/**
 * ビンゴプレイ画面の状態管理を提供するカスタムフック
 *
 * @param gameId - 参加しているゲームのID
 * @returns ビンゴ状態と再取得関数
 */
export const useBingoPlay = (gameId: string | string[] | undefined) => {
  const router = useRouter();
  const [sessionToken, setSessionToken] = useState<string>("");

  // ビンゴ状態を5秒ごとにポーリング
  const { data: bingoStatus, refetch } =
    api.participant.getBingoStatus.useQuery(
      { sessionToken },
      {
        enabled: !!sessionToken,
        refetchInterval: 5000, // Poll every 5 seconds for updates
      }
    );

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

  // 参加者が正しいゲームに所属しているかチェック
  useEffect(() => {
    if (bingoStatus && bingoStatus.participant) {
      // 別のゲームの参加者の場合はリダイレクト
      if (bingoStatus.participant.bingoGameId !== gameId) {
        void router.push(`/game/${gameId}`);
        return;
      }
    }
  }, [bingoStatus, gameId, router]);

  return {
    bingoStatus,
    refetch,
  };
};
