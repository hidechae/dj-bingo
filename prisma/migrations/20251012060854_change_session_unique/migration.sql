/*
  Warnings:

  - A unique constraint covering the columns `[session_token,bingo_game_id]` on the table `participants` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."participants_session_token_key";

-- CreateIndex
CREATE UNIQUE INDEX "participants_session_token_bingo_game_id_key" ON "participants"("session_token", "bingo_game_id");
