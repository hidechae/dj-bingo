interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: "blue" | "green" | "red";
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "確認",
  cancelText = "キャンセル",
  confirmButtonColor = "blue",
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const colorClasses = {
    blue: "bg-blue-600 hover:bg-blue-700",
    green: "bg-green-600 hover:bg-green-700",
    red: "bg-red-600 hover:bg-red-700",
  };

  return (
    <div className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600/20">
      <div className="relative top-20 mx-auto max-w-md rounded-md border bg-white p-5 shadow-lg">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <div className="mt-4">
            <p className="text-sm text-gray-600">{message}</p>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${colorClasses[confirmButtonColor]}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
