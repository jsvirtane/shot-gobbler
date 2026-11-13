export type NotifyVariant = "info" | "success" | "error";

type NotifyHandler = (message: string, variant: NotifyVariant) => void;

let handler: NotifyHandler | null = null;

/**
 * Lets the mounted ToastProvider receive notify() messages. Returns a
 * function that unregisters it again.
 */
export const setNotifyHandler = (next: NotifyHandler): (() => void) => {
  handler = next;
  return () => {
    if (handler === next) handler = null;
  };
};

/**
 * Shows a message to the user. Every user-facing message from data
 * import and export goes through here. It appears as a toast while a
 * ToastProvider is mounted and falls back to alert() otherwise.
 */
export const notify = (
  message: string,
  variant: NotifyVariant = "info",
): void => {
  if (handler) {
    handler(message, variant);
  } else {
    window.alert(message);
  }
};
