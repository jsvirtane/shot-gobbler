import React from "react";

interface DocsMarkerDisplayProps {
  children: React.ReactNode;
}

/**
 * Wrapper component for displaying markers in the documentation.
 * Creates a centered container with relative positioning so markers can be positioned correctly.
 */
export const DocsMarkerDisplay: React.FC<DocsMarkerDisplayProps> = ({
  children,
}) => {
  return (
    <div className="relative flex h-12 w-12 items-center justify-center">
      {children}
    </div>
  );
};

export default DocsMarkerDisplay;
