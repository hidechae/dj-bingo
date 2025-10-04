import { type NextPage } from "next";
import Head from "next/head";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { api } from "~/utils/api";
import { BingoSize } from "@prisma/client";

interface Song {
  title: string;
  artist: string;
}

const CreateBingo: NextPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [size, setSize] = useState<BingoSize>(BingoSize.THREE_BY_THREE);
  const [songs, setSongs] = useState<Song[]>([{ title: "", artist: "" }]);

  const createBingoMutation = api.bingo.create.useMutation({
    onSuccess: (data) => {
      void router.push(`/admin/game/${data.id}`);
    },
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      void router.push("/auth/signin");
    }
  }, [session, status, router]);

  const addSong = () => {
    setSongs([...songs, { title: "", artist: "" }]);
  };

  const removeSong = (index: number) => {
    setSongs(songs.filter((_, i) => i !== index));
  };

  const updateSong = (index: number, field: keyof Song, value: string) => {
    const updatedSongs = songs.map((song, i) =>
      i === index ? { ...song, [field]: value } : song
    );
    setSongs(updatedSongs);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validSongs = songs.filter(song => song.title.trim() !== "");
    const requiredSongs = getRequiredSongCount(size);
    
    if (validSongs.length < requiredSongs) {
      alert(`${size}のビンゴには最低${requiredSongs}曲必要です`);
      return;
    }

    createBingoMutation.mutate({
      title,
      size,
      songs: validSongs,
    });
  };

  const getRequiredSongCount = (size: BingoSize): number => {
    switch (size) {
      case BingoSize.THREE_BY_THREE:
        return 9;
      case BingoSize.FOUR_BY_FOUR:
        return 16;
      case BingoSize.FIVE_BY_FIVE:
        return 25;
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <Head>
        <title>ビンゴ作成 - DJ Bingo</title>
        <meta name="description" content="新しいビンゴゲームを作成" />
      </Head>
      <main className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                新しいビンゴを作成
              </h1>
              <button
                onClick={() => router.back()}
                className="text-gray-500 hover:text-gray-700"
              >
                戻る
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white shadow px-6 py-8 rounded-lg">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    ビンゴ名
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border"
                    placeholder="例: 2025年ヒット曲ビンゴ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    ビンゴサイズ
                  </label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value as BingoSize)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border"
                  >
                    <option value={BingoSize.THREE_BY_THREE}>3x3 (9曲)</option>
                    <option value={BingoSize.FOUR_BY_FOUR}>4x4 (16曲)</option>
                    <option value={BingoSize.FIVE_BY_FIVE}>5x5 (25曲)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white shadow px-6 py-8 rounded-lg">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  楽曲リスト (最低{getRequiredSongCount(size)}曲必要)
                </h3>
                <button
                  type="button"
                  onClick={addSong}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  曲を追加
                </button>
              </div>

              <div className="space-y-4">
                {songs.map((song, index) => (
                  <div key={index} className="flex gap-4 items-center">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={song.title}
                        onChange={(e) => updateSong(index, "title", e.target.value)}
                        placeholder="曲名"
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={song.artist}
                        onChange={(e) => updateSong(index, "artist", e.target.value)}
                        placeholder="アーティスト名"
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border"
                      />
                    </div>
                    {songs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSong(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        削除
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={createBingoMutation.isLoading}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {createBingoMutation.isLoading ? "作成中..." : "ビンゴを作成"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
};

export default CreateBingo;