import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { setNotifyHandler } from "../../utils/notify";
import {
  ToastApi,
  ToastContext,
  ToastOptions,
  ToastPlacement,
} from "./toastContext";

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
  compact: boolean;
}> = ({ toast, onDismiss, compact }) => {
  const {
    id,
    message,
    lead,
    dot,
    srLabel,
    variant = "info",
    action,
    duration,
  } = toast;
  const timeout = duration ?? (action ? ACTION_DURATION : DEFAULT_DURATION);

  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(id), timeout);
    return () => window.clearTimeout(timer);
  }, [id, timeout, onDismiss]);

  const isError = variant === "error";
  // Only the buttons take taps: a tap on the text reaches the pitch below
  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      data-testid="toast"
      className={`pointer-events-none flex items-center gap-2 text-sm shadow-lg ${
        compact
          ? "max-w-full rounded-full py-1 pr-1 pl-3"
          : "w-full rounded-lg py-2 pr-2 pl-4"
      } ${VARIANT_STYLES[variant]}`}
    >
      {dot && (
        <span
          aria-hidden="true"
          className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-white/70"
          style={{ backgroundColor: dot }}
        />
      )}
      <span className={`min-w-0 flex-1 ${compact ? "truncate" : ""}`}>
        {srLabel && <span className="sr-only">{srLabel}: </span>}
        {lead && <strong className="font-semibold">{lead}</strong>}
        {lead && message && " · "}
        {message}
      </span>
      {action && (
        <button
          type="button"
          onClick={() => {
            action.onClick();
            onDismiss(id);
          }}
          className="pointer-events-auto shrink-0 rounded-full px-2 py-1 font-semibold text-yellow-300 uppercase hover:bg-white/10"
        >
          {action.label}
        </button>
      )}
      <button
        type="button"
        onClick={() => onDismiss(id)}
        aria-label="Dismiss"
        className="pointer-events-auto shrink-0 rounded-full px-2 py-1 text-white/70 hover:bg-white/10 hover:text-white"
      >
        ✕
      </button>
    </div>
  );
};

/**
 * Shows toasts; use them via useToast(). In review mode they stack at the
 * top of the screen (below the header on wide screens), off the pitch and
 * off the action buttons at the bottom of forms. In focus mode
 * (useToastPlacement("bottom")) only the newest shows, as a compact pill
 * just above the floating bar, so the top goal stays clear. Toasts never
 * take taps except on their own buttons, they hide while a radial menu is
 * open (useHideToasts), and they stay above modals so form errors are
 * visible.
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [placement, setPlacement] = useState<ToastPlacement>("top");
  const [hiddenBy, setHiddenBy] = useState(0);
  const nextId = useRef(1);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((options: ToastOptions) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { ...options, id }].slice(-MAX_TOASTS));
    return id;
  }, []);

  const hide = useCallback(() => {
    setHiddenBy((n) => n + 1);
    let shown = false;
    return () => {
      if (shown) return;
      shown = true;
      setHiddenBy((n) => n - 1);
    };
  }, []);

  // Route notify() calls (import/export messages) to toasts
  useEffect(
    () =>
      setNotifyHandler((message, variant) => showToast({ message, variant })),
    [showToast],
  );

  const api = useMemo<ToastApi>(
    () => ({ showToast, dismissToast, setPlacement, hide }),
    [showToast, dismissToast, hide],
  );

  const bottom = placement === "bottom";
  const shown = bottom ? toasts.slice(-1) : toasts;

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        data-testid="toast-viewport"
        data-placement={placement}
        data-hidden={hiddenBy > 0 || undefined}
        className={`pointer-events-none fixed inset-x-0 z-[1100] mx-auto flex max-w-md flex-col gap-2 px-4 ${
          bottom
            ? // Just above the focus bar: 0.75rem margin + 3.5rem bar + gap
              "bottom-[calc(4.75rem+env(safe-area-inset-bottom))] items-center"
            : "top-0 pt-[calc(env(safe-area-inset-top)+0.5rem)] md:top-15"
        } ${hiddenBy > 0 ? "invisible" : ""}`}
      >
        {shown.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onDismiss={dismissToast}
            compact={bottom}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
