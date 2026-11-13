import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { setNotifyHandler } from "../../utils/notify";
import { ToastApi, ToastContext, ToastOptions } from "./toastContext";

const DEFAULT_DURATION = 4000;
const ACTION_DURATION = 6000;
/** Older toasts are dropped beyond this, so they never fill the screen. */
const MAX_TOASTS = 3;

type ToastItem = ToastOptions & { id: number };

const VARIANT_STYLES: Record<NonNullable<ToastOptions["variant"]>, string> = {
  info: "bg-neutral-900 text-white",
  success: "bg-green-800 text-white",
  error: "bg-red-700 text-white",
};

const Toast: React.FC<{
  toast: ToastItem;
  onDismiss: (id: number) => void;
}> = ({ toast, onDismiss }) => {
  const { id, message, variant = "info", action, duration } = toast;
  const timeout = duration ?? (action ? ACTION_DURATION : DEFAULT_DURATION);

  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(id), timeout);
    return () => window.clearTimeout(timer);
  }, [id, timeout, onDismiss]);

  const isError = variant === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={`pointer-events-auto flex w-full items-center gap-2 rounded-lg py-2 pr-2 pl-4 text-sm shadow-lg ${VARIANT_STYLES[variant]}`}
    >
      <span className="flex-1">{message}</span>
      {action && (
        <button
          type="button"
          onClick={() => {
            action.onClick();
            onDismiss(id);
          }}
          className="rounded px-2 py-1 font-semibold text-yellow-300 uppercase hover:bg-white/10"
        >
          {action.label}
        </button>
      )}
      <button
        type="button"
        onClick={() => onDismiss(id)}
        aria-label="Dismiss"
        className="rounded px-2 py-1 text-white/70 hover:bg-white/10 hover:text-white"
      >
        ✕
      </button>
    </div>
  );
};

/**
 * Shows toasts at the top of the screen (below the header on wide screens);
 * use them via useToast(). The top keeps them off the pitch, which runs down
 * to the bottom tab bar on phones, and off the action buttons at the bottom
 * of forms. They stay above modals so form errors are visible.
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((options: ToastOptions) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { ...options, id }].slice(-MAX_TOASTS));
    return id;
  }, []);

  // Route notify() calls (import/export messages) to toasts
  useEffect(
    () =>
      setNotifyHandler((message, variant) => showToast({ message, variant })),
    [showToast],
  );

  const api = useMemo<ToastApi>(
    () => ({ showToast, dismissToast }),
    [showToast, dismissToast],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        data-testid="toast-viewport"
        className="pointer-events-none fixed inset-x-0 top-0 z-[1100] mx-auto flex max-w-md flex-col gap-2 px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)] md:top-15"
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
