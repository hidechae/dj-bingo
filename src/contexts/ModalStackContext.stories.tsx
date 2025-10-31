import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ModalStackProvider, useModalZIndex } from "./ModalStackContext";

const meta = {
  title: "Contexts/ModalStack",
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;

// デモ用のシンプルなモーダルコンポーネント
const DemoModal = ({
  isOpen,
  onClose,
  title,
  color,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  color: string;
  children?: React.ReactNode;
}) => {
  const zIndex = useModalZIndex(isOpen);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex,
      }}
    >
      {/* 背景オーバーレイ */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
      />

      {/* モーダルコンテンツ */}
      <div
        style={{
          position: "relative",
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          minWidth: "300px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
          border: `4px solid ${color}`,
        }}
      >
        <div style={{ marginBottom: "16px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "600", color }}>
            {title}
          </h3>
          <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "8px" }}>
            z-index: {zIndex}
          </p>
        </div>
        {children && <div style={{ marginBottom: "16px" }}>{children}</div>}
        <button
          onClick={onClose}
          style={{
            backgroundColor: color,
            color: "white",
            padding: "8px 16px",
            borderRadius: "4px",
            border: "none",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          閉じる
        </button>
      </div>
    </div>
  );
};

// ModalStack Context デモ
const ModalStackDemo = () => {
  const [modals, setModals] = useState<boolean[]>([false, false, false, false]);

  const toggleModal = (index: number) => {
    const newModals = [...modals];
    newModals[index] = !newModals[index];
    setModals(newModals);
  };

  const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"];
  const names = ["青", "緑", "オレンジ", "赤"];

  return (
    <div style={{ padding: "40px" }}>
      <h2
        style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" }}
      >
        ModalStack Context デモ
      </h2>
      <p style={{ color: "#6B7280", marginBottom: "24px" }}>
        複数のモーダルを開いて、z-indexが自動的に管理されることを確認できます。
        <br />
        後から開いたモーダルが前面に表示され、各モーダルのz-index値が表示されます。
        <br />
        各モーダルの中から次のモーダルを開くことができます。
      </p>

      <button
        onClick={() => toggleModal(0)}
        style={{
          backgroundColor: colors[0],
          color: "white",
          padding: "12px 24px",
          borderRadius: "6px",
          border: "none",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "500",
        }}
      >
        モーダル1を開く ({names[0]})
      </button>

      <div
        style={{
          marginTop: "32px",
          padding: "16px",
          backgroundColor: "#F3F4F6",
          borderRadius: "8px",
        }}
      >
        <h3
          style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px" }}
        >
          開いているモーダル:
        </h3>
        <ul
          style={{ listStyle: "disc", paddingLeft: "24px", color: "#6B7280" }}
        >
          {modals.map(
            (isOpen, index) =>
              isOpen && (
                <li key={index}>
                  モーダル{index + 1} ({names[index]})
                </li>
              )
          )}
          {!modals.some((m) => m) && <li style={{ color: "#9CA3AF" }}>なし</li>}
        </ul>
      </div>

      {modals.map((isOpen, index) => (
        <DemoModal
          key={index}
          isOpen={isOpen}
          onClose={() => toggleModal(index)}
          title={`モーダル ${index + 1} (${names[index]})`}
          color={colors[index]!}
        >
          {index < 3 ? (
            <>
              <p
                style={{
                  fontSize: "14px",
                  color: "#6B7280",
                  marginBottom: "12px",
                }}
              >
                次のモーダルを開くことができます。
              </p>
              <button
                onClick={() => toggleModal(index + 1)}
                style={{
                  backgroundColor: colors[index + 1],
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                モーダル{index + 2}を開く ({names[index + 1]})
              </button>
            </>
          ) : (
            <p style={{ fontSize: "14px", color: "#6B7280" }}>
              これが最後のモーダルです。
            </p>
          )}
        </DemoModal>
      ))}
    </div>
  );
};

// ストーリー定義
export const Default: StoryObj = {
  render: () => (
    <ModalStackProvider>
      <ModalStackDemo />
    </ModalStackProvider>
  ),
};
