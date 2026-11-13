import React from "react";

interface DocsMarkerDisplayProps {
  children: React.ReactNode;
}

/**
 * Shows one real pitch marker in the documentation, on a patch of pitch
 * green so it looks as it does on the map. Markers are centred whatever
 * pitch position their sample data has, so samples can use realistic
 * coordinates (which drive e.g. xG-based size).
 */
export const DocsMarkerDisplay: React.FC<DocsMarkerDisplayProps> = ({
  children,
}) => {
  return (
    <div
      className="relative flex h-12 w-12 shrink-0 items-center justify-center [&>*]:top-1/2! [&>*]:left-1/2!"
      // Same green as the pitch image
      style={{ backgroundColor: "#00a000", borderRadius: "0.375rem" }}
      data-testid="docs-marker-display"
    >
      {children}
    </div>
  );
};

interface DocsExampleProps {
  label: string;
  children: React.ReactNode;
}

/** A marker example with its description. */
export const DocsExample: React.FC<DocsExampleProps> = ({
  label,
  children,
}) => (
  <div className="flex items-center space-x-3">
    <DocsMarkerDisplay>{children}</DocsMarkerDisplay>
    <span className="text-gray-700">{label}</span>
  </div>
);

interface DocsExampleGroupProps {
  title: string;
  children: React.ReactNode;
}

/** A titled grid of marker examples. */
export const DocsExampleGroup: React.FC<DocsExampleGroupProps> = ({
  title,
  children,
}) => (
  <div>
    <h4 className="mb-2 text-sm font-semibold text-gray-500 uppercase">
      {title}
    </h4>
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{children}</div>
  </div>
);

/** The legend exactly as it appears under the map. */
export const DocsLegendPreview: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div>
    <h4 className="mb-2 text-sm font-semibold text-gray-500 uppercase">
      Legend under the map
    </h4>
    <div className="inline-block rounded-md bg-gray-100 px-2 pb-1">
      {children}
    </div>
  </div>
);

export default DocsMarkerDisplay;
