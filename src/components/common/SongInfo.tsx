type SongInfoProps = {
  title: string;
  artist?: string | null;
  className?: string;
};

export const SongInfo = ({ title, artist, className = "" }: SongInfoProps) => {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="truncate font-semibold text-gray-900">{title}</p>
      {artist && <p className="truncate text-sm text-gray-600">{artist}</p>}
    </div>
  );
};
