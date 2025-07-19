import React, { useCallback } from "react";
import { PassChain } from "../../types/PassChain";
import { formatPitchZoneCapitalized } from "../../utils/pitchZones";
import {
  ClearButton,
  ExportButton,
  ImportButton,
  RemoveItemButton,
} from "../common";

type PassChainsListViewProps = {
  passChains: PassChain[];
  onClearAllPassChains: () => void;
  onImportPassChains?: (passChains: PassChain[]) => void;
  onRemovePassChain?: (chainId: string) => void;
};

const PassChainsListView: React.FC<PassChainsListViewProps> = ({
  passChains,
  onClearAllPassChains,
  onImportPassChains = () => {},
  onRemovePassChain = () => {},
}) => {
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedPassChains = JSON.parse(e.target?.result as string);
        if (
          Array.isArray(importedPassChains) &&
          importedPassChains.length > 0
        ) {
          onImportPassChains(importedPassChains);
          console.log(`Imported ${importedPassChains.length} pass chains`);
        } else {
          alert("The imported file doesn't contain valid pass chain data.");
        }
      } catch (error) {
        console.error("Error parsing JSON:", error);
        alert(
          "Failed to parse the imported file. Please ensure it's valid JSON.",
        );
      }
      // Note: File input reset is handled by ImportButton component
    };
    reader.onerror = () => {
      alert("Error reading the file.");
    };
    reader.readAsText(file);
  };

  const handleExportJSON = useCallback(() => {
    if (passChains.length === 0) {
      alert("No pass chains to export");
      return;
    }

    const dataStr = JSON.stringify(passChains, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pass-chains-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [passChains]);

  const formatTerminationReason = (reason: string) => {
    return reason
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatActionType = (actionType: string) => {
    return actionType.charAt(0).toUpperCase() + actionType.slice(1);
  };

  const handleRemoveChain = (chainId: string) => {
    if (confirm("Are you sure you want to remove this pass chain?")) {
      onRemovePassChain(chainId);
    }
  };

  if (passChains.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 text-6xl">📋</div>
        <h2 className="mb-2 text-2xl font-bold text-gray-800">
          No Pass Chains Yet
        </h2>
        <p className="mb-4 text-gray-600">
          Start creating pass chains in the pitch view to see them here.
        </p>
        <div className="mt-4 flex flex-col items-center">
          <p className="mb-2 text-gray-600">
            Or import a previously saved pass chains list:
          </p>
          <ImportButton onImport={handleImport}>
            Import Pass Chains
          </ImportButton>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-gray-800">
          Pass Chains ({passChains.length})
        </h2>
        </div>
      {/* Pass chains list */}
      <div className="grid gap-4">
        {passChains.map((chain, index) => (
          <div
            key={chain.id}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Chain #{index + 1}
              </h3>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    chain.isCompleted
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {chain.isCompleted ? "Completed" : "In Progress"}
                </span>
                <RemoveItemButton
                  onClick={() => handleRemoveChain(chain.id)}
                  title="Remove this pass chain"
                />
              </div>
            </div>

            <div className="mb-3 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
              <div>
                <span className="font-medium text-gray-600">Actions:</span>
                <span className="ml-2">{chain.actions.length}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Termination:</span>
                <span className="ml-2">
                  {formatTerminationReason(chain.terminationReason)}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Zones:</span>
                <span className="ml-2">
                  {chain.zones
                    ? `${formatPitchZoneCapitalized(chain.zones.start)} → ${formatPitchZoneCapitalized(chain.zones.end)}`
                    : "N/A"}
                </span>
              </div>
            </div>

            {/* Actions sequence */}
            <div className="border-t border-gray-100 pt-3">
              <h4 className="mb-2 text-sm font-medium text-gray-600">
                Action Sequence:
              </h4>
              <div className="flex flex-wrap gap-2">
                {chain.actions.map((action, actionIndex) => (
                  <span
                    key={actionIndex}
                    className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-800"
                  >
                    {actionIndex + 1}. {formatActionType(action.actionType)}
                    <span className="ml-1 text-blue-600">
                      ({action.x.toFixed(0)}, {action.y.toFixed(0)})
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
        <div className="flex flex-col space-y-2">
          <ExportButton onClick={handleExportJSON}>
            Export Data as JSON
          </ExportButton>
          <ClearButton onClick={onClearAllPassChains}>
            Clear All Pass Chains
          </ClearButton>
        </div>
      </div>
  );
};

export default PassChainsListView;
