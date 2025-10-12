/**
 * グローバルローディングオーバーレイコンポーネント
 *
 * API通信中に画面全体を覆うローディングインジケーターを表示し、
 * ユーザーの操作を無効化します。
 */
import React, { useEffect, useState } from "react";
import { useLoading } from "~/contexts/LoadingContext";

export const LoadingOverlay: React.FC = () => {
  const { isGlobalLoading, isMutationLoading } = useLoading();
  const [isVisible, setIsVisible] = useState(false);

  // 短時間の操作では表示しないようにするためのdelay
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    if (isGlobalLoading) {
      // 500ms後にローディング表示（短時間の操作での点滅を避ける）
      timeoutId = setTimeout(() => {
        // タイムアウト実行時に再度ローディング状態を確認
        if (isGlobalLoading) {
          setIsVisible(true);
        }
      }, 500);
    } else {
      // ローディング終了時は即座に非表示
      setIsVisible(false);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isGlobalLoading]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black"
      style={{ backdropFilter: "blur(2px)" }}
    >
      <div className="flex flex-col items-center space-y-4 rounded-lg bg-white p-6 shadow-xl">
        {/* スピナーアニメーション */}
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>

        {/* ローディングメッセージ */}
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">
            {isMutationLoading ? "データを保存中..." : "読み込み中..."}
          </p>
          <p className="text-sm text-gray-600">しばらくお待ちください</p>
        </div>
      </div>
    </div>
  );
};
