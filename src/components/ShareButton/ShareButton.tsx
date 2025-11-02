import html2canvas from "html2canvas-pro";
import React from "react";

interface ShareButtonProps {
  targetElementId?: string;
  className?: string;
  title?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({
  // Id of the PitchContainer.tsx component that we want to capture by default
  targetElementId = "share-pitch",
  className = "",
  title = "Shot Gobbler Analysis",
}) => {
  const onShare = async () => {
    try {
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
    } catch (error) {
      console.error("Error sharing screenshot:", error);
      // You could add a toast notification here
    }
  };

  return (
    <button
      onClick={onShare}
      className={`flex items-center justify-center p-3 text-gray-600 transition-all duration-200 hover:scale-105 hover:text-blue-500 ${className}`}
      title="Share screenshot"
      aria-label="Share screenshot"
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
  );
};

export default ShareButton;
