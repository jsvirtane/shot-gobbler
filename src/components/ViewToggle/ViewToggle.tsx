import React from "react";

type ViewOption = {
  id: string;
  label: string;
  icon?: string;
};

interface ViewToggleProps {
  currentView: string;
  options: ViewOption[];
  onViewChange: (view: string) => void;
  className?: string;
}

const ViewToggle: React.FC<ViewToggleProps> = ({
  currentView,
  options,
  onViewChange,
  className = "",
}) => {
  return (
    <div className={`flex justify-center ${className}`}>
      <div className="inline-flex rounded-md shadow-sm" role="group">
        {options.map((option, index) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onViewChange(option.id)}
            className={`px-4 py-2 text-sm font-medium ${index === 0 ? "rounded-l-lg" : ""} ${index === options.length - 1 ? "rounded-r-lg" : ""} ${
              currentView === option.id
                ? "bg-blue-600 text-white"
                : "border border-gray-200 bg-white text-gray-900 hover:bg-gray-100"
            } `}
          >
            {option.icon && <span className="mr-1">{option.icon}</span>}
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ViewToggle;
