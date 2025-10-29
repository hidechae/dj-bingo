import { useState, useEffect } from "react";
import { Modal } from "~/components/ui/Modal";

type NameEditModalProps = {
  isOpen: boolean;
  currentName: string;
  onSave: (newName: string) => void;
  onCancel: () => void;
  isSaving: boolean;
};

export const NameEditModal: React.FC<NameEditModalProps> = ({
  isOpen,
  currentName,
  onSave,
  onCancel,
  isSaving,
}) => {
  const [editingName, setEditingName] = useState(currentName);

  useEffect(() => {
    setEditingName(currentName);
  }, [currentName, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingName.trim() && editingName.trim() !== currentName) {
      onSave(editingName.trim());
    } else {
      onCancel();
    }
  };

  return (
    <Modal isOpen={isOpen} size="md" className="p-5">
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">表示名を変更</h3>
        </div>

        <form onSubmit={handleSubmit} className="mt-4">
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              表示名
            </label>
            <input
              type="text"
              id="name"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              autoFocus
              required
              disabled={isSaving}
              placeholder="例: 田中太郎"
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
              disabled={!editingName.trim() || isSaving}
              className="cursor-pointer rounded-sm bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
