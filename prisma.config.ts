import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: {
    // Prisma CLI（migrate / introspect）の接続先。プーラーを経由すると
    // マイグレーションがロックを失うため、直接接続を必須にする。
    // 実行時のクエリは src/server/db.ts のドライバアダプタが DATABASE_URL を使う。
    url: process.env.DIRECT_DATABASE_URL,
  },
});
