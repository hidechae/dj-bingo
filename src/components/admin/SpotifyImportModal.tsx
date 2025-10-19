import { useState, useEffect } from "react";
import { api } from "~/utils/api";
import { SpotifyIcon } from "~/components/common/SpotifyIcon";

interface SpotifyImportModalProps {
  isOpen: boolean;
  onImport: (tracks: Array<{ title: string; artist: string }>) => void;
  onClose: () => void;
}

type Track = {
  title: string;
  artist: string;
};

export const SpotifyImportModal: React.FC<SpotifyImportModalProps> = ({
  isOpen,
  onImport,
  onClose,
}) => {
  const [step, setStep] = useState<"input" | "select">("input");
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [error, setError] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set()
  );

  const getPlaylistTracksMutation = api.spotify.getPlaylistTracks.useMutation({
    onSuccess: (data) => {
      setTracks(data.tracks);
      setError("");
      // デフォルトで全曲選択
      setSelectedIndices(new Set(data.tracks.map((_, i) => i)));
      setStep("select");
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  // モーダルが閉じられたら状態をリセット
  useEffect(() => {
    if (!isOpen) {
      setStep("input");
      setPlaylistUrl("");
      setError("");
      setTracks([]);
      setSelectedIndices(new Set());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFetchTracks = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!playlistUrl.trim()) {
      setError("プレイリストURLまたはIDを入力してください");
      return;
    }

    getPlaylistTracksMutation.mutate({ playlistUrl: playlistUrl.trim() });
  };

  const handleToggleTrack = (index: number) => {
    const newSelected = new Set(selectedIndices);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIndices(newSelected);
  };

  const handleToggleAll = () => {
    if (selectedIndices.size === tracks.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(tracks.map((_, i) => i)));
    }
  };

  const handleImport = () => {
    const selectedTracks = tracks.filter((_, i) => selectedIndices.has(i));
    onImport(selectedTracks);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const handleBack = () => {
    setStep("input");
    setError("");
  };

  return (
    <div className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600/20">
      <div className="relative top-20 mx-auto max-w-2xl rounded-md border bg-white p-5 shadow-lg">
        <div className="mt-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
              <SpotifyIcon className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              Spotifyプレイリストからインポート
            </h3>
          </div>

          {step === "input" ? (
            <form onSubmit={handleFetchTracks} className="mt-4">
              <div className="mb-4">
                <label
                  htmlFor="playlistUrl"
                  className="block text-sm font-medium text-gray-700"
                >
                  プレイリストURLまたはID
                </label>
                <input
                  type="text"
                  id="playlistUrl"
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  placeholder="https://open.spotify.com/playlist/..."
                  autoFocus
                  disabled={getPlaylistTracksMutation.isPending}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Spotifyプレイリストのリンク、またはプレイリストIDを入力してください
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={getPlaylistTracksMutation.isPending}
                  className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={
                    !playlistUrl.trim() || getPlaylistTracksMutation.isPending
                  }
                  className="cursor-pointer rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {getPlaylistTracksMutation.isPending
                    ? "取得中..."
                    : "楽曲を取得"}
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {tracks.length}曲中 {selectedIndices.size}曲を選択
                </p>
                <button
                  type="button"
                  onClick={handleToggleAll}
                  className="cursor-pointer text-sm text-blue-600 hover:text-blue-700"
                >
                  {selectedIndices.size === tracks.length
                    ? "すべて解除"
                    : "すべて選択"}
                </button>
              </div>

              {error && (
                <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="mb-4 max-h-96 overflow-y-auto rounded-md border border-gray-200">
                {tracks.map((track, index) => (
                  <label
                    key={index}
                    className="flex cursor-pointer items-center gap-3 border-b border-gray-200 px-4 py-3 last:border-b-0 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIndices.has(index)}
                      onChange={() => handleToggleTrack(index)}
                      className="h-4 w-4 cursor-pointer rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {track.title}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {track.artist}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-6 flex justify-between gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  戻る
                </button>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={selectedIndices.size === 0}
                    className="cursor-pointer rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {selectedIndices.size}曲をインポート
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
