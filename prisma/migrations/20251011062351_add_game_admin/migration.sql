-- CreateTable
CREATE TABLE "game_admins" (
    "id" TEXT NOT NULL,
    "bingo_game_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "added_by" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_admins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "game_admins_bingo_game_id_user_id_key" ON "game_admins"("bingo_game_id", "user_id");

-- AddForeignKey
ALTER TABLE "game_admins" ADD CONSTRAINT "game_admins_bingo_game_id_fkey" FOREIGN KEY ("bingo_game_id") REFERENCES "bingo_games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_admins" ADD CONSTRAINT "game_admins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
