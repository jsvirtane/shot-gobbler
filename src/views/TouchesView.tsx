import React, { useCallback, useEffect, useState } from "react";
import ActionForm from "../components/ActionForm/ActionForm";
import { TouchList } from "../components/TouchList/TouchList";
import TouchMap from "../components/TouchMap/TouchMap";
import ViewToggle from "../components/ViewToggle/ViewToggle";
import { Action } from "../types/Action";

// Storage key for localStorage
const TOUCHES_STORAGE_KEY = "shot-gobbler-touches-data";

type TouchesView = "pitch" | "list";

const TouchesView: React.FC = () => {
  const [actions, setActions] = useState<Action[]>(() => {
    try {
      const savedActions = localStorage.getItem(TOUCHES_STORAGE_KEY);
      return savedActions ? JSON.parse(savedActions) : [];
    } catch (error) {
      console.error("Error loading touches from localStorage:", error);
      return [];
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 });
  const [currentView, setCurrentView] = useState<TouchesView>("pitch");

  // Save actions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(TOUCHES_STORAGE_KEY, JSON.stringify(actions));
    } catch (error) {
      console.error("Error saving touches to localStorage:", error);
    }
  }, [actions]);

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
  }, []);

  const handleImportActions = (importedActions: Action[]) => {
    if (importedActions.length > 0) {
      setActions((prev) => [...prev, ...importedActions]);
    }
  };

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
        <TouchList
          actions={actions}
          onClearAllActions={handleClearAllActions}
          onImportActions={handleImportActions}
          onRemoveAction={handleRemoveAction}
        />
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
