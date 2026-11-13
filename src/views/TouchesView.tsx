import React, { useState } from "react";
import ActionForm from "../components/ActionForm/ActionForm";
import { ClearButton } from "../components/common";
import TouchStatsPanel from "../components/Stats/TouchStatsPanel";
import { TouchesSummaryBar } from "../components/Stats/SummaryBar";
import { TouchList } from "../components/TouchList/TouchList";
import TouchMap from "../components/TouchMap/TouchMap";
import ViewToggle from "../components/ViewToggle/ViewToggle";
import { useUndoableList } from "../hooks/useUndoableList";
import { useUrlState } from "../hooks/useUrlState";
import { Action } from "../types/Action";
import { DEFAULT_MATCH_ID, EventStamp } from "../types/Match";

const TOUCHES_VIEWS = ["pitch", "list", "stats"] as const;
type TouchesView = (typeof TOUCHES_VIEWS)[number];

interface TouchesViewProps {
  actions: Action[];
  setActions: React.Dispatch<React.SetStateAction<Action[]>>;
  /** Match fields stamped on each new action. */
  getEventStamp?: () => EventStamp;
}

const defaultEventStamp = (): EventStamp => ({ matchId: DEFAULT_MATCH_ID });

const TouchesView: React.FC<TouchesViewProps> = ({
  actions,
  setActions,
  getEventStamp = defaultEventStamp,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // The action open in the form for editing; null when adding a new one
  const [editingAction, setEditingAction] = useState<Action | null>(null);
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 });
  // Match minute and period taken when the pitch is tapped
  const [pendingStamp, setPendingStamp] = useState<EventStamp | null>(null);
  const [currentView, setCurrentView] = useUrlState<TouchesView>(
    "view",
    "pitch",
    TOUCHES_VIEWS,
  );
  const actionList = useUndoableList(actions, setActions, {
    one: "Action",
    many: "actions",
  });

  const handlePitchClick = (x: number, y: number) => {
    setCurrentPosition({ x, y });
    setPendingStamp(getEventStamp());
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAction(null);
  };

  const handleActionClick = (action: Action) => {
    setEditingAction(action);
    setCurrentPosition({ x: action.x, y: action.y });
    setIsModalOpen(true);
  };

  const handleActionMove = (id: string, x: number, y: number) => {
    actionList.update(id, { x, y }, "Action moved");
  };

  const handleFormSubmit = (details: Omit<Action, "id" | "timestamp">) => {
    if (editingAction) {
      actionList.update(editingAction.id, details);
    } else {
      handleAddAction(details);
    }
  };

  const handleDeleteEditingAction = () => {
    if (editingAction) actionList.remove(editingAction.id);
    handleCloseModal();
  };

  const handleAddAction = (details: Omit<Action, "id" | "timestamp">) => {
    const newAction: Action = {
      ...(pendingStamp ?? getEventStamp()),
      ...details,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      timestamp: Date.now(),
    };

    actionList.add(newAction);
  };

  const handleRemoveAction = actionList.remove;
  const handleClearAllActions = actionList.clearAll;

  const viewOptions = [
    { id: "pitch", label: "Pitch View", icon: "⚽️" },
    { id: "list", label: "List View", icon: "📋" },
    { id: "stats", label: "Stats", icon: "📊" },
  ];

  return (
    <>
      <ViewToggle
        currentView={currentView}
        options={viewOptions}
        onViewChange={(view) => setCurrentView(view as TouchesView)}
        className="mb-4"
      />

      {currentView === "pitch" ? (
        <>
          <p className="mb-4 text-sm text-gray-600">
            Click on the pitch to record player's actions during the match.
          </p>
          <TouchMap
            onPitchClick={handlePitchClick}
            actions={actions}
            onActionClick={handleActionClick}
            onActionMove={handleActionMove}
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

      <ActionForm
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        initialCoords={currentPosition}
        action={editingAction ?? undefined}
        onDelete={handleDeleteEditingAction}
        defaultMinute={
          editingAction ? editingAction.minute : pendingStamp?.minute
        }
      />
    </>
  );
};

export default TouchesView;
