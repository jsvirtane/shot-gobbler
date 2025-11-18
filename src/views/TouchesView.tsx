import React, { useCallback, useState } from "react";
import ActionForm from "../components/ActionForm/ActionForm";
import { ClearButton } from "../components/common";
import { TouchList } from "../components/TouchList/TouchList";
import TouchMap from "../components/TouchMap/TouchMap";
import ViewToggle from "../components/ViewToggle/ViewToggle";
import { useUrlState } from "../hooks/useUrlState";
import { Action } from "../types/Action";

type TouchesView = "pitch" | "list";

interface TouchesViewProps {
  actions: Action[];
  setActions: React.Dispatch<React.SetStateAction<Action[]>>;
}

const TouchesView: React.FC<TouchesViewProps> = ({ actions, setActions }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 });
  const [currentView, setCurrentView] = useUrlState<TouchesView>(
    "view",
    "pitch",
  );

  const handlePitchClick = (x: number, y: number) => {
    setCurrentPosition({ x, y });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleAddAction = (details: Omit<Action, "id" | "timestamp">) => {
    const newAction: Action = {
      ...details,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      timestamp: Date.now(),
    };

    setActions((prev) => [...prev, newAction]);
  };

  const handleRemoveAction = (id: string) => {
    setActions((prev) => prev.filter((action) => action.id !== id));
  };

  const handleClearAllActions = useCallback(() => {
    if (
      window.confirm(
        "Are you sure you want to clear all actions? This cannot be undone.",
      )
    ) {
      setActions([]);
    }
  }, [setActions]);

  const viewOptions = [
    { id: "pitch", label: "Pitch View", icon: "⚽️" },
    { id: "list", label: "List View", icon: "📋" },
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
          <TouchMap onPitchClick={handlePitchClick} actions={actions} />
        </>
      ) : (
        <div className="flex flex-col gap-4">
          <TouchList actions={actions} onRemoveAction={handleRemoveAction} />
          {actions.length > 0 && (
            <ClearButton onClick={handleClearAllActions}>Clear All</ClearButton>
          )}
        </div>
      )}

      <ActionForm
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleAddAction}
        initialCoords={currentPosition}
      />
    </>
  );
};

export default TouchesView;
