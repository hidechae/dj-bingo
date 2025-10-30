import { Modal } from "./Modal";

type AlertDialogProps = {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  variant?: "info" | "success" | "warning" | "error";
  onClose: () => void;
};

export const AlertDialog = ({
  isOpen,
  title = "お知らせ",
  message,
  confirmLabel = "OK",
  variant = "info",
  onClose,
}: AlertDialogProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return {
          bgColor: "bg-green-100",
          iconColor: "text-green-600",
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          ),
        };
      case "warning":
        return {
          bgColor: "bg-yellow-100",
          iconColor: "text-yellow-600",
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          ),
        };
      case "error":
        return {
          bgColor: "bg-red-100",
          iconColor: "text-red-600",
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          ),
        };
      default:
        return {
          bgColor: "bg-blue-100",
          iconColor: "text-blue-600",
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          ),
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Modal isOpen={isOpen} size="sm" className="p-5">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${styles.bgColor}`}
          >
            <svg
              className={`h-6 w-6 ${styles.iconColor}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {styles.icon}
            </svg>
          </div>
        </div>
        <h3 className="mb-2 text-lg font-medium text-gray-900">{title}</h3>
        <p className="mb-6 text-sm whitespace-pre-wrap text-gray-600">
          {message}
        </p>
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
