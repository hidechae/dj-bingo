import { useState, useEffect } from "react";

interface TitleEditModalProps {
  isOpen: boolean;
  currentTitle: string;
  onSave: (newTitle: string) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export const TitleEditModal: React.FC<TitleEditModalProps> = ({
  isOpen,
  currentTitle,
  onSave,
  onCancel,
  isSaving,
}) => {
  const [editingTitle, setEditingTitle] = useState(currentTitle);

  useEffect(() => {
    setEditingTitle(currentTitle);
  }, [currentTitle, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTitle.trim()) {
      onSave(editingTitle.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600/20">
      <div className="relative top-20 mx-auto max-w-md rounded-md border bg-white p-5 shadow-lg">
        <div className="mt-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
              <svg
                className="h-5 w-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              ビンゴ名を変更
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="mt-4">
            <div className="mb-4">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                ビンゴ名
              </label>
              <input
                type="text"
                id="title"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                autoFocus
                required
                disabled={isSaving}
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSaving}
                className="cursor-pointer rounded-sm bg-gray-300 px-4 py-2 text-sm text-gray-800 hover:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={!editingTitle.trim() || isSaving}
                className="cursor-pointer rounded-sm bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "保存中..." : "保存"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
