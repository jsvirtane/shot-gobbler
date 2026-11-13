import html2canvas from "html2canvas-pro";
import React, { useEffect, useRef, useState } from "react";

interface ShareButtonProps {
  targetElementId?: string;
  className?: string;
  title?: string;
  /** Whether the tab has data; Share image and Export JSON need it. */
  hasData?: boolean;
  onExportJSON?: () => void;
  /** Downloads the current match; the item is shown only when given. */
  onExportMatch?: () => void;
  onImport?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBeforeShare?: () => Promise<void>;
}

const MENU_LABEL = "Share, export or import";

const menuItemClass =
  "flex w-full items-center gap-3 px-4 py-3 text-left text-gray-700 transition-colors hover:bg-gray-50 focus-visible:bg-gray-100 focus-visible:outline-none disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent";

const MenuIcon: React.FC<{ path: string }> = ({ path }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className="shrink-0"
  >
    <path d={path} fill="currentColor" />
  </svg>
);

const ICONS = {
  image:
    "M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z",
  exportFile:
    "M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20ZM8 15.01L9.41 16.42L11 14.84V19H13V14.84L14.59 16.43L16 15.01L12.01 11L8 15.01Z",
  match:
    "M19 4H18V2H16V4H8V2H6V4H5C3.89 4 3 4.9 3 6V20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V10H19V20ZM19 8H5V6H19V8ZM11 18H13V15H16L12 11L8 15H11V18Z",
  import: "M9 16V10H5L12 3L19 10H15V16H9ZM5 20V18H19V20H5Z",
};

/**
 * One fixed data menu ("⋯") for sharing the pitch as an image, exporting
 * and importing. The icon never changes; items that need data are disabled
 * while the tab is empty.
 */
const ShareButton: React.FC<ShareButtonProps> = ({
  // Id of the PitchContainer.tsx component that we want to capture by default
  targetElementId = "share-pitch",
  className = "",
  title = "Shot Gobbler Analysis",
  hasData = true,
  onExportJSON,
  onExportMatch,
  onImport,
  onBeforeShare,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on Esc and return focus to the menu button
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen]);

  const onShareImage = async () => {
    try {
      // Call the callback to prepare the view (e.g., switch to pitch view)
      if (onBeforeShare) {
        await onBeforeShare();
        // Give the UI a moment to render the pitch view
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      // Find the target element to capture
      const targetElement = targetElementId
        ? document.getElementById(targetElementId)
        : document.querySelector("main");

      if (!targetElement) {
        console.error("Target element not found for screenshot");
        return;
      }

      // Capture screenshot using html2canvas
      const canvas = await html2canvas(targetElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#f3f4f6", // gray-100 background
        scale: 2, // Higher quality for mobile devices
        scrollX: 0,
        scrollY: 0,
      });

      const image = canvas.toDataURL("image/png");
      const res = await fetch(image);
      const blob = await res.blob();

      // Check if Web Share API is supported (mainly on mobile)
      if (navigator.share && navigator.canShare) {
        const filesArray: File[] = [
          new File([blob], `${title.toLowerCase().replace(/\s+/g, "-")}.png`, {
            type: "image/png",
            lastModified: new Date().getTime(),
          }),
        ];
        const shareData = {
          files: filesArray,
        };

        // Check if files can be shared
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          setIsMenuOpen(false);
          return;
        }
      }

      // Fallback: Create download link for desktop or unsupported browsers
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title.toLowerCase().replace(/\s+/g, "-")}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Error sharing screenshot:", error);
      // You could add a toast notification here
    }
  };

  const handleExportJSON = () => {
    if (onExportJSON) {
      onExportJSON();
      setIsMenuOpen(false);
    }
  };

  const handleExportMatch = () => {
    onExportMatch?.();
    setIsMenuOpen(false);
  };

  const handleImportClick = () => {
    setIsMenuOpen(false);
    fileInputRef.current?.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onImport) {
      onImport(event);
    }
  };

  return (
    <div className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`flex items-center justify-center text-gray-600 transition-colors hover:text-blue-500 ${className}`}
        title={MENU_LABEL}
        aria-label={MENU_LABEL}
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
      >
        {/* Horizontal "⋯" */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="h-6 w-6"
        >
          <circle cx="5" cy="12" r="2" fill="currentColor" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <circle cx="19" cy="12" r="2" fill="currentColor" />
        </svg>
      </button>

      {/* Outside the menu so the file picker still works once it closes */}
      <input
        type="file"
        accept=".json"
        onChange={handleImport}
        ref={fileInputRef}
        className="hidden"
        data-testid="import-file-input"
      />

      {isMenuOpen && (
        <>
          {/* Backdrop to close menu when clicking outside */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsMenuOpen(false)}
          />
          <div
            role="menu"
            aria-label={MENU_LABEL}
            className="absolute top-full right-0 z-40 mt-2 w-52 overflow-hidden rounded-lg bg-white py-1 shadow-xl ring-1 ring-black/5"
          >
            <button
              type="button"
              role="menuitem"
              onClick={onShareImage}
              disabled={!hasData}
              className={menuItemClass}
            >
              <MenuIcon path={ICONS.image} />
              <span>Share image</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={handleExportJSON}
              disabled={!hasData}
              className={menuItemClass}
            >
              <MenuIcon path={ICONS.exportFile} />
              <span>Export JSON</span>
            </button>
            {onExportMatch && (
              <button
                type="button"
                role="menuitem"
                onClick={handleExportMatch}
                className={menuItemClass}
              >
                <MenuIcon path={ICONS.match} />
                <span>Export match</span>
              </button>
            )}
            <div role="separator" className="my-1 border-t border-gray-100" />
            <button
              type="button"
              role="menuitem"
              onClick={handleImportClick}
              className={menuItemClass}
            >
              <MenuIcon path={ICONS.import} />
              <span>Import</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ShareButton;
