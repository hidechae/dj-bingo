import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: {
    // マイグレーション等のCLI操作はプーラーを経由しない直接接続を使う。
    // 実行時のクエリは src/server/db.ts のドライバアダプタが DATABASE_URL を使う。
    url: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL,
  },
});
