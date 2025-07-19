import React, { useState } from "react";
import { ChainTerminationReason } from "../../types/PassChain";
import {
  getCancelButtonStyle,
  getSubmitButtonStyle,
} from "../../utils/buttonStyles";

type PassChainFormProps = {
  onSubmit: (data: { terminationReason: ChainTerminationReason }) => void;
  onCancel: () => void;
};

const PassChainForm: React.FC<PassChainFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const [terminationReason, setTerminationReason] =
    useState<ChainTerminationReason>("manual_end");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ terminationReason });
  };

  const terminationOptions: { value: ChainTerminationReason; label: string }[] =
    [
      { value: "goal", label: "Goal" },
      { value: "shot_saved", label: "Shot Saved" },
      { value: "shot_missed", label: "Shot Missed" },
      { value: "shot_blocked", label: "Shot Blocked" },
      { value: "tackled", label: "Tackled" },
      { value: "intercepted", label: "Intercepted" },
      { value: "clearance", label: "Clearance" },
      { value: "bad_pass", label: "Bad Pass" },
      { value: "out_of_bounds", label: "Out of Bounds" },
      { value: "fouled", label: "Fouled" },
      { value: "offside", label: "Offside" },
      { value: "manual_end", label: "Manual End" },
    ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-3 block text-sm font-medium text-gray-700">
          How did the chain end?
        </label>
        <div className="grid grid-cols-2 gap-2">
          {terminationOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTerminationReason(option.value)}
              className={`rounded-md px-3 py-3 text-sm font-medium transition-colors ${
                terminationReason === option.value
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-col justify-between gap-3 md:flex-row">
        <button type="submit" className={getSubmitButtonStyle()}>
          Save Pass Chain
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={getCancelButtonStyle()}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default PassChainForm;
