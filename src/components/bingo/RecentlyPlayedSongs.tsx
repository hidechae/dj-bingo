type Song = {
  id: string;
  title: string;
  artist?: string | null;
  playedAt?: Date | null;
};

type RecentlyPlayedSongsProps = {
  playedSongs: Song[];
};

export const RecentlyPlayedSongs = ({
  playedSongs,
}: RecentlyPlayedSongsProps) => {
  const sortedSongs = playedSongs
    .filter((s) => s.playedAt)
    .sort(
      (a, b) =>
        new Date(b.playedAt!).getTime() - new Date(a.playedAt!).getTime()
    )
    .slice(0, 10);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        最近演奏された楽曲
      </h3>
      <div className="max-h-80 space-y-2 overflow-y-auto">
        {sortedSongs.map((song) => (
          <div
            key={song.id}
            className="rounded-lg border border-green-200 bg-green-50 p-3"
          >
            <div className="font-medium text-green-900">
              {song.artist ? `${song.artist} - ${song.title}` : song.title}
            </div>
            <div className="mt-1 text-xs text-green-600">
              {new Date(song.playedAt!).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>

      {playedSongs.length === 0 && (
        <div className="py-8 text-center text-gray-500">
          <p>まだ楽曲が演奏されていません</p>
          <p className="mt-2 text-sm">DJの選曲をお待ちください</p>
        </div>
      )}
    </div>
  );
};
