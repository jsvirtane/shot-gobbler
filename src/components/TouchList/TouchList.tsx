import { Action } from "../../types/Action";
import { isSuccessfulActionOutcome } from "../../utils/isSuccessfulActionOutcome";
import {
  ClearButton,
  ExportButton,
  ImportButton,
  RemoveItemButton,
} from "../common";

type TouchListProps = {
  actions: Action[];
  onClearAllActions: () => void;
  onImportActions?: (actions: Action[]) => void;
  onRemoveAction: (id: string) => void;
};

export const TouchList = ({
  actions,
  onClearAllActions,
  onImportActions = () => {},
  onRemoveAction,
}: TouchListProps) => {
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedActions = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedActions) && importedActions.length > 0) {
          onImportActions(importedActions);
          console.log(`Imported ${importedActions.length} actions`);
        } else {
          alert("The imported file doesn't contain valid action data.");
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

  // Export Data Function
  const handleExportData = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(actions, null, 2), // Pretty print JSON
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `touches_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    console.log("Exporting data...");
  };

  return (
    <>
      <h3 className="text-lg font-semibold">Actions List</h3>
      {actions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
          <p>No actions recorded yet.</p>
          <ImportButton onImport={handleImport}>Import Touch List</ImportButton>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <ul className="overflow-y-auto">
            {actions.map((action) => (
              <li
                key={action.id}
                className={`mb-2 border-l-3 p-3 ${action.category === "attacking" ? "border-l-attacking-500" : action.category === "defensive" ? "border-l-defensive-500" : "border-l-duel-500"}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-semibold uppercase">
                      {action.actionType}
                    </span>
                    <p
                      className={` ${isSuccessfulActionOutcome(action.outcome) ? "text-green-500" : "text-red-500"} text-base capitalize`}
                    >
                      {action.outcome}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">
                      Category: {action.category}
                    </p>
                  </div>

                  <RemoveItemButton
                    onClick={() => onRemoveAction(action.id)}
                    title="Remove this action"
                  />
                </div>
              </li>
            ))}
          </ul>
          <ExportButton onClick={handleExportData}>
            Export Data as JSON
          </ExportButton>
          <ClearButton onClick={onClearAllActions}>Clear All</ClearButton>
        </div>
      )}
    </>
  );
};
