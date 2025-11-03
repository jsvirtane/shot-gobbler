import React, { useState } from "react";

interface AccordionProps {
  header: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

const Accordion: React.FC<AccordionProps> = ({
  header,
  children,
  defaultOpen = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`accordion ${className}`}>
      <button
        onClick={toggleAccordion}
        className="flex w-full items-center justify-between p-4 rounded-lg bg-gray-100  text-left hover:bg-gray-200 focus:ring-2 focus:ring-gray-300 focus:outline-none"
        aria-expanded={isOpen}
      >
        <div className="flex-1">{header}</div>
        <svg
          className={`h-5 w-5 transform transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="accordion-content mt-2 rounded-lg border border-gray-200 bg-white p-4">
          {children}
        </div>
      )}
    </div>
  );
};

export default Accordion;
