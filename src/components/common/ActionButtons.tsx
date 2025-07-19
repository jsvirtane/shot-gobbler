import React, { useRef } from "react";

type ImportButtonProps = {
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  children: React.ReactNode;
  accept?: string;
};

export const ImportButton: React.FC<ImportButtonProps> = ({
  onImport,
  children,
  accept = ".json",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        type="file"
        accept={accept}
        onChange={onImport}
        ref={fileInputRef}
        className="hidden"
      />
      <button
        onClick={triggerFileInput}
        className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
      >
        {children}
      </button>
    </>
  );
};

interface ExportButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  onClick,
  children,
}) => {
  return (
    <button
      onClick={onClick}
      className="rounded bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-800"
    >
      {children}
    </button>
  );
};

interface ClearButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

export const ClearButton: React.FC<ClearButtonProps> = ({
  onClick,
  children,
}) => {
  return (
    <button
      onClick={onClick}
      className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
    >
      {children}
    </button>
  );
};

interface RemoveItemButtonProps {
  onClick: () => void;
  title?: string;
}

export const RemoveItemButton: React.FC<RemoveItemButtonProps> = ({
  onClick,
  title = "Remove this item",
}) => {
  return (
    <button
      onClick={onClick}
      className="h-5 w-5 cursor-pointer items-center justify-center rounded bg-red-500 hover:bg-red-600"
      title={title}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  );
};
