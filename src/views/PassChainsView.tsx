import React, { useState } from "react";
import ViewToggle from "../components/ViewToggle/ViewToggle";

type PassChainsView = "pitch" | "list";

const PassChainsView: React.FC = () => {
  const [currentView, setCurrentView] = useState<PassChainsView>("pitch");

  const viewOptions = [
    { id: "pitch", label: "Pitch View", icon: "⚽️" },
    { id: "list", label: "List View", icon: "📋" },
  ];

  return (
    <>
      <ViewToggle
        currentView={currentView}
        options={viewOptions}
        onViewChange={(view) => setCurrentView(view as PassChainsView)}
        className="mb-4"
      />

      {currentView === "pitch" ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 text-6xl">🔗</div>
          <h2 className="mb-2 text-2xl font-bold text-gray-800">
            Pass Chains - Pitch View
          </h2>
          <p className="text-gray-600">
            Interactive pitch view for tracking pass sequences coming soon...
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 text-6xl">📋</div>
          <h2 className="mb-2 text-2xl font-bold text-gray-800">
            Pass Chains - List View
          </h2>
          <p className="text-gray-600">
            Detailed list view for pass chain analysis coming soon...
          </p>
        </div>
      )}
    </>
  );
};

export default PassChainsView;
