/*
  Warnings:

  - A unique constraint covering the columns `[participant_id,song_id]` on the table `participant_songs` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "participant_songs_participant_id_song_id_key" ON "participant_songs"("participant_id", "song_id");
