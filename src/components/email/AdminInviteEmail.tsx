import * as React from "react";

interface AdminInviteEmailProps {
  adminName: string;
  gameTitle: string;
  inviterName: string;
  loginUrl: string;
}

export function AdminInviteEmail({
  adminName,
  gameTitle,
  inviterName,
  loginUrl,
}: AdminInviteEmailProps) {
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        maxWidth: "600px",
        margin: "0 auto",
        padding: "20px",
      }}
    >
      <h1 style={{ color: "#1f2937", fontSize: "24px", marginBottom: "20px" }}>
        DJ Bingoゲームの管理者に追加されました
      </h1>

      <p style={{ color: "#374151", fontSize: "16px", lineHeight: "1.5" }}>
        {adminName}さん、
      </p>

      <p style={{ color: "#374151", fontSize: "16px", lineHeight: "1.5" }}>
        {inviterName}さんがあなたを「{gameTitle}
        」の管理者として追加しました。
      </p>

      <p style={{ color: "#374151", fontSize: "16px", lineHeight: "1.5" }}>
        以下のリンクからログインして管理画面にアクセスできます：
      </p>

      <div style={{ margin: "30px 0" }}>
        <a
          href={loginUrl}
          style={{
            display: "inline-block",
            padding: "12px 24px",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            textDecoration: "none",
            borderRadius: "6px",
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          管理画面にログイン
        </a>
      </div>

      <p
        style={{
          color: "#6b7280",
          fontSize: "14px",
          lineHeight: "1.5",
          marginTop: "20px",
        }}
      >
        ※ Google認証（Gmail または Google Workspace
        アカウント）でログインしてください。
      </p>

      <hr
        style={{
          border: "none",
          borderTop: "1px solid #e5e7eb",
          margin: "30px 0",
        }}
      />

      <p style={{ color: "#9ca3af", fontSize: "12px", lineHeight: "1.5" }}>
        このメールに心当たりがない場合は、無視していただいて構いません。
      </p>
    </div>
  );
}
