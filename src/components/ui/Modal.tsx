import { type ReactNode } from "react";

type ModalSize = "sm" | "md" | "lg" | "xl";

type ModalProps = {
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
  size?: ModalSize;
  className?: string;
};

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export const Modal = ({
  isOpen,
  onClose,
  children,
  size = "md",
  className = "",
}: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600/20">
      <div
        className={`relative top-20 mx-auto w-full rounded-lg border bg-white p-6 shadow-lg ${sizeClasses[size]} ${className}`}
      >
        {children}
      </div>
    </div>
  );
};
