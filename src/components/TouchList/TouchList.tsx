import { Action } from "../../types/Action";
import { isSuccessfulActionOutcome } from "../../utils/isSuccessfulActionOutcome";
import { RemoveItemButton } from "../common";

type TouchListProps = {
  actions: Action[];
  onRemoveAction: (id: string) => void;
};

export const TouchList = ({ actions, onRemoveAction }: TouchListProps) => {
  return (
    <>
      <h3 className="text-lg font-semibold">Actions List</h3>
      {actions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
          <p>No actions recorded yet.</p>
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
        </div>
      )}
    </>
  );
};
