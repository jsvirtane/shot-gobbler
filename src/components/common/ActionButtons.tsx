import React from "react";

interface ClearButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClick: () => void;
  children: React.ReactNode;
}

export const ClearButton: React.FC<ClearButtonProps> = ({
  onClick,
  children,
  ...rest
}) => {
  return (
    <button
      onClick={onClick}
      className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
      {...rest}
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
