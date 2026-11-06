import { useState, type ReactNode } from "react";

import { Actions, CommitGraph, PEOPLE, Reserved, Segments, type GraphCommit } from "./commit-graph";
import { Btn, DemoFrame } from "./demo-ui";
import { branchRef, buildError, INIT, mainRef, PRS, prMessage, REPLAYED, type PrId } from "./merge-scenario";
import { useGoSteps } from "./use-go-steps";

type PairId = "1-2" | "1-4" | "2-3";
type Pair = {
  first: PrId;
  second: PrId;
  verdict: "queue" | "stack";
  why: ReactNode;
  /* Why the failing check fails, in plain words. */
  failure?: ReactNode;
};

const PAIRS: Record<PairId, Pair> = {
  "1-2": {
    first: "#1",
    second: "#2",
    verdict: "queue",
    why: "Each builds alone, and neither has to wait for the other. They only break once combined, and a queue catches that before main does.",
    failure: (
      <>
        Julius renamed <code>sendEmail</code>, and Maria still calls it.
      </>
    ),
  },
  "1-4": {
    first: "#1",
    second: "#4",
    verdict: "queue",
    why: "Each builds alone and they never clash. A queue lands them one at a time. If your PRs rarely collide, you may not need one yet.",
  },
  "2-3": {
    first: "#2",
    second: "#3",
    verdict: "stack",
    why: "Ben's #3 cannot build without Maria's #2. A queue would not fix that, because #3 is red on its own. Build it on top of #2.",
    failure: (
      <>
        <code>sendReply</code> only exists on Maria&apos;s branch.
      </>
    ),
  },
};

const OPTIONS: { id: PairId; label: string }[] = [
  { id: "1-2", label: "Julius #1 + Maria #2" },
  { id: "1-4", label: "Julius #1 + Kai #4" },
  { id: "2-3", label: "Maria #2 + Ben #3" },
];

const branchCommit = (id: PrId, lane: number, parent: string, hash: string, base?: string): GraphCommit => ({
  id,
  lane,
  parent,
  message: prMessage(id),
  hash,
  owner: PRS[id].owner,
  refs: [branchRef(id, base ? `base: ${base}` : undefined)],
});

const mainTip: GraphCommit = { ...INIT, refs: [mainRef()] };

const sideBySide = ({ first, second }: Pair): GraphCommit[] => [
  branchCommit(second, 2, INIT.id, PRS[second].hash),
  branchCommit(first, 1, INIT.id, PRS[first].hash),
  mainTip,
];

const STACK_HASH: Record<string, string> = {
  "#2": REPLAYED.stackedTwoOnOne,
  "#3": REPLAYED.threeOnTwo,
  "#4": REPLAYED.stackedFourOnOne,
};

const onTop = ({ first, second }: Pair): GraphCommit[] => [
  branchCommit(second, 1, first, STACK_HASH[second], first),
  branchCommit(first, 1, INIT.id, PRS[first].hash),
  mainTip,
];

/*
 * Go runs three checks, each one running and then showing its result, and the verdict
 * comes last. Odd steps are "running", even steps are "result".
 */
export const CHECK_STEP_MS = [800, 1300, 800, 1300, 800, 1700];
const VERDICT_STEP = CHECK_STEP_MS.length + 1;

type CheckState = "pending" | "running" | "ok" | "bad";

const aloneLabel = (id: PrId) => `${PEOPLE[PRS[id].owner].name}'s ${id} alone`;

const checksOf = ({ first, second }: Pair): { label: string; ids: PrId[] }[] => [
  { label: aloneLabel(first), ids: [first] },
  { label: aloneLabel(second), ids: [second] },
  { label: "both together", ids: [first, second] },
];

export const checkState = (ids: PrId[], index: number, step: number): CheckState => {
  if (step < index * 2 + 1) return "pending";
  if (step === index * 2 + 1) return "running";
  return buildError(ids) ? "bad" : "ok";
};

const CHECK_MARK: Record<CheckState, string> = { pending: "·", running: "●", ok: "✓", bad: "✗" };

function Check({ label, state }: { label: string; state: CheckState }) {
  return (
    <span className="gx-check" data-state={state}>
      {label} <b>{CHECK_MARK[state]}</b>
    </span>
  );
}

function Shape({
  title,
  shape,
  picked,
  graph,
}: {
  title: string;
  shape: string;
  /* undefined until the checks have finished. */
  picked: boolean | undefined;
  graph: GraphCommit[];
}) {
  return (
    <div className="gx-card" data-pick={picked}>
      <h4 className="gx-card-title">
        {title} <span className="gx-pick">{picked ? "use this" : ""}</span>
      </h4>
      <p className="gx-card-lede">{shape}</p>
      <CommitGraph commits={graph} lanes={3} rows={3} label={`${title}: ${shape}`} />
    </div>
  );
}

const ownerName = (id: PrId) => `${PEOPLE[PRS[id].owner].name}'s ${id}`;

function stepCaption(pair: Pair, step: number): ReactNode {
  const { first, second } = pair;
  if (step === 0) {
    return (
      <>
        You want both {ownerName(first)} and {ownerName(second)} on <code>main</code>. Does each one build
        on its own?
      </>
    );
  }
  if (step === VERDICT_STEP) {
    return (
      <>
        <b className="gx-verdict" data-verdict={pair.verdict}>
          Use a {pair.verdict}.
        </b>{" "}
        {pair.why}
      </>
    );
  }
  const index = Math.floor((step - 1) / 2);
  const alone = index < 2;
  const { ids } = checksOf(pair)[index];
  if (step % 2 === 1) {
    return <>Building {alone ? `${ownerName(ids[0])} on its own` : "both together"}.</>;
  }
  if (buildError(ids)) {
    return (
      <>
        <b>{alone ? `${ownerName(ids[0])} fails.` : "Together they fail."}</b> {pair.failure}
      </>
    );
  }
  return <b>{alone ? `${ownerName(ids[0])} builds.` : "Both together build."}</b>;
}

const captionTone = (pair: Pair, step: number) => {
  if (step === VERDICT_STEP) return "pick";
  if (step === 0 || step % 2 === 1) return "run";
  return buildError(checksOf(pair)[(step - 2) / 2].ids) ? "bad" : "ok";
};

const STEPS = Array.from({ length: VERDICT_STEP + 1 }, (_, step) => step);

const CAPTIONS = Object.fromEntries(
  OPTIONS.flatMap(({ id }) =>
    STEPS.map((step) => [`${id}-${step}`, stepCaption(PAIRS[id], step)]),
  ),
);

function Checks({ pair, step }: { pair: Pair; step: number }) {
  return (
    <div className="gx-checks">
      <span className="gx-actions-label">builds?</span>
      {checksOf(pair).map(({ label, ids }, index) => (
        <Check key={label} label={label} state={checkState(ids, index, step)} />
      ))}
    </div>
  );
}

export function QueueOrStackDemo() {
  const [pairId, setPairId] = useState<PairId>("1-2");
  const { step, done, go, reset } = useGoSteps(CHECK_STEP_MS);
  const pair = PAIRS[pairId];

  const pick = (next: PairId) => {
    setPairId(next);
    reset();
  };

  return (
    <DemoFrame label="Does each PR build alone?" tag="newest on top">
      <div className="gx-figure">
        <div className="gx-cards">
          <Shape
            title="Merge queue"
            shape="Side by side, taking turns."
            picked={done ? pair.verdict === "queue" : undefined}
            graph={sideBySide(pair)}
          />
          <Shape
            title="Stack"
            shape="One on top of the other."
            picked={done ? pair.verdict === "stack" : undefined}
            graph={onTop(pair)}
          />
        </div>
        <Reserved
          active={pairId}
          items={Object.fromEntries(
            OPTIONS.map(({ id }) => [id, <Checks key={id} pair={PAIRS[id]} step={id === pairId ? step : 0} />]),
          )}
        />
        <Reserved
          active={`${pairId}-${step}`}
          items={CAPTIONS}
          className="gx-caption"
          tone={captionTone(pair, step)}
          announce
        />
        <div className="gx-actions">
          <Segments options={OPTIONS} value={pairId} onChange={pick} label="Pick a pair of PRs" />
        </div>
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
