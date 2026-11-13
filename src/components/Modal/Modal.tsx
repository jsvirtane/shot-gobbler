import React, { useEffect, useId, useRef } from "react";

type ModalProps = {
  isOpen: boolean;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  /** Called on Esc or a click on the backdrop. Without it the modal can only be closed from its own buttons. */
  onClose?: () => void;
};

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  children,
  maxWidth = "400px",
  onClose,
}) => {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Move focus into the dialog when it opens and back to where it was when it closes
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => previouslyFocused?.focus?.();
  }, [isOpen]);

  // Close on Esc and keep Tab focus inside the dialog
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && onCloseRef.current) {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Only close when the click lands on the backdrop itself, not inside the panel
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4"
      onClick={handleBackdropClick}
      data-testid="modal-backdrop"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className="z-[1001] max-h-[calc(100dvh-2rem)] w-full overflow-y-auto overscroll-contain rounded-lg bg-white p-6 shadow-lg focus:outline-none sm:p-8"
        style={{ maxWidth }}
      >
        {title && (
          <h2
            id={titleId}
            className="mt-0 mb-5 text-center text-[1.4em] text-gray-800"
          >
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
};

export default Modal;
