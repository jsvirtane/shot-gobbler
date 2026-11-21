import React from "react";
import {
  DocsExample,
  DocsExampleGroup,
  DocsLegendPreview,
  DocsMarkerDisplay,
} from "../components/DocsMarkerDisplay";
import {
  PassChainLegend,
  ShotLegend,
  TouchLegend,
} from "../components/MapLegend/MapLegend";
import { PassChainActionMarker } from "../components/PassChainMap/PassChainActionMarker";
import { PassChainArrow } from "../components/PassChainMap/PassChainArrow";
import { PassChainTerminationMarker } from "../components/PassChainMap/PassChainTerminationMarker";
import { ShotMarker } from "../components/ShotMap/ShotMarker";
import { ActionMarker } from "../components/TouchMap/ActionMarker";
import {
  CATEGORY_RING_COLORS,
  CATEGORY_RING_LABELS,
  OUTCOME_RING_COLORS,
} from "../components/TouchMap/touchRings";
import { ActionCategory } from "../types/Action";
import { ShotResult } from "../types/Shot";
import { SHOT_RESULT_FILLS } from "../utils/shotResult";
import {
  actionMarkerSamples,
  arrowSamples,
  passChainMarkerSamples,
  shotMarkerSamples,
  xgSizeSamples,
} from "./DocsView.samples";

const SHOT_RESULTS: ShotResult[] = ["Goal", "Saved", "Blocked", "Miss"];
const ACTION_CATEGORIES: ActionCategory[] = ["attacking", "defensive", "duel"];

/** A row of ring option colours, as they look in the ring. */
const RingSwatches: React.FC<{ items: { label: string; color: string }[] }> = ({
  items,
}) => (
  <div className="mt-3 flex flex-wrap gap-2" aria-label="Ring colours">
    {items.map(({ label, color }) => (
      <span
        key={label}
        className="rounded-md px-2.5 py-1 text-sm font-semibold text-white"
        style={{ backgroundColor: color }}
      >
        {label}
      </span>
    ))}
  </div>
);

const DocsView: React.FC = () => {
  return (
    <div className="mx-auto max-w-4xl space-y-8 overflow-y-auto pb-8">
      {/* Hero Section */}
      <section className="rounded-lg bg-white p-6 shadow-md">
        <h1 className="mb-4 text-3xl font-bold text-gray-800">
          📊 Shot Gobbler
        </h1>
        <p className="text-lg text-gray-600">
          A simple and efficient tool for collecting, analyzing, and visualizing
          shot & touch data from football/soccer matches.
        </p>
      </section>

      {/* Features Section */}
      <section className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-2xl font-bold text-gray-800">✨ Features</h2>
        <ul className="ml-6 list-disc space-y-1 text-gray-600">
          <li>
            Three trackers: <b>⚽ Shots</b> (both teams, with xG),{" "}
            <b>👟 Touches</b> (one player&apos;s actions) and <b>🔗 Chains</b>{" "}
            (passing sequences and how they ended)
          </li>
          <li>
            Pitch-first recording: tap where it happened, pick from a ring
            around your thumb. No forms to fill in
          </li>
          <li>
            Focus mode: a full-screen pitch with the match clock, undo and
            tracker switch in one floating bar
          </li>
          <li>
            Matches with team names and a running clock; every event is stamped
            with its minute and period
          </li>
          <li>
            Football or futsal per match: futsal gets its own pitch, 20-minute
            halves, the 10 m kick, kick-ins and no offside
          </li>
          <li>Lists, stats, filters and map legends for reviewing a match</li>
          <li>Share the map as an image; export and import data as JSON</li>
        </ul>
      </section>

      {/* Focus Mode Section */}
      <section className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-2xl font-bold text-gray-800">📱 Focus Mode</h2>
        <p className="mb-4 text-gray-600">
          Built for tracking at the ground with the phone in one hand. Tap{" "}
          <b>Track</b> in the match bar (or start the match clock) and the pitch
          fills the screen. The floating bar holds everything else:
        </p>
        <ul className="ml-6 list-disc space-y-1 text-gray-600">
          <li>
            <b>Tracker</b>: switch between Shots, Touches and Chains
          </li>
          <li>
            <b>Clock</b>: start or pause the match clock
          </li>
          <li>
            <b>Half pitch</b> (shots): one half with the goal at the bottom, and
            a team toggle for whose shots you are recording. The team you pick
            is remembered
          </li>
          <li>
            <b>Undo</b>: takes back the last change, including deletes
          </li>
          <li>
            <b>Exit</b> (arrows pointing in): back to review mode
          </li>
        </ul>
      </section>

      {/* Rings Section */}
      <section className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-2xl font-bold text-gray-800">
          🎯 Recording with the Rings
        </h2>
        <p className="mb-6 text-gray-600">
          Tap the pitch where it happened and a ring of options opens around the
          tap. Pick an option to save; tap outside the ring (or press Esc) to
          close it without saving. The rings work the same in focus mode and
          review mode.
        </p>
        <p className="mb-6 text-gray-600">
          Each save, move or delete gives quick feedback: the phone vibrates
          briefly (switch it off with <b>Vibrate on save</b> in the ⋯ data
          menu), the marker pulses once, and a short toast sums up what was
          recorded, with an <b>Undo</b> button to take it back.
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="mb-2 text-xl font-semibold text-gray-700">
              ⚽ Shots
            </h3>
            <ul className="ml-6 list-disc space-y-1 text-gray-600">
              <li>
                The ring&apos;s <b>Result</b> section saves the shot: Goal,
                Saved, Blocked or Miss
              </li>
              <li>
                Set <b>Details</b> first if needed: Head, Set piece, Penalty (10
                m kick too in futsal) and the shirt number (a number dial)
              </li>
              <li>
                The team comes from the half you tap; the ring&apos;s centre
                switches it
              </li>
            </ul>
            <RingSwatches
              items={SHOT_RESULTS.map((result) => ({
                label: result,
                color: SHOT_RESULT_FILLS[result],
              }))}
            />
          </div>

          <div>
            <h3 className="mb-2 text-xl font-semibold text-gray-700">
              👟 Touches
            </h3>
            <ul className="ml-6 list-disc space-y-1 text-gray-600">
              <li>
                Pick the action from the Attack, Defend or Duel section;{" "}
                <b>More</b> holds the rest (shot, throw-in, …)
              </li>
              <li>
                A second ring asks for the outcome, which saves the touch.{" "}
                <b>Back</b> returns to the actions
              </li>
            </ul>
            <RingSwatches
              items={[
                ...ACTION_CATEGORIES.map((category) => ({
                  label: CATEGORY_RING_LABELS[category],
                  color: CATEGORY_RING_COLORS[category],
                })),
                { label: "Success", color: OUTCOME_RING_COLORS.success },
                { label: "Fail", color: OUTCOME_RING_COLORS.failure },
              ]}
            />
          </div>

          <div>
            <h3 className="mb-2 text-xl font-semibold text-gray-700">
              🔗 Chains
            </h3>
            <ul className="ml-6 list-disc space-y-1 text-gray-600">
              <li>The first tap starts a chain where the ball is</li>
              <li>
                Each next tap opens the <b>Step</b> ring: how the ball got there
                (Pass, Carry, Cross or Shot)
              </li>
              <li>
                <b>End chain</b> opens the End ring (a shot&apos;s result, a
                loss of the ball, or a stoppage), which saves the chain
              </li>
              <li>
                <b>Cancel</b> drops the chain being recorded; the toast&apos;s
                Undo brings it back
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-2 text-xl font-semibold text-gray-700">
              ✏️ Editing
            </h3>
            <ul className="ml-6 list-disc space-y-1 text-gray-600">
              <li>
                Tap a marker to open its ring with the current choices outlined;
                pick a new one to change it
              </li>
              <li>
                The <b>Edit</b> section has <b>Move</b> (the next pitch tap
                places it), <b>Minute</b> and <b>Delete</b>
              </li>
              <li>Press and hold a marker to drag it somewhere else</li>
              <li>Tap a saved chain to delete it</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Review Mode Section */}
      <section className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-2xl font-bold text-gray-800">
          📋 Review Mode
        </h2>
        <ul className="ml-6 list-disc space-y-1 text-gray-600">
          <li>
            The pitch with its legend, plus list and stats views for each
            tracker
          </li>
          <li>Filter shots by team and see xG totals</li>
          <li>
            The match bar: pick or create a match, set team names and the pitch
            (football or futsal) and run the clock
          </li>
          <li>
            The data menu: share the map as an image, export or import JSON
          </li>
        </ul>
      </section>

      {/* Marker Legend Section */}
      <section className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-6 text-2xl font-bold text-gray-800">
          🎯 Marker Legend
        </h2>

        <p className="mb-6 text-gray-600">
          Each map shows a compact legend under the pitch, which is also
          included in shared images. Shot results use the same colours here, in
          the ring and in the shot list. Colours were chosen to stay distinct
          for common types of colour blindness, and shape or fill carries the
          same information as colour.
        </p>

        {/* Shot Markers */}
        <div className="mb-8">
          <h3 className="mb-4 text-xl font-semibold text-gray-700">
            Shot Markers
          </h3>
          <div className="space-y-4">
            <DocsExampleGroup title="Team (Colour)">
              <DocsExample label="Home team">
                <ShotMarker shot={shotMarkerSamples.homeSaved} />
              </DocsExample>
              <DocsExample label="Away team">
                <ShotMarker shot={shotMarkerSamples.awaySaved} />
              </DocsExample>
            </DocsExampleGroup>

            <DocsExampleGroup title="Result (Shape)">
              <DocsExample label="Goal (star)">
                <ShotMarker shot={shotMarkerSamples.homeGoal} />
              </DocsExample>
              <DocsExample label="Saved (filled circle)">
                <ShotMarker shot={shotMarkerSamples.homeSaved} />
              </DocsExample>
              <DocsExample label="Blocked (triangle)">
                <ShotMarker shot={shotMarkerSamples.homeBlocked} />
              </DocsExample>
              <DocsExample label="Miss (hollow circle)">
                <ShotMarker shot={shotMarkerSamples.homeMiss} />
              </DocsExample>
            </DocsExampleGroup>

            <DocsExampleGroup title="Expected Goals (Size)">
              {xgSizeSamples.map(({ label, shot }) => (
                <DocsExample key={label} label={label}>
                  <ShotMarker shot={shot} />
                </DocsExample>
              ))}
            </DocsExampleGroup>

            <DocsLegendPreview>
              <ShotLegend />
            </DocsLegendPreview>
          </div>
        </div>

        {/* Touch/Action Markers */}
        <div className="mb-8">
          <h3 className="mb-4 text-xl font-semibold text-gray-700">
            Touch/Action Markers
          </h3>
          <div className="space-y-4">
            <DocsExampleGroup title="Action Categories (Colour)">
              <DocsExample label="Attacking (pass, cross, dribble, shot, throw-in)">
                <ActionMarker action={actionMarkerSamples.attackingSuccess} />
              </DocsExample>
              <DocsExample label="Defensive (tackle, block, interception, clearance)">
                <ActionMarker action={actionMarkerSamples.defensive} />
              </DocsExample>
              <DocsExample label="Duels (aerial, ground)">
                <ActionMarker action={actionMarkerSamples.duel} />
              </DocsExample>
            </DocsExampleGroup>

            <DocsExampleGroup title="Action Outcomes (Fill)">
              <DocsExample label="Successful (filled)">
                <ActionMarker action={actionMarkerSamples.attackingSuccess} />
              </DocsExample>
              <DocsExample label="Unsuccessful (hollow)">
                <ActionMarker
                  action={actionMarkerSamples.attackingUnsuccessful}
                />
              </DocsExample>
            </DocsExampleGroup>

            <DocsLegendPreview>
              <TouchLegend />
            </DocsLegendPreview>
          </div>
        </div>

        {/* Pass Chain Markers */}
        <div>
          <h3 className="mb-4 text-xl font-semibold text-gray-700">
            Pass Chain Markers
          </h3>
          <div className="space-y-4">
            {/* Action Types */}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-gray-500 uppercase">
                Action Types
              </h4>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="flex items-center space-x-3">
                  <DocsMarkerDisplay>
                    <PassChainActionMarker
                      action={passChainMarkerSamples.pass}
                      isCurrentChain={true}
                    />
                  </DocsMarkerDisplay>
                  <span className="text-gray-700">Pass</span>
                </div>
                <div className="flex items-center space-x-3">
                  <DocsMarkerDisplay>
                    <PassChainActionMarker
                      action={passChainMarkerSamples.carry}
                      isCurrentChain={true}
                    />
                  </DocsMarkerDisplay>
                  <span className="text-gray-700">Carry</span>
                </div>
                <div className="flex items-center space-x-3">
                  <DocsMarkerDisplay>
                    <PassChainActionMarker
                      action={passChainMarkerSamples.shot}
                      isCurrentChain={true}
                    />
                  </DocsMarkerDisplay>
                  <span className="text-gray-700">Shot</span>
                </div>
                <div className="flex items-center space-x-3">
                  <DocsMarkerDisplay>
                    <PassChainActionMarker
                      action={passChainMarkerSamples.cross}
                      isCurrentChain={true}
                    />
                  </DocsMarkerDisplay>
                  <span className="text-gray-700">Cross</span>
                </div>
              </div>
            </div>

            {/* Special Markers */}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-gray-500 uppercase">
                Special Markers
              </h4>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="flex items-center space-x-3">
                  <DocsMarkerDisplay>
                    <PassChainActionMarker
                      action={passChainMarkerSamples.start}
                      isCurrentChain={true}
                    />
                  </DocsMarkerDisplay>
                  <span className="text-gray-700">Chain start</span>
                </div>
                <div className="flex items-center space-x-3">
                  <DocsMarkerDisplay>
                    <PassChainTerminationMarker
                      action={passChainMarkerSamples.terminationGoal}
                      terminationReason="goal"
                      isCurrentChain={true}
                    />
                  </DocsMarkerDisplay>
                  <span className="text-gray-700">Chain ended in goal</span>
                </div>
                <div className="flex items-center space-x-3">
                  <DocsMarkerDisplay>
                    <PassChainTerminationMarker
                      action={passChainMarkerSamples.terminationNoGoal}
                      terminationReason="shot_missed"
                      isCurrentChain={true}
                    />
                  </DocsMarkerDisplay>
                  <span className="text-gray-700">Chain ended (no goal)</span>
                </div>
              </div>
            </div>

            {/* Arrow Styles */}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-gray-500 uppercase">
                Arrow Styles (Line Style)
              </h4>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="flex items-center space-x-3">
                  <div className="relative h-12 w-16 bg-gray-700">
                    <PassChainArrow
                      fromAction={arrowSamples.start}
                      toAction={arrowSamples.endPass}
                      isCurrentChain={true}
                    />
                  </div>
                  <span className="text-gray-700">Pass</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="relative h-12 w-16 bg-gray-700">
                    <PassChainArrow
                      fromAction={arrowSamples.start}
                      toAction={arrowSamples.endCarry}
                      isCurrentChain={true}
                    />
                  </div>
                  <span className="text-gray-700">Carry</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="relative h-12 w-16 bg-gray-700">
                    <PassChainArrow
                      fromAction={arrowSamples.start}
                      toAction={arrowSamples.endShot}
                      isCurrentChain={true}
                    />
                  </div>
                  <span className="text-gray-700">Shot</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="relative h-12 w-16 bg-gray-700">
                    <PassChainArrow
                      fromAction={arrowSamples.start}
                      toAction={arrowSamples.endCross}
                      isCurrentChain={true}
                    />
                  </div>
                  <span className="text-gray-700">Cross</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <DocsLegendPreview>
            <PassChainLegend />
          </DocsLegendPreview>
        </div>
      </section>

      {/* About Section */}
      <section className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-2xl font-bold text-gray-800">ℹ️ About</h2>
        <p className="mb-4 text-gray-600">
          Shot Gobbler is designed for football analysts, fans, and data
          enthusiasts who want to collect and analyze match data. Best viewed on
          mobile devices for easy pitch interaction.
        </p>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <a
            href="https://github.com/jsvirtane/shot-gobbler"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-500"
          >
            GitHub Repository
          </a>
          <span>•</span>
          <span>Open Source</span>
        </div>
      </section>
    </div>
  );
};

export default DocsView;
