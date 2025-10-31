import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

type ModalStackContextType = {
  registerModal: () => number;
  unregisterModal: (id: number) => void;
  getZIndex: (id: number) => number;
};

const ModalStackContext = createContext<ModalStackContextType | undefined>(
  undefined
);

const BASE_Z_INDEX = 50;

export const ModalStackProvider = ({ children }: { children: ReactNode }) => {
  const [modalStack, setModalStack] = useState<number[]>([]);
  const modalStackRef = useRef<number[]>([]);

  useEffect(() => {
    modalStackRef.current = modalStack;
  }, [modalStack]);

  const registerModal = useCallback(() => {
    const id = Date.now() + Math.random(); // ユニークなIDを生成
    const newStack = [...modalStackRef.current, id];
    modalStackRef.current = newStack;
    setModalStack(newStack);
    return id;
  }, []);

  const unregisterModal = useCallback((id: number) => {
    const newStack = modalStackRef.current.filter((modalId) => modalId !== id);
    modalStackRef.current = newStack;
    setModalStack(newStack);
  }, []);

  const getZIndex = useCallback((id: number) => {
    const index = modalStackRef.current.indexOf(id);
    const zIndex = index === -1 ? BASE_Z_INDEX : BASE_Z_INDEX + index + 1;
    return zIndex;
  }, []);

  return (
    <ModalStackContext.Provider
      value={{ registerModal, unregisterModal, getZIndex }}
    >
      {children}
    </ModalStackContext.Provider>
  );
};

export const useModalStack = () => {
  const context = useContext(ModalStackContext);
  if (!context) {
    // Providerの外で使われた場合はデフォルト動作
    return {
      registerModal: () => 0,
      unregisterModal: () => {},
      getZIndex: () => BASE_Z_INDEX,
    };
  }
  return context;
};

/**
 * モーダルのライフサイクルとz-indexを管理するフック
 */
export const useModalZIndex = (isOpen: boolean) => {
  const { registerModal, unregisterModal, getZIndex } = useModalStack();
  const [modalId, setModalId] = useState<number | null>(null);
  const [zIndex, setZIndex] = useState<number>(BASE_Z_INDEX);

  useEffect(() => {
    if (isOpen && modalId === null) {
      // モーダルが開かれたときに登録
      const id = registerModal();
      setModalId(id);
      // 登録直後にz-indexを取得して状態に保存
      setZIndex(getZIndex(id));
    } else if (!isOpen && modalId !== null) {
      // モーダルが閉じられたときに登録解除
      unregisterModal(modalId);
      setModalId(null);
      setZIndex(BASE_Z_INDEX);
    }
  }, [isOpen, modalId, registerModal, unregisterModal, getZIndex]);

  // modalIdが変更されたらz-indexを更新
  useEffect(() => {
    if (modalId !== null) {
      setZIndex(getZIndex(modalId));
    }
  }, [modalId, getZIndex]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (modalId !== null) {
        unregisterModal(modalId);
      }
    };
  }, [modalId, unregisterModal]);

  return zIndex;
};
