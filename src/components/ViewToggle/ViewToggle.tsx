import React from "react";
import SegmentedControl from "../SegmentedControl";

type ViewOption = {
  id: string;
  label: string;
};

interface ViewToggleProps {
  currentView: string;
  options: ViewOption[];
  onViewChange: (view: string) => void;
  className?: string;
  ariaLabel?: string;
}

/** The Pitch / List / Stats switch: a grey track with a white pill. */
const ViewToggle: React.FC<ViewToggleProps> = ({
  currentView,
  options,
  onViewChange,
  className = "",
  ariaLabel = "View",
}) => (
  <SegmentedControl
    variant="pill"
    ariaLabel={ariaLabel}
    options={options.map(({ id, label }) => ({ value: id, label }))}
    value={currentView}
    onChange={onViewChange}
    className={className}
  />
);

export default ViewToggle;
