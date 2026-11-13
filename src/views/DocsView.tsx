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
  actionMarkerSamples,
  arrowSamples,
  passChainMarkerSamples,
  shotMarkerSamples,
  xgSizeSamples,
} from "./DocsView.samples";

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

        <div className="space-y-6">
          {/* Shot Map Features */}
          <div>
            <h3 className="mb-2 flex items-center text-xl font-semibold text-gray-700">
              <span className="mr-2 text-2xl">⚽</span>
              Shot Map
            </h3>
            <ul className="ml-8 list-disc space-y-1 text-gray-600">
              <li>Record shot locations & relevant shot data</li>
              <li>Visualization of shot map</li>
              <li>Display shot data on list view</li>
              <li>Filter shot data by all, home & away teams</li>
              <li>Export shot data as JSON</li>
              <li>Import shot data</li>
            </ul>
          </div>

          {/* Touch Map Features */}
          <div>
            <h3 className="mb-2 flex items-center text-xl font-semibold text-gray-700">
              <span className="mr-2 text-2xl">👟</span>
              Touch Map
            </h3>
            <ul className="ml-8 list-disc space-y-1 text-gray-600">
              <li>
                Record single player's touch locations & relevant touch data
              </li>
              <li>Visualization of touch map</li>
              <li>Display touch data on list view</li>
              <li>Export touch data as JSON</li>
              <li>Import touch data</li>
            </ul>
          </div>

          {/* Pass Chains Features */}
          <div>
            <h3 className="mb-2 flex items-center text-xl font-semibold text-gray-700">
              <span className="mr-2 text-2xl">🔗</span>
              Pass Chains Map
            </h3>
            <ul className="ml-8 list-disc space-y-1 text-gray-600">
              <li>
                Record sequences of actions (passes, carries, shots, crosses)
                that form attacking chains
              </li>
              <li>Visualization of pass chains map</li>
              <li>
                Pitch zone tracking (defensive/midfield/attacking ×
                left/central/right)
              </li>
              <li>
                Display pass chain data on list view with action sequences and
                termination details
              </li>
              <li>Export pass chain data as JSON</li>
              <li>Import pass chain data</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Marker Legend Section */}
      <section className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-6 text-2xl font-bold text-gray-800">
          🎯 Marker Legend
        </h2>

        <p className="mb-6 text-gray-600">
          Each map shows a compact legend under the pitch, which is also
          included in shared images. Colours were chosen to stay distinct for
          common types of colour blindness, and shape or fill carries the same
          information as colour.
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

      {/* How to Use Section */}
      <section className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-2xl font-bold text-gray-800">📱 How to Use</h2>
        <ol className="ml-6 list-decimal space-y-2 text-gray-600">
          <li>
            Select your desired view from the navigation (Shots, Touches, or
            Chains)
          </li>
          <li>Click on the pitch to record data at specific locations</li>
          <li>Fill in the relevant details in the form that appears</li>
          <li>View your data in both map and list views</li>
          <li>Export your data as JSON for further analysis</li>
          <li>Import previously saved data to continue your work</li>
        </ol>
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
