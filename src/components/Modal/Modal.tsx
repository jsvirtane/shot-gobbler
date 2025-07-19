import React from "react";

type ModalProps = {
  isOpen: boolean;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  children,
  maxWidth = "400px",
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60">
      <div
        className="z-[1001] w-[90%] rounded-lg bg-white p-6 shadow-lg sm:p-8"
        style={{ maxWidth }}
      >
        {title && (
          <h2 className="mb-5 mt-0 text-center text-[1.4em] text-gray-800">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
};

export default Modal;
