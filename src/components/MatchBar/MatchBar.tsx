import React, { useState } from "react";
import { useNow } from "../../hooks/useNow";
import { Match, MatchClock, MatchDetails } from "../../types/Match";
import { DEFAULT_PITCH_TYPE, PITCH_TYPES, PitchType } from "../../types/Pitch";
import {
  getCancelButtonStyle,
  getSubmitButtonStyle,
} from "../../utils/buttonStyles";
import {
  adjustClock,
  formatClock,
  nextPeriod,
  nextPeriodOf,
  PERIOD_LABELS,
  toggleClock,
} from "../../utils/matchClock";
import { formatMatchTitle, getPitchType, todayIso } from "../../utils/matches";
import { PITCH_SPECS } from "../../utils/pitchSpecs";
import Modal from "../Modal";
import SegmentedControl from "../SegmentedControl";

const PITCH_TYPE_OPTIONS = PITCH_TYPES.map((value) => ({
  value,
  label: PITCH_SPECS[value].label,
}));

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
  /**
   * Changes the current match's clock; returning undefined resets it. The
   * change gets the clock (a new one on first use) and the current time.
   */
  onClockChange: (
    change: (clock: MatchClock, now: number) => MatchClock | undefined,
  ) => void;
  /** Enters focus mode (full-screen pitch); no button without it. */
  onTrack?: () => void;
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
      <div>
        <span className="mb-1 block text-sm font-bold text-gray-600">
          Pitch
        </span>
        <SegmentedControl<PitchType>
          options={PITCH_TYPE_OPTIONS}
          value={details.pitchType ?? DEFAULT_PITCH_TYPE}
          onChange={(pitchType) =>
            setDetails((prev) => ({ ...prev, pitchType }))
          }
          ariaLabel="Pitch"
          variant="joined"
          size="sm"
        />
      </div>
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
  onClockChange,
  onTrack,
}) => {
  const [mode, setMode] = useState<SheetMode>({ kind: "closed" });
  const clock = currentMatch.clock;
  const running = clock?.running ?? false;
  const now = useNow(running);
  const clockText = formatClock(clock, now, getPitchType(currentMatch));
  const upcomingPeriod = nextPeriodOf(clock?.period ?? "1H");
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
    <div className="flex h-10 min-w-0 items-center gap-2">
      <button
        type="button"
        onClick={() => setMode({ kind: "list" })}
        aria-haspopup="dialog"
        aria-label={`Match: ${title} · ${currentMatch.date}. Change match`}
        className="-ml-1.5 flex h-full min-w-0 flex-1 items-center gap-1 rounded-lg px-1.5 text-left hover:bg-gray-100"
      >
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm font-semibold text-gray-900">
            {title}
          </span>
          <span className="truncate text-xs text-gray-500">
            {currentMatch.date}
          </span>
        </span>
        <span
          aria-hidden="true"
          className="shrink-0 self-start pt-0.5 text-xs text-gray-400"
        >
          ▾
        </span>
      </button>
      <div className="flex h-8 shrink-0 items-center rounded-full bg-gray-100">
        <button
          type="button"
          onClick={() => onClockChange(toggleClock)}
          disabled={clock?.period === "PEN"}
          aria-label={running ? "Pause clock" : "Start clock"}
          className="flex h-full w-8 items-center justify-center rounded-l-full text-xs text-gray-700 hover:bg-gray-200 disabled:opacity-30"
        >
          {running ? "❚❚" : "▶"}
        </button>
        <button
          type="button"
          onClick={() => setMode({ kind: "list" })}
          aria-label={`Match clock ${clockText}. Clock settings`}
          className={`h-full rounded-r-full pr-3 pl-0.5 text-sm font-semibold tabular-nums hover:bg-gray-200 ${running ? "text-green-700" : "text-gray-700"}`}
          data-testid="match-clock"
        >
          {clockText}
        </button>
      </div>
      {onTrack && (
        <button
          type="button"
          onClick={onTrack}
          aria-label="Track: full-screen pitch"
          title="Full-screen pitch for tracking"
          className="flex h-9 shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <span aria-hidden="true">⤢</span>
          Track
        </button>
      )}

      <Modal
        isOpen={mode.kind !== "closed"}
        title={sheetTitle}
        onClose={mode.kind === "list" ? close : backToList}
      >
        {mode.kind === "list" && (
          <div className="flex flex-col gap-4">
            <section
              aria-label="Match clock"
              className="rounded-md border border-gray-200 p-3"
            >
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-semibold tabular-nums">
                  {clockText}
                </span>
                <span className="text-sm text-gray-500">
                  {PERIOD_LABELS[clock?.period ?? "1H"]}
                  {running ? " · running" : clock ? " · paused" : ""}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-2 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() =>
                    onClockChange((c, at) => adjustClock(c, -1, at))
                  }
                  disabled={!clock || clock.period === "PEN"}
                  className="rounded-md border border-gray-300 py-2 hover:bg-gray-50 disabled:opacity-30"
                  aria-label="One minute back"
                >
                  −1′
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onClockChange((c, at) => adjustClock(c, 1, at))
                  }
                  disabled={clock?.period === "PEN"}
                  className="rounded-md border border-gray-300 py-2 hover:bg-gray-50 disabled:opacity-30"
                  aria-label="One minute forward"
                >
                  +1′
                </button>
                <button
                  type="button"
                  onClick={() => onClockChange((c) => nextPeriod(c))}
                  disabled={!upcomingPeriod}
                  className="col-span-2 rounded-md border border-gray-300 py-2 hover:bg-gray-50 disabled:opacity-30"
                >
                  {upcomingPeriod ? `Next: ${upcomingPeriod}` : "Last period"}
                </button>
              </div>
              {clock && (
                <button
                  type="button"
                  onClick={() => onClockChange(() => undefined)}
                  className="mt-2 text-xs font-medium text-gray-500 underline underline-offset-2 hover:text-gray-800"
                >
                  Reset clock
                </button>
              )}
            </section>
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
                        {[
                          match.date,
                          match.competition,
                          match.pitchType && PITCH_SPECS[match.pitchType].label,
                        ]
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
              pitchType: mode.match.pitchType,
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
