import html2canvas from "html2canvas-pro";
import React, { useRef, useState } from "react";

interface ShareButtonProps {
  targetElementId?: string;
  className?: string;
  title?: string;
  hasData?: boolean;
  onExportJSON?: () => void;
  onImport?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBeforeShare?: () => Promise<void>;
}

const ShareButton: React.FC<ShareButtonProps> = ({
  // Id of the PitchContainer.tsx component that we want to capture by default
  targetElementId = "share-pitch",
  className = "",
  title = "Shot Gobbler Analysis",
  hasData = true,
  onExportJSON,
  onImport,
  onBeforeShare,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onImport) {
      onImport(event);
    }
  };

  // If no data, show import button
  if (!hasData) {
    return (
      <>
        <input
          type="file"
          accept=".json"
          onChange={handleImport}
          ref={fileInputRef}
          className="hidden"
        />
        <button
          onClick={handleImportClick}
          className={`flex items-center justify-center p-3 text-gray-600 transition-all duration-200 hover:scale-105 hover:text-blue-500 ${className}`}
          title="Import data"
          aria-label="Import data"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
          >
            <path
              d="M9 16V10H5L12 3L19 10H15V16H9ZM5 20V18H19V20H5Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </>
    );
  }

  // If has data, show share button with floating menu
  return (
    <div className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`flex items-center justify-center p-3 text-gray-600 transition-all duration-200 hover:scale-105 hover:text-blue-500 ${className}`}
        title="Share or export"
        aria-label="Share or export"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
        >
          <path
            d="M18 16.08C17.24 16.08 16.56 16.38 16.04 16.85L8.91 12.7C8.96 12.47 9 12.24 9 12C9 11.76 8.96 11.53 8.91 11.3L15.96 7.19C16.5 7.69 17.21 8 18 8C19.66 8 21 6.66 21 5C21 3.34 19.66 2 18 2C16.34 2 15 3.34 15 5C15 5.24 15.04 5.47 15.09 5.7L8.04 9.81C7.5 9.31 6.79 9 6 9C4.34 9 3 10.34 3 12C3 13.66 4.34 15 6 15C6.79 15 7.5 14.69 8.04 14.19L15.16 18.34C15.11 18.55 15.08 18.77 15.08 19C15.08 20.61 16.39 21.92 18 21.92C19.61 21.92 20.92 20.61 20.92 19C20.92 17.39 19.61 16.08 18 16.08Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {/* Floating menu */}
      {isMenuOpen && (
        <>
          {/* Backdrop to close menu when clicking outside */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="absolute top-full right-0 z-40 mt-2 w-48 overflow-hidden rounded-lg bg-white shadow-xl">
            <button
              onClick={onShareImage}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-gray-700 transition-colors hover:bg-gray-50"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z"
                  fill="currentColor"
                />
              </svg>
              <span>Share Image</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-gray-700 transition-colors hover:bg-gray-50"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20ZM8 15.01L9.41 16.42L11 14.84V19H13V14.84L14.59 16.43L16 15.01L12.01 11L8 15.01Z"
                  fill="currentColor"
                />
              </svg>
              <span>Export JSON</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ShareButton;
