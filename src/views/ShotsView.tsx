import React, { useCallback, useEffect, useState } from "react";
import { Accordion } from "../components/Accordion";
import { ClearButton } from "../components/common";
import ShotCard from "../components/ShotCard";
import ShotList from "../components/ShotList/ShotList";
import ShotMap, { ScreenPoint } from "../components/ShotMap/ShotMap";
import ShotRadial from "../components/ShotRadial/ShotRadial";
import ShotStatsPanel from "../components/Stats/ShotStatsPanel";
import { ShotsSummaryBar } from "../components/Stats/SummaryBar";
import SegmentedControl, {
  SegmentedOption,
} from "../components/SegmentedControl";
import ViewToggle from "../components/ViewToggle/ViewToggle";
import {
  CardChipButton,
  HeaderSlot,
  ReviewCard,
} from "../components/ReviewLayout";
import { useTrackerControls } from "../components/FocusMode/trackerControls";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import { useUndoableList } from "../hooks/useUndoableList";
import { useUrlState } from "../hooks/useUrlState";
import { TEAM_MARKER_COLORS } from "../constants/markerColors";
import { Team } from "../types/common";
import { DEFAULT_MATCH_ID, EventStamp, TeamNames } from "../types/Match";
import { StorageCodec } from "../utils/dataSchema";
import { Shot, ShotResult } from "../types/Shot";
import { shotSummary } from "../utils/feedbackSummary";
import {
  PitchVariant,
  teamForPoint,
  toAttackingHalf,
} from "../utils/pitchView";
import {
  draftFromShot,
  draftToShotFields,
  newShotDraft,
  ShotDraft,
} from "../utils/shotDraft";
import {
  DEFAULT_TEAM_LABELS,
  getTeamOptions,
  TEAMS,
} from "../utils/teamLabels";

const DISPLAY_FILTERS = ["all", "home", "away"] as const;
type DisplayFilter = (typeof DISPLAY_FILTERS)[number];
const SHOTS_VIEWS = ["pitch", "list", "stats"] as const;
type ShotsView = (typeof SHOTS_VIEWS)[number];
const PITCH_VIEWS = ["full", "half"] as const;

export const HALF_TEAM_STORAGE_KEY = "shot-gobbler-half-team";

/** A stored team, or null for anything else (then "home" is used). */
const teamCodec: StorageCodec<Team> = {
  parse: (raw) => (raw === "home" || raw === "away" ? raw : null),
  stringify: (team) => team,
};
type PitchView = (typeof PITCH_VIEWS)[number];

/** The radial menu open for a new or an existing shot. */
type ShotRing = {
  /** Where it opens, in viewport px. */
  anchor: ScreenPoint;
  draft: ShotDraft;
  /** The shot being edited; null for a new one. */
  editing: Shot | null;
  /** Match fields of a new shot, taken at the tap. */
  stamp: EventStamp | null;
};

interface ShotsViewProps {
  shots: Shot[];
  setShots: React.Dispatch<React.SetStateAction<Shot[]>>;
  /** Names shown instead of Home / Away. */
  teamNames?: TeamNames;
  /** Match fields stamped on each new shot. */
  getEventStamp?: () => EventStamp;
  /** Focus mode: only the pitch, filling the screen. */
  focus?: boolean;
}

const defaultEventStamp = (): EventStamp => ({ matchId: DEFAULT_MATCH_ID });

const ShotsView: React.FC<ShotsViewProps> = ({
  shots,
  setShots,
  teamNames = DEFAULT_TEAM_LABELS,
  getEventStamp = defaultEventStamp,
  focus = false,
}) => {
  const [shotsView, setShotsView] = useUrlState<ShotsView>(
    "view",
    "pitch",
    SHOTS_VIEWS,
  );
  const [shotDisplayFilter, setShotDisplayFilter] = useUrlState<DisplayFilter>(
    "filter",
    "all",
    DISPLAY_FILTERS,
  );
  const [pitchView, setPitchView] = useUrlState<PitchView>(
    "pitch",
    "full",
    PITCH_VIEWS,
  );
  const variant: PitchVariant = pitchView;
  const isHalf = pitchView === "half";
  // Team of new shots in the half view, where both teams attack one goal;
  // remembered across reloads
  const [halfTeam, setHalfTeam] = useLocalStorageState<Team>(
    HALF_TEAM_STORAGE_KEY,
    "home",
    teamCodec,
  );
  const toggleHalfTeam = () =>
    setHalfTeam((team) => (team === "home" ? "away" : "home"));

  const [currentShotIndex, setCurrentShotIndex] = useState(0);

  const shotList = useUndoableList(shots, setShots, {
    one: "Shot",
    many: "shots",
  });

  const togglePitchView = () =>
    setPitchView(pitchView === "full" ? "half" : "full");
  useTrackerControls({
    undo: shotList.undoLast,
    canUndo: shotList.canUndo,
    pitch: { half: isHalf, toggle: togglePitchView },
    team: {
      name: teamNames[halfTeam],
      color: TEAM_MARKER_COLORS[halfTeam],
      toggle: toggleHalfTeam,
    },
  });

  // The open radial menu, if any
  const [ring, setRing] = useState<ShotRing | null>(null);
  // Shot whose Move was picked: the next pitch tap moves it
  const [movingId, setMovingId] = useState<string | null>(null);
  const movingShot = shots.find((s) => s.id === movingId) ?? null;

  // Shot filtering
  const filteredShots = shots.filter((shot) => {
    if (shotDisplayFilter === "all") return true;
    return shot.team === shotDisplayFilter;
  });

  // A tap on the pitch: a new shot, or the new spot of the shot being moved
  const handlePitchClick = (x: number, y: number, screen?: ScreenPoint) => {
    if (movingShot) {
      const to = toAttackingHalf({ x, y }, movingShot.team);
      shotList.update(movingShot.id, to, "Shot moved");
      setMovingId(null);
      return;
    }
    // On the full pitch the team attacking the half tapped, on the half
    // pitch the bar's team; the centre of the ring switches it
    const team = isHalf ? halfTeam : teamForPoint({ x, y });
    // The shot happened at the tap, so take the match minute now
    const stamp = getEventStamp();
    setRing({
      anchor: screen ?? { x: 0, y: 0 },
      draft: newShotDraft({ x, y }, team, stamp.minute),
      editing: null,
      stamp,
    });
  };

  // Tapping a marker opens the same ring with its values and Edit options
  const handleShotClick = (shot: Shot, screen?: ScreenPoint) => {
    setMovingId(null);
    setRing({
      anchor: screen ?? { x: 0, y: 0 },
      draft: draftFromShot(shot),
      editing: shot,
      stamp: null,
    });
  };

  const handleShotMove = (id: string, x: number, y: number) => {
    shotList.update(id, { x, y }, "Shot moved");
  };

  const handleSave = (result: ShotResult) => {
    if (!ring) return;
    const fields = draftToShotFields(ring.draft, result);
    const summarise = (shot: Shot) => shotSummary(shot, teamNames);
    if (ring.editing) {
      // Keeps the shot's id, match and period
      shotList.update(ring.editing.id, fields, undefined, summarise);
    } else {
      const shot: Shot = {
        ...(ring.stamp ?? getEventStamp()),
        ...fields,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        timestamp: Date.now(),
      };
      shotList.add(shot, summarise(shot));
    }
    setRing(null);
  };

  const handleRingMove = () => {
    if (ring?.editing) setMovingId(ring.editing.id);
    setRing(null);
  };

  const handleRingDelete = () => {
    if (ring?.editing) shotList.remove(ring.editing.id);
    setRing(null);
  };

  const handleRemoveShot = shotList.remove;
  const handleClearAllShots = shotList.clearAll;

  // Shot navigation handlers
  const handleNextShot = useCallback(() => {
    setCurrentShotIndex((prev) => (prev + 1) % filteredShots.length);
  }, [filteredShots.length]);

  const handlePreviousShot = useCallback(() => {
    setCurrentShotIndex((prev) =>
      prev === 0 ? filteredShots.length - 1 : prev - 1,
    );
  }, [filteredShots.length]);

  // Reset current shot index when filter changes
  useEffect(() => {
    setCurrentShotIndex(0);
  }, [shotDisplayFilter]);

  // Ensure currentShotIndex is within bounds
  const safeCurrentShotIndex = Math.min(
    currentShotIndex,
    Math.max(0, filteredShots.length - 1),
  );

  // UI components
  const filterOptions: SegmentedOption<DisplayFilter>[] = [
    { value: "all", label: "All" },
    // The match's team names (or Home / Away)
    ...getTeamOptions(teamNames).map(({ value, label }) => ({
      value,
      label,
    })),
  ];
  const filterChips = (
    <SegmentedControl
      variant="chips"
      ariaLabel="Show shots"
      options={filterOptions}
      value={shotDisplayFilter}
      onChange={setShotDisplayFilter}
    />
  );

  const viewOptions = [
    { id: "pitch", label: "Pitch" },
    { id: "list", label: "List" },
    { id: "stats", label: "Stats" },
  ];

  // Teams shown by the filter
  const shownTeams = shotDisplayFilter === "all" ? TEAMS : [shotDisplayFilter];

  const shotMapProps = {
    onPitchClick: handlePitchClick,
    // Focus mode has no team filter, so it shows every shot
    shots: focus ? shots : filteredShots,
    variant,
    pulse: shotList.pulse,
    onShotClick: handleShotClick,
    onShotMove: handleShotMove,
    teamLabels: teamNames,
    hint: movingShot
      ? "Tap the new spot for the shot"
      : shots.length === 0 && !ring && "Tap where the shot was taken",
    pending:
      ring && !ring.editing
        ? { x: ring.draft.x, y: ring.draft.y, team: ring.draft.team }
        : undefined,
  } as const;

  // Both teams attack the goal at the bottom; new shots are the bar's team
  const halfEndLabels = { bottom: `Goal ↓ · ${teamNames[halfTeam]}` };

  const radial = ring && (
    <ShotRadial
      anchor={ring.anchor}
      draft={ring.draft}
      onDraftChange={(draft) => setRing({ ...ring, draft })}
      editing={ring.editing}
      teamNames={teamNames}
      onSave={handleSave}
      onMove={handleRingMove}
      onDelete={handleRingDelete}
      onClose={() => setRing(null)}
      // Clear of the focus bar or the tab bar (toasts hide meanwhile)
      insets={{ top: 8, bottom: focus ? 84 : 68 }}
    />
  );

  if (focus) {
    return (
      <>
        <ShotMap
          {...shotMapProps}
          focus
          // In half view both teams attack the top goal, so no team ends
          endLabels={
            isHalf
              ? halfEndLabels
              : {
                  top: `${teamNames.home} ↑`,
                  bottom: `${teamNames.away} ↓`,
                }
          }
        />
        {radial}
      </>
    );
  }

  const isPitch = shotsView === "pitch";

  return (
    <>
      <HeaderSlot>
        <ViewToggle
          currentView={shotsView}
          options={viewOptions}
          onViewChange={(view) => setShotsView(view as ShotsView)}
        />
      </HeaderSlot>
      <ReviewCard
        toolbar={filterChips}
        toolbarEnd={
          isPitch && (
            <>
              {/* In half view both teams attack the goal at the bottom, so
                  new shots take this team */}
              {isHalf && (
                <CardChipButton
                  onClick={toggleHalfTeam}
                  aria-label={`Team for new shots: ${teamNames[halfTeam]}. Switch team`}
                >
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: TEAM_MARKER_COLORS[halfTeam] }}
                  />
                  <span className="truncate">{teamNames[halfTeam]}</span>
                </CardChipButton>
              )}
              <CardChipButton
                onClick={togglePitchView}
                aria-label={isHalf ? "Full pitch" : "Half pitch"}
              >
                {isHalf ? "Full" : "Half"}
              </CardChipButton>
            </>
          )
        }
        footer={
          <ShotsSummaryBar
            shots={filteredShots}
            teamNames={teamNames}
            teams={shownTeams}
          />
        }
      >
        {isPitch && (
          <ShotMap
            {...shotMapProps}
            // The team attacking each goal; in half view the team of new
            // shots instead
            endLabels={
              isHalf
                ? halfEndLabels
                : { top: teamNames.home, bottom: teamNames.away }
            }
            endLabelsInShare={!isHalf}
          />
        )}
      </ReviewCard>

      {isPitch ? null : shotsView === "stats" ? (
        <ShotStatsPanel
          shots={filteredShots}
          teamNames={teamNames}
          teams={shownTeams}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {filteredShots.length > 0 && (
            <Accordion
              header={<h3 className="text-lg font-semibold">Shot details</h3>}
              defaultOpen={true}
            >
              <ShotCard
                shot={filteredShots[safeCurrentShotIndex]}
                currentIndex={safeCurrentShotIndex}
                totalShots={filteredShots.length}
                onNext={handleNextShot}
                onPrevious={handlePreviousShot}
              />
            </Accordion>
          )}
          <Accordion
            header={
              <h3 className="text-lg font-semibold">
                Recorded Shots ({filteredShots.length})
              </h3>
            }
          >
            <ShotList shots={filteredShots} onRemoveShot={handleRemoveShot} />
          </Accordion>
          {filteredShots.length > 0 && shotDisplayFilter === "all" && (
            <ClearButton onClick={handleClearAllShots}>
              Clear All Shots
            </ClearButton>
          )}
        </div>
      )}
      {radial}
    </>
  );
};

export default ShotsView;
