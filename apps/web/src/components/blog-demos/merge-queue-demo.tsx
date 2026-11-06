import { useState, type ReactNode } from "react";

import { Actions, Avatar, CommitGraph, Reserved, Segments, type GraphCommit } from "./commit-graph";
import { Btn, DemoFrame } from "./demo-ui";
import {
  branchRef,
  BROKEN,
  BUILDING,
  BUILDS,
  mainRef,
  ON_SYNCED_MAIN,
  PRS,
  prMessage,
  REPLAYED,
  LANDED_NO_QUEUE,
  SYNCED_MAIN,
} from "./merge-scenario";
import { useGoSteps } from "./use-go-steps";

type QueueId = "#1" | "#2" | "#4";
type Frame = {
  commits: GraphCommit[];
  /* PRs still waiting, front of the line first. null means there is no queue at all. */
  line: QueueId[] | null;
  caption: ReactNode;
  /* Colours the caption when this frame is an outcome. */
  tone?: "ok" | "bad";
};

const TESTING = { text: "testing", tone: "wait", wideOnly: true } as const;
const GREEN = { text: "✓ green", tone: "ok" } as const;
const REMOVED = { text: "✗ removed", tone: "bad" } as const;

const LANES: Record<QueueId, number> = { "#1": 1, "#2": 2, "#4": 3 };
const BASE = SYNCED_MAIN;

/*
 * A PR being tested in the queue: it lives on a temporary branch named after what it
 * contains. `contains` never lists a PR already on main, because main includes it.
 */
const trial = (id: QueueId, parent: string, contains: string, hash: string): GraphCommit => ({
  id,
  lane: LANES[id],
  parent,
  message: prMessage(id),
  hash,
  owner: PRS[id].owner,
  refs: [{ name: `temp: ${contains}`, tone: "wait", owner: PRS[id].owner }],
  status: TESTING,
  look: "trial",
});

const landed = (
  id: QueueId,
  parent: string,
  hash: string,
  tip: { stat: string; tone: "ok" | "bad" | "wait" } | null,
): GraphCommit => ({
  id,
  lane: 0,
  parent,
  message: prMessage(id),
  hash,
  owner: PRS[id].owner,
  refs: tip ? [mainRef(tip.stat, tip.tone)] : undefined,
  look: tip?.tone === "bad" ? "bad" : undefined,
});

const removed: GraphCommit = {
  id: "#2",
  lane: 2,
  parent: "#1",
  message: prMessage("#2"),
  hash: REPLAYED.twoOnOne,
  owner: "maria",
  refs: [branchRef("#2")],
  status: REMOVED,
  look: "bad",
};

const openPr = (id: QueueId): GraphCommit => ({
  id,
  lane: LANES[id],
  parent: BASE.id,
  message: prMessage(id),
  hash: ON_SYNCED_MAIN[id],
  owner: PRS[id].owner,
  refs: [branchRef(id)],
  status: GREEN,
});

const mainBase = { ...BASE, refs: [mainRef(BUILDS.stat, BUILDS.tone)] };
const plainBase = { ...BASE };

export const QUEUE_FRAMES: Frame[] = [
  {
    commits: [openPr("#4"), openPr("#2"), openPr("#1"), mainBase],
    line: [],
    caption: <>The same three green PRs. This time, pressing merge puts each one in a line.</>,
  },
  {
    commits: [
      trial("#4", BASE.id, "main + #1 + #2 + #4", REPLAYED.fourOnTwo),
      trial("#2", BASE.id, "main + #1 + #2", REPLAYED.twoOnOne),
      trial("#1", BASE.id, "main + #1", ON_SYNCED_MAIN["#1"]),
      mainBase,
    ],
    line: ["#1", "#2", "#4"],
    caption: (
      <>
        All three join the line. Each is tested on a temporary branch: <code>main</code>, plus the PRs
        ahead of it, plus itself.
      </>
    ),
  },
  {
    commits: [
      trial("#4", "#1", "main + #2 + #4", REPLAYED.fourOnTwo),
      trial("#2", "#1", "main + #2", REPLAYED.twoOnOne),
      landed("#1", BASE.id, ON_SYNCED_MAIN["#1"], BUILDS),
      plainBase,
    ],
    line: ["#2", "#4"],
    caption: (
      <>
        <b>Julius&apos;s #1 passes and lands on main.</b> The other two were already being tested with
        #1 included.
      </>
    ),
  },
  {
    commits: [
      trial("#4", "#1", "main + #2 + #4", REPLAYED.fourOnTwo),
      removed,
      landed("#1", BASE.id, ON_SYNCED_MAIN["#1"], BUILDS),
      plainBase,
    ],
    line: ["#4"],
    tone: "bad",
    caption: (
      <>
        <b>Maria&apos;s #2 fails and leaves the line.</b> Its temporary branch is where Julius&apos;s
        rename first met Maria&apos;s call. <code>main</code> never saw it.
      </>
    ),
  },
  {
    commits: [
      trial("#4", "#1", "main + #4", REPLAYED.fourOnOne),
      removed,
      landed("#1", BASE.id, ON_SYNCED_MAIN["#1"], BUILDS),
      plainBase,
    ],
    line: ["#4"],
    caption: (
      <>Kai&apos;s #4 did nothing wrong, but its test run had Maria&apos;s #2 inside. It is tested again, without #2.</>
    ),
  },
  {
    commits: [
      landed("#4", "#1", REPLAYED.fourOnOne, BUILDS),
      removed,
      landed("#1", BASE.id, ON_SYNCED_MAIN["#1"], null),
      plainBase,
    ],
    line: [],
    caption: (
      <>
        <b>Kai&apos;s #4 passes and lands.</b> <code>main</code> is still green, and you have the exact
        error to hand to Maria.
      </>
    ),
  },
  {
    commits: [
      trial("#2", "#4", "main + #2", REPLAYED.fixedTwoOnFour),
      landed("#4", "#1", REPLAYED.fourOnOne, BUILDS),
      landed("#1", BASE.id, ON_SYNCED_MAIN["#1"], null),
      plainBase,
    ],
    line: ["#2"],
    caption: (
      <>
        You ask Maria to call <code>deliver</code> instead. #2 rejoins at the back of the line, tested
        against the <code>main</code> that exists today.
      </>
    ),
  },
  {
    commits: [
      landed("#2", "#4", REPLAYED.fixedTwoOnFour, BUILDS),
      landed("#4", "#1", REPLAYED.fourOnOne, null),
      landed("#1", BASE.id, ON_SYNCED_MAIN["#1"], null),
      plainBase,
    ],
    line: [],
    tone: "ok",
    caption: (
      <>
        <b>All three landed</b>, and <code>main</code> was green at every step.
      </>
    ),
  },
];

export const NO_QUEUE_FRAMES: Frame[] = [
  {
    commits: [openPr("#4"), openPr("#2"), openPr("#1"), mainBase],
    line: null,
    caption: (
      <>
        All three are green. Each check ran against a <code>main</code> without the other two.
      </>
    ),
  },
  {
    commits: [openPr("#2"), openPr("#1"), landed("#4", BASE.id, ON_SYNCED_MAIN["#4"], BUILDS), plainBase],
    line: null,
    caption: (
      <>
        <b>Kai&apos;s #4 merges.</b> It touches nothing the others touch, and <code>main</code> still builds.
      </>
    ),
  },
  {
    commits: [
      openPr("#2"),
      landed("#1", "#4", LANDED_NO_QUEUE.one, BUILDS),
      landed("#4", BASE.id, ON_SYNCED_MAIN["#4"], null),
      plainBase,
    ],
    line: null,
    caption: (
      <>
        <b>Julius&apos;s #1 merges.</b> <code>main</code> still builds. Maria&apos;s green check ran before
        this rename existed.
      </>
    ),
  },
  {
    commits: [
      landed("#2", "#1", LANDED_NO_QUEUE.two, BUILDING),
      landed("#1", "#4", LANDED_NO_QUEUE.one, null),
      landed("#4", BASE.id, ON_SYNCED_MAIN["#4"], null),
      plainBase,
    ],
    line: null,
    caption: (
      <>
        <b>Maria&apos;s #2 merges.</b> Git sees no conflict, and the build runs on <code>main</code>.
      </>
    ),
  },
  {
    commits: [
      landed("#2", "#1", LANDED_NO_QUEUE.two, BROKEN),
      landed("#1", "#4", LANDED_NO_QUEUE.one, null),
      landed("#4", BASE.id, ON_SYNCED_MAIN["#4"], null),
      plainBase,
    ],
    line: null,
    tone: "bad",
    caption: (
      <>
        <b>The build breaks on main.</b> <code>sendEmail</code> no longer exists. Every branch that syncs
        now pulls in the same error.
      </>
    ),
  },
];

type Mode = "none" | "queue";
const MODE_OPTIONS: { id: Mode; label: string }[] = [
  { id: "none", label: "no queue" },
  { id: "queue", label: "merge queue" },
];
const FRAMES: Record<Mode, Frame[]> = { none: NO_QUEUE_FRAMES, queue: QUEUE_FRAMES };
const MODES = Object.keys(FRAMES) as Mode[];

/* How long each frame holds after Go, one entry per frame between the first and the last. */
export const QUEUE_STEP_MS: Record<Mode, readonly number[]> = {
  none: [1900, 2300, 2000],
  queue: [2800, 2400, 2800, 2200, 2200, 2500],
};

function Line({ line }: { line: Frame["line"] }) {
  if (!line) {
    return <p className="gx-line-note">No line. Any green PR can merge at any moment.</p>;
  }
  return (
    <div className="gx-line-strip">
      <span className="gx-pill" data-tone="idle" data-owner="main">
        main
      </span>
      <span className="gx-line-arrow" aria-hidden>
        ←
      </span>
      {line.length === 0 ? <span className="gx-line-note">the line is empty</span> : null}
      <ol aria-label="The merge queue, front of the line first">
        {line.map((id) => (
          <li key={id} className="gx-chip" data-pr={id} data-owner={PRS[id].owner}>
            <Avatar person={PRS[id].owner} />
            {id}
          </li>
        ))}
      </ol>
    </div>
  );
}

const captionItems = Object.fromEntries(
  MODES.flatMap((mode) =>
    FRAMES[mode].map((frame, index) => [
      `${mode}-${index}`,
      index === 0 ? (
        frame.caption
      ) : (
        <>
          <span className="gx-step">
            step {index} of {FRAMES[mode].length - 1}
          </span>{" "}
          {frame.caption}
        </>
      ),
    ]),
  ),
);

const lineItems = Object.fromEntries(
  MODES.flatMap((mode) =>
    FRAMES[mode].map((frame, index) => [`${mode}-${index}`, <Line key={index} line={frame.line} />]),
  ),
);

export function MergeQueueDemo() {
  const [mode, setMode] = useState<Mode>("none");
  const { step, go, reset } = useGoSteps(QUEUE_STEP_MS[mode]);
  const frame = FRAMES[mode][step];

  const switchMode = (next: Mode) => {
    setMode(next);
    reset();
  };

  return (
    <DemoFrame label="Run #1, #2 and #4 again" tag="newest on top">
      <div className="gx-figure">
        <Reserved active={`${mode}-${step}`} items={lineItems} />
        <CommitGraph
          commits={frame.commits}
          lanes={4}
          rows={4}
          label={`Commit graph at step ${step} of ${FRAMES[mode].length - 1}`}
        />
        <Reserved
          active={`${mode}-${step}`}
          items={captionItems}
          className="gx-caption"
          tone={frame.tone ?? "run"}
          announce
        />
        <Actions>
          <Segments options={MODE_OPTIONS} value={mode} onChange={switchMode} label="Merge mode" />
        </Actions>
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
