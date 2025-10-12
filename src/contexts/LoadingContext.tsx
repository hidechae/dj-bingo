/**
 * グローバルローディング状態管理用のReact Context
 * 
 * API通信中のローディング状態を管理し、UI全体でのローディングインジケーター表示と
 * 操作無効化を提供します。
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useIsMutating, useIsFetching } from '@tanstack/react-query';

interface LoadingContextType {
  isGlobalLoading: boolean;
  isMutationLoading: boolean;
  isQueryLoading: boolean;
  setCustomLoading: (loading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

interface LoadingProviderProps {
  children: React.ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [customLoading, setCustomLoading] = useState(false);
  
  // TanStack Queryのglobalなmutationとfetchingの状態を監視
  const isMutating = useIsMutating();
  const isFetching = useIsFetching();
  
  // 個別の状態
  const isMutationLoading = isMutating > 0;
  const isQueryLoading = isFetching > 0;
  
  // グローバルローディング状態 = (mutation実行中 OR カスタムローディング)
  // クエリの場合は重要でない限りオーバーレイ表示しない
  const isGlobalLoading = isMutationLoading || customLoading;

  // setCustomLoadingを安定化
  const stableSetCustomLoading = useCallback((loading: boolean) => {
    setCustomLoading(loading);
  }, []);

  return (
    <LoadingContext.Provider value={{
      isGlobalLoading,
      isMutationLoading,
      isQueryLoading,
      setCustomLoading: stableSetCustomLoading
    }}>
      {children}
    </LoadingContext.Provider>
  );
};