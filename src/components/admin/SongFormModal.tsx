import { useState, useEffect } from "react";
import { Modal } from "~/components/ui/Modal";

type SongFormModalProps = {
  isOpen: boolean;
  mode: "add" | "edit";
  initialData?: { title: string; artist: string };
  onSave: (data: { title: string; artist: string }) => void;
  onCancel: () => void;
  isSaving?: boolean;
};

export const SongFormModal = ({
  isOpen,
  mode,
  initialData,
  onSave,
  onCancel,
  isSaving = false,
}: SongFormModalProps) => {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || "");
      setArtist(initialData?.artist || "");
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("曲名を入力してください");
      return;
    }
    onSave({ title: title.trim(), artist: artist.trim() });
  };

  return (
    <Modal isOpen={isOpen} size="md">
      <h2 className="mb-4 text-xl font-semibold text-gray-900">
        {mode === "add" ? "楽曲を追加" : "楽曲を編集"}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              曲名 <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="曲名を入力"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              autoFocus
              disabled={isSaving}
            />
          </div>
          <div>
            <label
              htmlFor="artist"
              className="block text-sm font-medium text-gray-700"
            >
              アーティスト名
            </label>
            <input
              id="artist"
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="アーティスト名を入力"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={isSaving}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "保存中..." : mode === "add" ? "追加" : "保存"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
