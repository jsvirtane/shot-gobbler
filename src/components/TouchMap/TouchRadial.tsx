import React, { useState } from "react";
import { createPortal } from "react-dom";
import { actionTypeInfo, outcomeInfo } from "../../constants/actionTypes";
import { Action, ActionOutcome, ActionType } from "../../types/Action";
import { parseMinuteInput } from "../../utils/matchClock";
import RadialMenu, { Insets, Point, RadialCenter } from "../RadialMenu";
import {
  CATEGORY_RING_COLORS,
  TouchItem,
  touchSections,
  TouchStep,
  typeDigit,
} from "./touchRings";

interface TouchRadialProps {
  /** Tap point in viewport px. */
  anchor: Point;
  /** The action being edited; a new action when left out. */
  editing?: Action;
  /** Space to keep clear, e.g. for the focus bar or tab bar. */
  insets?: Partial<Insets>;
  /** An outcome was picked: save the action (new or edited). */
  onSave: (actionType: ActionType, outcome: ActionOutcome) => void;
  /** Editing: Move was picked; the next pitch tap places the action. */
  onMove?: () => void;
  /** Editing: a new minute (undefined clears it). */
  onMinute?: (minute: number | undefined) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const Center: React.FC<{
  title: string;
  color?: string;
  children?: React.ReactNode;
}> = ({ title, color, children }) => (
  <>
    <b className="text-xs font-bold tracking-wide" style={{ color }}>
      {title}
    </b>
    {children && <span className="text-gray-600">{children}</span>}
  </>
);

/**
 * The touch tracker's radial menu: an action ring (with More), then the
 * chosen action's outcome ring; picking an outcome saves. Editing adds an
 * Edit section (Move, Minute, Delete) and outlines the current values.
 * Drawn over the whole screen so the ring is never clipped by the pitch.
 */
const TouchRadial: React.FC<TouchRadialProps> = ({
  anchor,
  editing,
  insets,
  onSave,
  onMove,
  onMinute,
  onDelete,
  onClose,
}) => {
  const [step, setStep] = useState<TouchStep>({ ring: "action" });

  const handlePick = ({ pick }: TouchItem) => {
    switch (pick.type) {
      case "action":
        return setStep({ ring: "outcome", actionType: pick.actionType });
      case "more":
        return setStep({ ring: "more" });
      case "back":
        return setStep({ ring: "action" });
      case "outcome":
        if (step.ring === "outcome") onSave(step.actionType, pick.outcome);
        return;
      case "move":
        return onMove?.();
      case "delete":
        return onDelete?.();
      case "minute":
        return setStep({
          ring: "minute",
          value: editing?.minute?.toString() ?? "",
        });
      case "digit":
        if (step.ring === "minute")
          setStep({ ...step, value: typeDigit(step.value, pick.digit) });
        return;
      case "erase":
        if (step.ring === "minute")
          setStep({ ...step, value: step.value.slice(0, -1) });
        return;
      case "done": {
        if (step.ring !== "minute") return;
        const { minute } = parseMinuteInput(step.value);
        // Out of range (e.g. 999): keep the dial open
        if (step.value !== "" && minute === undefined) return;
        return onMinute?.(minute);
      }
    }
  };

  const center = ((): RadialCenter => {
    switch (step.ring) {
      case "action": {
        if (!editing)
          return {
            ariaLabel: "Choose an action",
            content: <Center title="ACTION">what happened?</Center>,
          };
        const type = actionTypeInfo(editing.actionType);
        const outcome = outcomeInfo(editing.actionType, editing.outcome);
        return {
          ariaLabel: `Editing ${type.label}, ${outcome?.label ?? editing.outcome}`,
          content: (
            <Center title="EDIT">
              {type.short ?? type.label}
              <br />
              {outcome?.label ?? editing.outcome}
            </Center>
          ),
        };
      }
      case "more":
        return {
          ariaLabel: "More actions",
          content: <Center title="MORE">actions</Center>,
        };
      case "outcome": {
        const type = actionTypeInfo(step.actionType);
        return {
          ariaLabel: `Outcome of ${type.label}`,
          color: CATEGORY_RING_COLORS[type.category],
          content: (
            <Center
              title={(type.short ?? type.label).toUpperCase()}
              color={CATEGORY_RING_COLORS[type.category]}
            >
              outcome?
            </Center>
          ),
        };
      }
      case "minute":
        return {
          ariaLabel: "Clear the minute",
          onClick: () => setStep({ ...step, value: "" }),
          content: (
            <Center title={`${step.value || "–"}'`}>
              minute
              <br />
              <small className="text-blue-600">clear</small>
            </Center>
          ),
        };
    }
  })();

  return createPortal(
    <div className="fixed inset-0 z-50" data-testid="touch-radial">
      <RadialMenu<TouchItem>
        // A new ring for each step, so focus and the opening animation reset
        key={step.ring === "outcome" ? step.actionType : step.ring}
        anchor={anchor}
        sections={touchSections(step, editing)}
        center={center}
        onPick={handlePick}
        onClose={onClose}
        ariaLabel={
          step.ring === "outcome"
            ? "Action outcome"
            : step.ring === "minute"
              ? "Minute"
              : editing
                ? "Edit action"
                : "Record action"
        }
        insets={insets}
      />
    </div>,
    document.body,
  );
};

export default TouchRadial;
