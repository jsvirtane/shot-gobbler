import { createContext, useContext } from "react";
import { NotifyVariant } from "../../utils/notify";

export type ToastVariant = NotifyVariant;

export type ToastOptions = {
  message: string;
  variant?: ToastVariant;
  /** Optional button, e.g. Undo. Clicking it also dismisses the toast. */
  action?: { label: string; onClick: () => void };
  /** Milliseconds before auto-dismiss; defaults to 4 s, or 6 s with an action. */
  duration?: number;
};

export type ToastApi = {
  showToast: (options: ToastOptions) => number;
  dismissToast: (id: number) => void;
};

/** Without a provider toasts are silently dropped. */
const noopApi: ToastApi = {
  showToast: () => -1,
  dismissToast: () => {},
};

export const ToastContext = createContext<ToastApi>(noopApi);

export const useToast = (): ToastApi => useContext(ToastContext);
