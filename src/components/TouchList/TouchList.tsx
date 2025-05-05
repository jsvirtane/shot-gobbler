import { useRef } from "react";
import { Action } from "../../types/Action";
import { isSuccessfulActionOutcome } from "../../utils/isSuccessfulActionOutcome";

interface TouchListProps {
  actions: Action[];
  onClearAllActions: () => void;
  onImportActions?: (actions: Action[]) => void;
  onRemoveAction: (id: string) => void;
}

export const TouchList = ({
  actions,
  onClearAllActions,
  onImportActions = () => {},
  onRemoveAction,
}: TouchListProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.onerror = () => {
      alert("Error reading the file.");
    };
    reader.readAsText(file);
  };
  const triggerFileInput = () => {
    fileInputRef.current?.click();
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
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            ref={fileInputRef}
            className="hidden"
          />
          <button
            onClick={triggerFileInput}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Import Touch List
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <ul className="overflow-y-auto">
            {actions.map((action) => (
              <li
                key={action.id}
                className={`mb-2 border-l p-3 ${action.category === "attacking" ? "border-l-attacking-500" : action.category === "defensive" ? "border-l-defensive-500" : "border-l-duel-500"}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold">
                      {action.actionType.toUpperCase()}
                    </span>
                    <p
                      className={` ${isSuccessfulActionOutcome(action.outcome) ? "text-green-500" : "text-red-500"}`}
                    >
                      Outcome: {action.outcome}
                    </p>
                    <p className="text-sm text-gray-500">
                      Category: {action.category}
                    </p>
                  </div>

                  <button
                    onClick={() => onRemoveAction(action.id)}
                    className="h-5 w-5 items-center justify-center rounded bg-red-500 hover:bg-red-600"
                    title="Remove this action"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button
            onClick={handleExportData}
            className="rounded bg-neutral-900 px-4 py-2 text-nowrap text-white hover:bg-neutral-800"
          >
            Export Data as JSON
          </button>
          <button
            onClick={onClearAllActions}
            className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
          >
            Clear All
          </button>
        </div>
      )}
    </>
  );
};
