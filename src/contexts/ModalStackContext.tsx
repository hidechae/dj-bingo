import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
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

  const registerModal = useCallback(() => {
    const id = Date.now() + Math.random(); // ユニークなIDを生成
    setModalStack((prev) => [...prev, id]);
    return id;
  }, []);

  const unregisterModal = useCallback((id: number) => {
    setModalStack((prev) => prev.filter((modalId) => modalId !== id));
  }, []);

  const getZIndex = useCallback(
    (id: number) => {
      const index = modalStack.indexOf(id);
      if (index === -1) return BASE_Z_INDEX;
      return BASE_Z_INDEX + index;
    },
    [modalStack]
  );

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

  useEffect(() => {
    if (isOpen && modalId === null) {
      // モーダルが開かれたときに登録
      const id = registerModal();
      setModalId(id);
    } else if (!isOpen && modalId !== null) {
      // モーダルが閉じられたときに登録解除
      unregisterModal(modalId);
      setModalId(null);
    }
  }, [isOpen, modalId, registerModal, unregisterModal]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (modalId !== null) {
        unregisterModal(modalId);
      }
    };
  }, [modalId, unregisterModal]);

  return modalId !== null ? getZIndex(modalId) : BASE_Z_INDEX;
};
