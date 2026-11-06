import { useState, type ReactNode } from "react";

import { Actions, Avatar, CommitGraph, PEOPLE, Reserved, Segments, type GraphCommit } from "./commit-graph";
import { DEFAULT_SPACING } from "./commit-graph-layout";
import { Btn, DemoFrame } from "./demo-ui";
import { branchRef, Code, INIT, mainRef, MAIN_PATCH, PRS, prMessage, type PrId } from "./merge-scenario";
import { useGoSteps } from "./use-go-steps";

type View = "main" | PrId;

/* Newest on top. Rows fill from the bottom, so Julius forks first and Ben last, right above Maria. */
const CAST: PrId[] = ["#3", "#2", "#4", "#1"];
const FORK_ORDER: PrId[] = [...CAST].reverse();
const TASKS: PrId[] = ["#1", "#2", "#3", "#4"];

/* Each agent takes three beats: its commit appears, its check runs, its result shows. */
const BEATS = 3;
const BEAT_MS = [500, 900, 300];
const LAST_STEP = FORK_ORDER.length * BEATS;
const STEP_MS = Array.from({ length: LAST_STEP - 1 }, (_, index) => BEAT_MS[index % BEATS]);
const GAP = 24;

const OPTIONS: { id: View; label: string }[] = [
  { id: "main", label: "main" },
  { id: "#1", label: "Julius #1" },
  { id: "#2", label: "Maria #2" },
  { id: "#3", label: "Ben #3" },
  { id: "#4", label: "Kai #4" },
];

/* Rows here hold three lines on a phone: branch, commit, and why it is red or green. */
const SPACING = { ...DEFAULT_SPACING, rowH: 66, laneW: 18 };

const CAPTIONS: Record<View | "idle" | "running", ReactNode> = {
  idle: (
    <>
      <code>main</code> has one function, <code>sendEmail</code>. You hand out four tasks, and all four
      branches start here. Press Go.
    </>
  ),
  running: <>Each agent forks from <code>main</code>, commits, and its check runs.</>,
  main: (
    <>
      <b>Three green, and Ben&apos;s #3 red.</b> Press a name to see that agent&apos;s code.
    </>
  ),
  "#1": (
    <>
      <b>Julius&apos;s #1</b> renames <code>sendEmail</code> to <code>deliver</code>. Green, because
      nothing on Julius&apos;s branch calls the old name.
    </>
  ),
  "#2": (
    <>
      <b>Maria&apos;s #2</b> adds <code>sendReply</code>, which calls <code>sendEmail</code>. Green,
      because <code>sendEmail</code> still exists on Maria&apos;s branch.
    </>
  ),
  "#3": (
    <>
      <b>Ben&apos;s #3</b> adds a Reply button that calls <code>sendReply</code>. Red, because{" "}
      <code>sendReply</code> only exists on Maria&apos;s branch.
    </>
  ),
  "#4": (
    <>
      <b>Kai&apos;s #4</b> fixes a typo in the inbox title. Green, and it touches nothing the others
      touch.
    </>
  ),
};

const REASON: Record<PrId, GraphCommit["status"]> = {
  "#1": { text: "✓ builds", tone: "ok" },
  "#2": { text: "✓ builds", tone: "ok" },
  "#3": { text: "✗ sendReply doesn't exist here", tone: "bad" },
  "#4": { text: "✓ builds", tone: "ok" },
};

const CHECKING: GraphCommit["status"] = { text: "● check running", tone: "wait" };

/* Which beat this agent has reached at this step. 0 means it has not started. */
const beatOf = (id: PrId, step: number) =>
  Math.max(0, Math.min(BEATS, step - FORK_ORDER.indexOf(id) * BEATS));

export const castCommits = (step: number, view: View): GraphCommit[] => [
  ...CAST.filter((id) => beatOf(id, step) > 0).map((id): GraphCommit => {
    const beat = beatOf(id, step);
    const failed = beat === BEATS && !PRS[id].passesAlone;
    return {
      id,
      lane: FORK_ORDER.indexOf(id) + 1,
      parent: INIT.id,
      message: prMessage(id),
      hash: PRS[id].hash,
      owner: PRS[id].owner,
      refs: [branchRef(id)],
      status: beat === BEATS ? REASON[id] : beat === 2 ? CHECKING : undefined,
      look: failed ? "bad" : undefined,
      selected: view === id,
      gapBelow: id === "#3" ? GAP : undefined,
      gapNote: failed ? (
        <>
          Ben needs Maria&apos;s <code>sendReply</code>
        </>
      ) : undefined,
    };
  }),
  { ...INIT, refs: [mainRef()], selected: view === "main" && step === LAST_STEP },
];

const PANELS = Object.fromEntries(
  OPTIONS.map((option) => [
    option.id,
    <Code key={option.id} patch={option.id === "main" ? MAIN_PATCH : PRS[option.id].patch} />,
  ]),
);

export function PrCastDemo() {
  const [view, setView] = useState<View>("main");
  const { step, done, go, reset: resetSteps } = useGoSteps(STEP_MS);

  const reset = () => {
    resetSteps();
    setView("main");
  };

  const caption = step === 0 ? "idle" : done ? view : "running";

  return (
    <DemoFrame label="Four agents, four PRs" tag="newest on top">
      <div className="gx-figure">
        <ul className="gx-tasks" aria-label="The four tasks">
          {TASKS.map((id) => (
            <li key={id} className="gx-person" data-owner={PRS[id].owner}>
              <Avatar person={PRS[id].owner} />
              {PEOPLE[PRS[id].owner].name}
              <span className="gx-task-text">
                {id} {PRS[id].title}
              </span>
            </li>
          ))}
        </ul>
        <CommitGraph
          commits={castCommits(step, view)}
          lanes={5}
          rows={5}
          /* Ben's row brings a gap under it, so this space holds the graph's height until then. */
          spacing={{ ...SPACING, top: beatOf("#3", step) > 0 ? 0 : GAP }}
          dependency={done ? { from: "#3", to: "#2" } : undefined}
          label={
            done
              ? "Four branches, one for each agent, all forking from the same commit on main. Ben's is red because it needs Maria's sendReply."
              : "One commit on main. The agents' branches appear after Go."
          }
        />
        <Reserved active={view} items={PANELS} />
        <Reserved active={caption} items={CAPTIONS} className="gx-caption" announce />
        <Actions>
          <Btn onClick={go} disabled={step !== 0}>
            Go
          </Btn>
          <Btn onClick={reset} tone="muted">
            reset
          </Btn>
        </Actions>
        <div className="gx-actions">
          <span className="gx-actions-label">show the code for</span>
          <Segments
            options={OPTIONS}
            value={view}
            onChange={setView}
            label="Show the code for"
            disabled={!done}
          />
        </div>
      </div>
    </DemoFrame>
  );
}
