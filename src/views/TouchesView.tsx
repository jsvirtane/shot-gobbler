import React, { useEffect, useRef, useState } from "react";
import { ClearButton } from "../components/common";
import TouchStatsPanel from "../components/Stats/TouchStatsPanel";
import { TouchesSummaryBar } from "../components/Stats/SummaryBar";
import { TouchList } from "../components/TouchList/TouchList";
import TouchMap from "../components/TouchMap/TouchMap";
import TouchRadial from "../components/TouchMap/TouchRadial";
import { Point } from "../components/RadialMenu";
import { actionTypeInfo } from "../constants/actionTypes";
import ViewToggle from "../components/ViewToggle/ViewToggle";
import { useTrackerControls } from "../components/FocusMode/trackerControls";
import { useUndoableList } from "../hooks/useUndoableList";
import { useUrlState } from "../hooks/useUrlState";
import { Action, ActionOutcome, ActionType } from "../types/Action";
import { DEFAULT_MATCH_ID, EventStamp } from "../types/Match";
import { actionSummary } from "../utils/feedbackSummary";

const TOUCHES_VIEWS = ["pitch", "list", "stats"] as const;
type TouchesView = (typeof TOUCHES_VIEWS)[number];

interface TouchesViewProps {
  actions: Action[];
  setActions: React.Dispatch<React.SetStateAction<Action[]>>;
  /** Match fields stamped on each new action. */
  getEventStamp?: () => EventStamp;
  /** Focus mode: only the pitch, filling the screen. */
  focus?: boolean;
}

const defaultEventStamp = (): EventStamp => ({ matchId: DEFAULT_MATCH_ID });

const TouchesView: React.FC<TouchesViewProps> = ({
  actions,
  setActions,
  getEventStamp = defaultEventStamp,
  focus = false,
}) => {
  // The open radial menu: where it points and the action it edits (if any)
  const [radial, setRadial] = useState<{
    anchor: Point;
    /** Full-pitch % position of a new action. */
    at: { x: number; y: number };
    editing?: Action;
  } | null>(null);
  // Match minute and period taken when the pitch is tapped
  const [pendingStamp, setPendingStamp] = useState<EventStamp | null>(null);
  // An action waiting for the pitch tap that moves it
  const [moving, setMoving] = useState<Action | null>(null);
  const pitchRef = useRef<HTMLDivElement>(null);
  const [currentView, setCurrentView] = useUrlState<TouchesView>(
    "view",
    "pitch",
    TOUCHES_VIEWS,
  );
  const actionList = useUndoableList(actions, setActions, {
    one: "Action",
    many: "actions",
  });

  useTrackerControls({
    undo: actionList.undoLast,
    canUndo: actionList.canUndo,
  });

  // Esc cancels a pending move
  useEffect(() => {
    if (!moving) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoving(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [moving]);

  /** Viewport px of a full-pitch % point, where the ring opens. */
  const anchorAt = (x: number, y: number): Point => {
    const rect = pitchRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: rect.left + (x / 100) * rect.width,
      y: rect.top + (y / 100) * rect.height,
    };
  };

  const handlePitchClick = (x: number, y: number) => {
    if (moving) {
      actionList.update(moving.id, { x, y }, "Action moved");
      setMoving(null);
      return;
    }
    setPendingStamp(getEventStamp());
    setRadial({ anchor: anchorAt(x, y), at: { x, y } });
  };

  const handleActionClick = (action: Action) => {
    setMoving(null);
    setRadial({
      anchor: anchorAt(action.x, action.y),
      at: { x: action.x, y: action.y },
      editing: action,
    });
  };

  const handleActionMove = (id: string, x: number, y: number) => {
    actionList.update(id, { x, y }, "Action moved");
  };

  const closeRadial = () => setRadial(null);

  const handleSave = (actionType: ActionType, outcome: ActionOutcome) => {
    if (!radial) return;
    const { category } = actionTypeInfo(actionType);
    if (radial.editing) {
      actionList.update(
        radial.editing.id,
        { category, actionType, outcome },
        undefined,
        actionSummary,
      );
    } else {
      const action: Action = {
        ...(pendingStamp ?? getEventStamp()),
        ...radial.at,
        category,
        actionType,
        outcome,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        timestamp: Date.now(),
      };
      actionList.add(action, actionSummary(action));
    }
    closeRadial();
  };

  const editing = radial?.editing;

  const handleRemoveAction = actionList.remove;
  const handleClearAllActions = actionList.clearAll;

  const viewOptions = [
    { id: "pitch", label: "Pitch View", icon: "⚽️" },
    { id: "list", label: "List View", icon: "📋" },
    { id: "stats", label: "Stats", icon: "📊" },
  ];

  return (
    <>
      {!focus && (
        <ViewToggle
          currentView={currentView}
          options={viewOptions}
          onViewChange={(view) => setCurrentView(view as TouchesView)}
          className="mb-4"
        />
      )}

      {focus || currentView === "pitch" ? (
        <>
          <TouchMap
            focus={focus}
            onPitchClick={handlePitchClick}
            actions={actions}
            pulse={actionList.pulse}
            onActionClick={handleActionClick}
            onActionMove={handleActionMove}
            pitchRef={pitchRef}
            hint={
              moving
                ? "Tap the new spot for the action"
                : actions.length === 0 && "Tap where the player made an action"
            }
          />
        </>
      ) : currentView === "stats" ? (
        <>
          <TouchesSummaryBar actions={actions} />
          <TouchStatsPanel actions={actions} />
        </>
      ) : (
        <div className="flex flex-col gap-4">
          <TouchesSummaryBar actions={actions} />
          <TouchList actions={actions} onRemoveAction={handleRemoveAction} />
          {actions.length > 0 && (
            <ClearButton onClick={handleClearAllActions}>Clear All</ClearButton>
          )}
        </div>
      )}

      {radial && (
        <TouchRadial
          anchor={radial.anchor}
          editing={editing}
          // Clear of the focus bar or the tab bar (toasts hide meanwhile)
          insets={{ top: 8, bottom: focus ? 80 : 64 }}
          onSave={handleSave}
          onMove={() => {
            setMoving(editing ?? null);
            closeRadial();
          }}
          onMinute={(minute) => {
            if (editing) {
              actionList.update(editing.id, { minute }, "Minute changed");
            }
            closeRadial();
          }}
          onDelete={() => {
            if (editing) actionList.remove(editing.id);
            closeRadial();
          }}
          onClose={closeRadial}
        />
      )}
    </>
  );
};

export default TouchesView;
