import React, { useId } from "react";

type MinuteInputProps = {
  /** The typed minute; empty means "use the match clock". */
  value: string;
  onChange: (value: string) => void;
};

/** Small optional number input to override the match minute of an event. */
export const MinuteInput: React.FC<MinuteInputProps> = ({
  value,
  onChange,
}) => {
  const id = useId();
  return (
    <div className="mb-4 flex items-center gap-3">
      <label htmlFor={id} className="font-bold text-gray-600">
        Minute:
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        max={200}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="–"
        className="w-20 rounded-md border border-gray-300 p-2 text-base"
      />
    </div>
  );
};
