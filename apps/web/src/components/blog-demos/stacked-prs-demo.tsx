import type { ReactNode } from "react";

import { Actions, CommitGraph, Reserved, type GraphCommit, type GraphPulse } from "./commit-graph";
import { DEFAULT_SPACING } from "./commit-graph-layout";
import { Btn, DemoFrame } from "./demo-ui";
import { branchRef, BUILDS, INIT, mainRef, PRS, prMessage, REPLAYED } from "./merge-scenario";
import { useGoSteps } from "./use-go-steps";

/* Same row height as the Problem 1 widget, because this one continues where that one ended. */
const SPACING = { ...DEFAULT_SPACING, rowH: 66, laneW: 18 };

const PASSES: GraphCommit["status"] = { text: "✓ builds", tone: "ok" };
const FAILS: GraphCommit["status"] = { text: "✗ no sendReply on main", tone: "bad" };
const CHECKING: GraphCommit["status"] = { text: "● check running", tone: "wait" };

const BASE_MAIN = "base: main";
const BASE_MARIA = `base: ${PRS["#2"].branch}`;

const twoOpen: GraphCommit = {
  id: "#2",
  lane: 1,
  parent: INIT.id,
  message: prMessage("#2"),
  hash: PRS["#2"].hash,
  owner: "maria",
  refs: [branchRef("#2", BASE_MAIN)],
  status: PASSES,
};

const twoLanded = (tip: boolean): GraphCommit => ({
  id: "#2",
  lane: 0,
  parent: INIT.id,
  message: prMessage("#2"),
  hash: PRS["#2"].hash,
  owner: "maria",
  refs: tip ? [mainRef(BUILDS.stat, BUILDS.tone)] : undefined,
});

/* Ben's #3 forks from main, the same as Problem 1, before its check has said anything. */
const threeOnMain = (status?: GraphCommit["status"]): GraphCommit => ({
  id: "#3",
  lane: 2,
  parent: INIT.id,
  message: prMessage("#3"),
  hash: PRS["#3"].hash,
  owner: "ben",
  refs: [branchRef("#3", BASE_MAIN)],
  status,
  look: status === FAILS ? "bad" : undefined,
});

/* #3 after the rebase, forked from Maria's commit instead of main. */
const threeOnTwo = (base: string, status?: GraphCommit["status"]): GraphCommit => ({
  id: "#3",
  lane: 1,
  parent: "#2",
  message: prMessage("#3"),
  hash: REPLAYED.threeOnTwo,
  owner: "ben",
  refs: [branchRef("#3", base)],
  status,
});

const threeLanded: GraphCommit = {
  id: "#3",
  lane: 0,
  parent: "#2",
  message: prMessage("#3"),
  hash: REPLAYED.threeOnTwo,
  owner: "ben",
  refs: [mainRef(BUILDS.stat, BUILDS.tone)],
};

const mainAtInit: GraphCommit = { ...INIT, refs: [mainRef(BUILDS.stat, BUILDS.tone)] };

/* Step 0 shows #3 forked from main. Go fails it there first, so the move to #2 has a reason. */
export const STACK_STEPS: GraphCommit[][] = [
  [threeOnMain(), twoOpen, mainAtInit],
  [threeOnMain(CHECKING), twoOpen, mainAtInit],
  [threeOnMain(FAILS), twoOpen, mainAtInit],
  [threeOnTwo(BASE_MARIA), twoOpen, mainAtInit],
  [threeOnTwo(BASE_MARIA, CHECKING), twoOpen, mainAtInit],
  [threeOnTwo(BASE_MARIA, PASSES), twoOpen, mainAtInit],
  [threeOnTwo(BASE_MARIA, PASSES), twoLanded(true), { ...INIT }],
  [threeOnTwo(BASE_MAIN, PASSES), twoLanded(true), { ...INIT }],
  [threeLanded, twoLanded(false), { ...INIT }],
];

/* How long each step holds before the next one starts. */
export const STACK_STEP_MS = [1300, 2200, 1800, 1300, 1500, 1300, 1000];

const CAPTIONS: ReactNode[] = [
  <>
    <b>Ben&apos;s #3 branches off</b> <code>main</code>, like every other PR.
  </>,
  <>
    Ben&apos;s check runs on <code>main</code>.
  </>,
  <>
    <b>It fails.</b> <code>sendReply</code> is only on Maria&apos;s branch.
  </>,
  <>
    <b>So #3 moves.</b> It now branches off Maria&apos;s #2.
  </>,
  <>
    Ben&apos;s check reruns, with <code>sendReply</code> underneath.
  </>,
  <>
    <code>sendReply</code> exists now, so <b>#3 turns green.</b>
  </>,
  <>
    <b>Maria&apos;s #2 lands</b> on <code>main</code>.
  </>,
  <>
    Ben&apos;s #3 now targets <code>main</code>.
  </>,
  <>
    <b>Both landed, in order.</b> <code>main</code> never went red.
  </>,
];

const CAPTION_ITEMS = Object.fromEntries(CAPTIONS.map((caption, step) => [String(step), caption]));

const STACK_PULSE: GraphPulse = {
  key: "stack",
  commitId: "#2",
  childId: "#3",
  oldParentId: INIT.id,
  owner: "ben",
};

export function StackedPrsDemo() {
  const { step, done, go, reset } = useGoSteps(STACK_STEP_MS);

  return (
    <DemoFrame label="Ben's #3 moves from main to Maria's #2" tag="newest on top">
      <div className="gx-figure">
        <CommitGraph
          commits={STACK_STEPS[step]}
          lanes={3}
          rows={3}
          spacing={SPACING}
          pulse={step === 3 || step === 4 ? STACK_PULSE : undefined}
          label={
            done
              ? "Maria's #2 and Ben's #3 both landed on main, in order, and main builds."
              : "Commit graph of Maria's #2 and Ben's #3."
          }
        />
        <Reserved active={String(step)} items={CAPTION_ITEMS} className="gx-caption" announce />
        <Actions>
          <Btn onClick={go} disabled={step !== 0}>
            Go
          </Btn>
          <Btn onClick={reset} tone="muted">
            reset
          </Btn>
        </Actions>
      </div>
    </DemoFrame>
  );
}
