/**
 * 初期ページロード時のローディング状態管理用カスタムフック
 *
 * 重要なクエリ（認証状態、初期データなど）のローディング中は
 * グローバルローディングオーバーレイを表示します。
 */
import { useEffect } from "react";
import { useLoading } from "~/contexts/LoadingContext";

interface UseInitialLoadingProps {
  isLoading: boolean;
}

export const useInitialLoading = ({ isLoading }: UseInitialLoadingProps) => {
  const { setCustomLoading } = useLoading();

  useEffect(() => {
    setCustomLoading(isLoading);

    return () => {
      setCustomLoading(false);
    };
  }, [isLoading, setCustomLoading]);
};
