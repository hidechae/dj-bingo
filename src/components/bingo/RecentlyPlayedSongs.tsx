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
      <div className="max-h-80 overflow-y-auto space-y-2">
        {sortedSongs.map((song) => (
          <div
            key={song.id}
            className="p-3 bg-green-50 border border-green-200 rounded-lg"
          >
            <div className="font-medium text-green-900">
              {song.artist ? `${song.artist} - ${song.title}` : song.title}
            </div>
            <div className="text-xs text-green-600 mt-1">
              {new Date(song.playedAt!).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>

      {playedSongs.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <p>まだ楽曲が演奏されていません</p>
          <p className="text-sm mt-2">DJの選曲をお待ちください</p>
        </div>
      )}
    </div>
  );
};
