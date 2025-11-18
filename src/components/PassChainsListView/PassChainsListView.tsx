import React from "react";
import { PassChain } from "../../types/PassChain";
import { formatPitchZoneCapitalized } from "../../utils/pitchZones";
import { RemoveItemButton } from "../common";

type PassChainsListViewProps = {
  passChains: PassChain[];
  onRemovePassChain?: (chainId: string) => void;
};

const PassChainsListView: React.FC<PassChainsListViewProps> = ({
  passChains,
  onRemovePassChain = () => {},
}) => {
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
    </div>
  );
};

export default PassChainsListView;
