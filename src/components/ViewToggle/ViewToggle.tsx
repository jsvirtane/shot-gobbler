import React from "react";
import SegmentedControl from "../SegmentedControl";

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
  ariaLabel?: string;
}

const ViewToggle: React.FC<ViewToggleProps> = ({
  currentView,
  options,
  onViewChange,
  className = "",
  ariaLabel = "View",
}) => {
  return (
    <div className={`flex justify-center ${className}`}>
      <SegmentedControl
        variant="joined"
        size="sm"
        ariaLabel={ariaLabel}
        options={options.map(({ id, label, icon }) => ({
          value: id,
          label,
          icon,
        }))}
        value={currentView}
        onChange={onViewChange}
      />
    </div>
  );
};

export default ViewToggle;
