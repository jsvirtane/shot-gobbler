import React, { useState } from "react";
import { TEAM_MARKER_COLORS } from "../../constants/markerColors";
import { TeamNames } from "../../types/Match";
import { Shot, ShotResult } from "../../types/Shot";
import { getShotResult, SHOT_RESULT_FILLS } from "../../utils/shotResult";
import {
  dialAppend,
  DIAL_MAX_DIGITS,
  ShotDraft,
  shirtLabel,
  switchDraftTeam,
  toggleHead,
  togglePenalty,
  toggleSetPiece,
} from "../../utils/shotDraft";
import { shortTeamName } from "../../utils/teamLabels";
import RadialMenu, {
  Insets,
  Point,
  RadialCenter,
  RadialIcon,
  RadialIconName,
  RadialItem,
  RadialSection,
} from "../RadialMenu";

const RESULTS: { result: ShotResult; icon: RadialIconName }[] = [
  { result: "Goal", icon: "star" },
  { result: "Saved", icon: "disc" },
  { result: "Blocked", icon: "triangle" },
  { result: "Miss", icon: "ring" },
];

const SHOT_TYPE_SHORT = {
  "Open Play": "Open",
  "Set Piece": "Set pc",
  Penalty: "Pen",
} as const;

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

type Dial = { kind: keyof typeof DIAL_MAX_DIGITS; value: string };

interface ShotRadialProps {
  /** Tap point in viewport px. */
  anchor: Point;
  draft: ShotDraft;
  onDraftChange: (draft: ShotDraft) => void;
  /** The shot being edited; null when recording a new one. */
  editing: Shot | null;
  teamNames: TeamNames;
  /** A result was picked: save the draft with it. */
  onSave: (result: ShotResult) => void;
  /** Edit: the next pitch tap moves the shot. */
  onMove: () => void;
  /** Edit: delete the shot. */
  onDelete: () => void;
  onClose: () => void;
  /** Space kept clear, e.g. for the focus bar. */
  insets?: Partial<Insets>;
}

/**
 * The radial menu for recording or editing a shot: Result saves, Details
 * toggles keep the ring open, the centre switches the team, and the shirt
 * number and minute are entered on a dial ring.
 */
const ShotRadial: React.FC<ShotRadialProps> = ({
  anchor,
  draft,
  onDraftChange,
  editing,
  teamNames,
  onSave,
  onMove,
  onDelete,
  onClose,
  insets,
}) => {
  const [dial, setDial] = useState<Dial | null>(null);

  const overlay = (menu: React.ReactNode) => (
    <div className="fixed inset-0 z-50" data-testid="shot-radial">
      {menu}
    </div>
  );

  if (dial) {
    const isShirt = dial.kind === "shirt";
    const finish = (value: string) => {
      if (isShirt) {
        onDraftChange({ ...draft, playerName: value || undefined });
      } else {
        onDraftChange({ ...draft, minute: value ? Number(value) : undefined });
      }
      setDial(null);
    };
    const sections: RadialSection[] = [
      {
        items: DIGITS.map((d) => ({ id: d, label: d, kind: "nav" as const })),
      },
      {
        items: [
          {
            id: "del",
            label: "Del",
            ariaLabel: "Delete digit",
            icon: "back",
            kind: "danger",
          },
          { id: "done", label: "Done", icon: "check" },
        ],
      },
    ];
    const center: RadialCenter = {
      ariaLabel: isShirt ? "Clear shirt number" : "Clear minute",
      onClick: () => finish(""),
      content: (
        <>
          <span className="text-lg leading-none font-bold text-gray-900">
            {isShirt ? `#${dial.value || "–"}` : `${dial.value || "–"}'`}
          </span>
          <span className="text-gray-600">
            {isShirt ? "shirt no." : "minute"}
          </span>
          <span className="text-[10px] text-gray-500">clear</span>
        </>
      ),
    };
    return overlay(
      <RadialMenu
        anchor={anchor}
        sections={sections}
        center={center}
        ariaLabel={isShirt ? "Shirt number" : "Minute"}
        insets={insets}
        onClose={() => setDial(null)}
        onPick={(item) => {
          if (item.id === "done") return finish(dial.value);
          const value =
            item.id === "del"
              ? dial.value.slice(0, -1)
              : dialAppend(dial.value, item.id, DIAL_MAX_DIGITS[dial.kind]);
          setDial({ ...dial, value });
        }}
      />,
    );
  }

  const currentResult = editing ? getShotResult(editing) : null;
  const resultSection: RadialSection = {
    label: "Result",
    items: RESULTS.map(({ result, icon }) => ({
      id: `result:${result}`,
      label: result,
      icon,
      color: SHOT_RESULT_FILLS[result],
      current: result === currentResult,
    })),
  };
  const detailsSection: RadialSection = {
    label: "Details",
    items: [
      {
        id: "head",
        label: "Head",
        ariaLabel: "Header",
        kind: "toggle",
        on: draft.bodyPart === "Head",
      },
      {
        id: "set",
        label: "Set piece",
        kind: "toggle",
        on: draft.shotType === "Set Piece",
      },
      {
        id: "pen",
        label: "Penalty",
        kind: "toggle",
        on: draft.shotType === "Penalty",
      },
      {
        id: "shirt",
        label: shirtLabel(draft.playerName),
        ariaLabel: draft.playerName
          ? `Shirt number ${draft.playerName}`
          : "Shirt number",
        kind: "nav",
      },
    ],
  };
  const editSection: RadialSection = {
    label: "Edit",
    items: [
      { id: "move", label: "Move", icon: "move", kind: "nav" },
      {
        id: "minute",
        label: draft.minute !== undefined ? `${draft.minute}'` : "Minute",
        ariaLabel:
          draft.minute !== undefined ? `Minute ${draft.minute}` : "Minute",
        kind: "nav",
      },
      { id: "delete", label: "Delete", icon: "trash", kind: "danger" },
    ],
  };
  // Result at the top, Details at the bottom; Edit on the right between them
  const sections = editing
    ? [resultSection, editSection, detailsSection]
    : [resultSection, detailsSection];

  const teamName = teamNames[draft.team];
  const center: RadialCenter = {
    ariaLabel: `Team ${teamName}. Tap to switch team`,
    color: TEAM_MARKER_COLORS[draft.team],
    onClick: () => onDraftChange(switchDraftTeam(draft)),
    content: (
      <>
        <span
          className="max-w-full truncate text-lg leading-none font-bold"
          style={{ color: TEAM_MARKER_COLORS[draft.team] }}
        >
          {shortTeamName(teamName)}
        </span>
        <span className="mt-0.5 text-gray-600">
          {draft.bodyPart} · {SHOT_TYPE_SHORT[draft.shotType]}
        </span>
        <span className="mt-0.5 flex items-center gap-0.5 text-[10px] text-gray-500">
          <RadialIcon name="swap" size={11} />
          switch
        </span>
      </>
    ),
  };

  const handlePick = (item: RadialItem) => {
    if (item.id.startsWith("result:")) {
      onSave(item.id.slice("result:".length) as ShotResult);
      return;
    }
    switch (item.id) {
      case "head":
        return onDraftChange(toggleHead(draft));
      case "set":
        return onDraftChange(toggleSetPiece(draft));
      case "pen":
        return onDraftChange(togglePenalty(draft));
      case "shirt":
        return setDial({
          kind: "shirt",
          value: /^\d{1,2}$/.test(draft.playerName ?? "")
            ? (draft.playerName as string)
            : "",
        });
      case "minute":
        return setDial({
          kind: "minute",
          value: draft.minute !== undefined ? String(draft.minute) : "",
        });
      case "move":
        return onMove();
      case "delete":
        return onDelete();
    }
  };

  return overlay(
    <RadialMenu
      anchor={anchor}
      sections={sections}
      center={center}
      ariaLabel={editing ? "Edit shot" : "New shot"}
      insets={insets}
      onClose={onClose}
      onPick={handlePick}
    />,
  );
};

export default ShotRadial;
