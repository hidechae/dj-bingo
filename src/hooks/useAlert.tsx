import { useState, useCallback } from "react";
import { AlertDialog } from "~/components/ui/AlertDialog";

type AlertOptions = {
  title?: string;
  variant?: "info" | "success" | "warning" | "error";
  confirmLabel?: string;
};

export const useAlert = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [options, setOptions] = useState<AlertOptions>({});

  const showAlert = useCallback((msg: string, opts: AlertOptions = {}) => {
    setMessage(msg);
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const closeAlert = useCallback(() => {
    setIsOpen(false);
  }, []);

  const AlertComponent = useCallback(
    () => (
      <AlertDialog
        isOpen={isOpen}
        message={message}
        title={options.title}
        variant={options.variant}
        confirmLabel={options.confirmLabel}
        onClose={closeAlert}
      />
    ),
    [isOpen, message, options, closeAlert]
  );

  return {
    showAlert,
    AlertComponent,
  };
};
