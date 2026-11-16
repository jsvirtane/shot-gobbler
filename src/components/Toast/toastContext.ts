import { createContext, useContext, useEffect } from "react";
import { NotifyVariant } from "../../utils/notify";

export type ToastVariant = NotifyVariant;

/**
 * Where toasts appear: at the top (review mode), or as one compact pill
 * just above the focus mode bar at the bottom.
 */
export type ToastPlacement = "top" | "bottom";

export type ToastOptions = {
  message: string;
  /** Shown in bold before the message, e.g. a shot's result. */
  lead?: string;
  /** Colour of a dot before the text, e.g. the team's marker colour. */
  dot?: string;
  /** Read out before the text but not shown, e.g. "Shot added". */
  srLabel?: string;
  variant?: ToastVariant;
  /** Optional button, e.g. Undo. Clicking it also dismisses the toast. */
  action?: { label: string; onClick: () => void };
  /** Milliseconds before auto-dismiss; defaults to 4 s, or 6 s with an action. */
  duration?: number;
};

export type ToastApi = {
  showToast: (options: ToastOptions) => number;
  dismissToast: (id: number) => void;
  setPlacement: (placement: ToastPlacement) => void;
  /** Hides toasts until the returned function is called. */
  hide: () => () => void;
};

/** Without a provider toasts are silently dropped. */
const noopApi: ToastApi = {
  showToast: () => -1,
  dismissToast: () => {},
  setPlacement: () => {},
  hide: () => () => {},
};

export const ToastContext = createContext<ToastApi>(noopApi);

export const useToast = (): ToastApi => useContext(ToastContext);

/** Sets where toasts appear while the caller is mounted. */
export const useToastPlacement = (placement: ToastPlacement) => {
  const { setPlacement } = useToast();
  useEffect(() => {
    setPlacement(placement);
    return () => setPlacement("top");
  }, [placement, setPlacement]);
};

/** Hides toasts while the caller is mounted, e.g. an open radial menu. */
export const useHideToasts = () => {
  const { hide } = useToast();
  useEffect(() => hide(), [hide]);
};
