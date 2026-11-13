import React, { useState } from "react";
import { Match, MatchDetails } from "../../types/Match";
import {
  getCancelButtonStyle,
  getSubmitButtonStyle,
} from "../../utils/buttonStyles";
import { formatMatchTitle, todayIso } from "../../utils/matches";
import Modal from "../Modal";

export type MatchBarProps = {
  matches: Match[];
  currentMatch: Match;
  onSelect: (id: string) => void;
  onCreate: (details: MatchDetails) => void;
  onUpdate: (id: string, details: MatchDetails) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  /** Downloads the current match with all its data. */
  onExport: () => void;
};

type SheetMode =
  | { kind: "closed" }
  | { kind: "list" }
  | { kind: "create" }
  | { kind: "edit"; match: Match };

const inputClass =
  "w-full rounded-md border border-gray-300 p-2.5 text-base focus:border-blue-500 focus:outline-none";
const iconButtonClass =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30";

type MatchFormProps = {
  initial: MatchDetails;
  submitLabel: string;
  onSubmit: (details: MatchDetails) => void;
  onCancel: () => void;
};

const MatchForm: React.FC<MatchFormProps> = ({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}) => {
  const [details, setDetails] = useState<MatchDetails>(initial);
  const set =
    (field: keyof MatchDetails) =>
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setDetails((prev) => ({ ...prev, [field]: event.target.value }));

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(details);
      }}
      className="flex flex-col gap-3"
    >
      <label className="block">
        <span className="mb-1 block text-sm font-bold text-gray-600">
          Home team
        </span>
        <input
          className={inputClass}
          value={details.homeTeam}
          onChange={set("homeTeam")}
          placeholder="Home"
          autoComplete="off"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-bold text-gray-600">
          Away team
        </span>
        <input
          className={inputClass}
          value={details.awayTeam}
          onChange={set("awayTeam")}
          placeholder="Away"
          autoComplete="off"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-bold text-gray-600">Date</span>
        <input
          type="date"
          className={inputClass}
          value={details.date}
          onChange={set("date")}
          required
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-bold text-gray-600">
          Competition (optional)
        </span>
        <input
          className={inputClass}
          value={details.competition ?? ""}
          onChange={set("competition")}
          placeholder="e.g. League, Cup"
          autoComplete="off"
        />
      </label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <button type="submit" className={getSubmitButtonStyle()}>
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={getCancelButtonStyle()}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

/**
 * The current match at the top of each data tab. Tapping it opens a sheet
 * to switch, create, edit, duplicate, delete or export matches.
 */
const MatchBar: React.FC<MatchBarProps> = ({
  matches,
  currentMatch,
  onSelect,
  onCreate,
  onUpdate,
  onDuplicate,
  onDelete,
  onExport,
}) => {
  const [mode, setMode] = useState<SheetMode>({ kind: "closed" });
  const close = () => setMode({ kind: "closed" });
  const backToList = () => setMode({ kind: "list" });

  const title = formatMatchTitle(currentMatch);

  const sheetTitle =
    mode.kind === "create"
      ? "New match"
      : mode.kind === "edit"
        ? "Edit match"
        : "Matches";

  return (
    <div className="mb-3 flex h-10 shrink-0 items-center gap-2 pr-12">
      <button
        type="button"
        onClick={() => setMode({ kind: "list" })}
        aria-haspopup="dialog"
        aria-label={`Match: ${title}, ${currentMatch.date}. Change match`}
        className="flex h-full min-w-0 flex-1 items-center gap-1 rounded-md border border-gray-200 bg-white px-3 text-left text-sm shadow-sm hover:bg-gray-50"
      >
        <span className="truncate font-semibold text-gray-900">{title}</span>
        <span className="shrink-0 text-gray-500">· {currentMatch.date}</span>
        <span aria-hidden="true" className="ml-auto shrink-0 text-gray-400">
          ▾
        </span>
      </button>

      <Modal
        isOpen={mode.kind !== "closed"}
        title={sheetTitle}
        onClose={mode.kind === "list" ? close : backToList}
      >
        {mode.kind === "list" && (
          <div className="flex flex-col gap-4">
            <ul className="flex flex-col divide-y divide-gray-100 rounded-md border border-gray-200">
              {matches.map((match) => {
                const isCurrent = match.id === currentMatch.id;
                const matchTitle = formatMatchTitle(match);
                return (
                  <li key={match.id} className="flex items-center gap-1 p-1">
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(match.id);
                        close();
                      }}
                      aria-current={isCurrent ? "true" : undefined}
                      className={`min-w-0 flex-1 rounded-md px-2 py-1.5 text-left ${isCurrent ? "bg-blue-50" : "hover:bg-gray-50"}`}
                    >
                      <span className="block truncate font-semibold text-gray-900">
                        {isCurrent && (
                          <span aria-hidden="true" className="text-blue-600">
                            ✓{" "}
                          </span>
                        )}
                        {matchTitle}
                      </span>
                      <span className="block truncate text-xs text-gray-500">
                        {[match.date, match.competition]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </button>
                    <button
                      type="button"
                      className={iconButtonClass}
                      onClick={() => setMode({ kind: "edit", match })}
                      aria-label={`Edit ${matchTitle}`}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className={iconButtonClass}
                      onClick={() => {
                        onDuplicate(match.id);
                        close();
                      }}
                      aria-label={`Duplicate ${matchTitle}`}
                      title="Duplicate (details only)"
                    >
                      ⧉
                    </button>
                    <button
                      type="button"
                      className={iconButtonClass}
                      onClick={() => onDelete(match.id)}
                      disabled={matches.length <= 1}
                      aria-label={`Delete ${matchTitle}`}
                      title={
                        matches.length <= 1
                          ? "The last match can't be deleted"
                          : "Delete match and its data"
                      }
                    >
                      🗑️
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setMode({ kind: "create" })}
                className={getSubmitButtonStyle()}
              >
                + New match
              </button>
              <button
                type="button"
                onClick={() => {
                  onExport();
                  close();
                }}
                className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Export this match
              </button>
              <button
                type="button"
                onClick={close}
                className="py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Close
              </button>
            </div>
          </div>
        )}
        {mode.kind === "create" && (
          <MatchForm
            initial={{ homeTeam: "", awayTeam: "", date: todayIso() }}
            submitLabel="Create"
            onSubmit={(details) => {
              onCreate(details);
              close();
            }}
            onCancel={backToList}
          />
        )}
        {mode.kind === "edit" && (
          <MatchForm
            initial={{
              homeTeam: mode.match.homeTeam,
              awayTeam: mode.match.awayTeam,
              date: mode.match.date,
              competition: mode.match.competition,
            }}
            submitLabel="Save"
            onSubmit={(details) => {
              onUpdate(mode.match.id, details);
              backToList();
            }}
            onCancel={backToList}
          />
        )}
      </Modal>
    </div>
  );
};

export default MatchBar;
