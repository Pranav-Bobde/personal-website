import type { ReactNode } from "react";

import { Actions, Avatar, CommitGraph, Reserved, type GraphCommit, type Person } from "./commit-graph";
import { Btn, DemoFrame } from "./demo-ui";
import {
  BEN_TITLE,
  branchRef,
  BROKEN,
  BUILDING,
  BUILDS,
  ERR_NO_EXPORT,
  mainRef,
  ON_SYNCED_MAIN,
  prMessage,
  LANDED_NO_QUEUE,
  SYNCED_MAIN,
} from "./merge-scenario";
import { useGoSteps } from "./use-go-steps";

const GREEN = { text: "✓ green", tone: "ok" } as const;
const MERGING = { text: "● merging", tone: "wait" } as const;

const kaiOpen: GraphCommit = {
  id: "#4",
  lane: 1,
  parent: SYNCED_MAIN.id,
  message: prMessage("#4"),
  hash: ON_SYNCED_MAIN["#4"],
  owner: "kai",
  refs: [branchRef("#4")],
  status: GREEN,
};

const kaiOnMain = (tip: boolean): GraphCommit => ({
  id: "#4",
  lane: 0,
  parent: SYNCED_MAIN.id,
  message: prMessage("#4"),
  hash: ON_SYNCED_MAIN["#4"],
  owner: "kai",
  refs: tip ? [mainRef(BUILDS.stat, BUILDS.tone)] : undefined,
});

const benOpen = (lane: number, status: GraphCommit["status"]): GraphCommit => ({
  id: BEN_TITLE.id,
  lane,
  parent: SYNCED_MAIN.id,
  message: BEN_TITLE.message,
  hash: BEN_TITLE.hash,
  owner: BEN_TITLE.owner,
  refs: [{ name: BEN_TITLE.branch, owner: BEN_TITLE.owner }],
  status,
});

const benConflict: GraphCommit = {
  ...benOpen(1, undefined),
  refs: [{ name: BEN_TITLE.branch, stat: "✗ conflict", tone: "bad", owner: BEN_TITLE.owner }],
  look: "bad",
};

export const SAME_LINE_STEPS: GraphCommit[][] = [
  [benOpen(2, GREEN), kaiOpen, { ...SYNCED_MAIN, refs: [mainRef()] }],
  [benOpen(1, GREEN), kaiOnMain(true), { ...SYNCED_MAIN }],
  [benOpen(1, MERGING), kaiOnMain(true), { ...SYNCED_MAIN }],
  [benConflict, kaiOnMain(true), { ...SYNCED_MAIN }],
];

const mariaOpen = (lane: number): GraphCommit => ({
  id: "#2",
  lane,
  parent: SYNCED_MAIN.id,
  message: prMessage("#2"),
  hash: ON_SYNCED_MAIN["#2"],
  owner: "maria",
  refs: [branchRef("#2")],
  status: GREEN,
});

const mariaOnMain = (tip: { stat: string; tone: "wait" | "bad" }): GraphCommit => ({
  id: "#2",
  lane: 0,
  parent: "#1",
  message: prMessage("#2"),
  hash: LANDED_NO_QUEUE.two,
  owner: "maria",
  refs: [mainRef(tip.stat, tip.tone)],
  look: tip.tone === "bad" ? "bad" : undefined,
});

const juliusOpen: GraphCommit = {
  id: "#1",
  lane: 1,
  parent: SYNCED_MAIN.id,
  message: prMessage("#1"),
  hash: ON_SYNCED_MAIN["#1"],
  owner: "julius",
  refs: [branchRef("#1")],
  status: GREEN,
};

const juliusOnMain = (tip: boolean): GraphCommit => ({
  id: "#1",
  lane: 0,
  parent: "#4",
  message: prMessage("#1"),
  hash: LANDED_NO_QUEUE.one,
  owner: "julius",
  refs: tip ? [mainRef(BUILDS.stat, BUILDS.tone)] : undefined,
});

export const DIFFERENT_LINES_STEPS: GraphCommit[][] = [
  [mariaOpen(2), juliusOpen, kaiOnMain(true), { ...SYNCED_MAIN }],
  [mariaOpen(1), juliusOnMain(true), kaiOnMain(false), { ...SYNCED_MAIN }],
  [mariaOnMain(BUILDING), juliusOnMain(false), kaiOnMain(false), { ...SYNCED_MAIN }],
  [mariaOnMain(BROKEN), juliusOnMain(false), kaiOnMain(false), { ...SYNCED_MAIN }],
];

const SAME_LINE_MS = [1700, 1900];
const DIFFERENT_LINES_MS = [2000, 2400];

function Change({ id, person, children }: { id: string; person: Person; children: ReactNode }) {
  return (
    <div className="gx-change">
      <Avatar person={person} />
      <b>{id}</b>
      <code>{children}</code>
    </div>
  );
}

function Outcome({ tool, text, tone }: { tool: string; text: string; tone: "ok" | "bad" }) {
  return (
    <p className="gx-outcome" data-tone={tone}>
      <span className="gx-outcome-tool">{tool}</span> <code>{text}</code>
    </p>
  );
}

const WAITING = <p className="gx-faint">Not merged yet.</p>;
const GIT_OK = <Outcome tool="git" tone="ok" text="Merge made by the 'ort' strategy." />;

const SAME_LINE_RESULTS: ReactNode[] = [
  WAITING,
  <p key="1">
    <b>Kai&apos;s #4 lands.</b> The title on <code>main</code> now says &quot;Inbox&quot;.
  </p>,
  <p key="2">
    Ben&apos;s #5 tries to land. Git compares it line by line with the new <code>main</code>.
  </p>,
  <>
    <Outcome tool="git" tone="bad" text="CONFLICT (content): Merge conflict in inbox.ts" />
    <p>
      <b>Git stops and says so.</b> Kai&apos;s #4 is in, and Ben&apos;s #5 waits until you pick a
      title. <code>main</code> is fine.
    </p>
  </>,
];

const DIFFERENT_LINES_RESULTS: ReactNode[] = [
  WAITING,
  <p key="1">
    <b>Julius&apos;s #1 lands.</b> <code>sendEmail</code> is now <code>deliver</code>, and{" "}
    <code>main</code> builds.
  </p>,
  <>
    {GIT_OK}
    <p>Git finds no clash and merges Maria&apos;s #2. The build runs.</p>
  </>,
  <>
    {GIT_OK}
    <Outcome tool="tsc" tone="bad" text={ERR_NO_EXPORT} />
    <p>
      <b>Git says fine and the build breaks.</b> Both PRs are in, and <code>main</code> is broken.
    </p>
  </>,
];

type Run = ReturnType<typeof useGoSteps>;

function Card({
  name,
  lede,
  steps,
  changes,
  run,
  results,
  outcome,
}: {
  name: string;
  lede: string;
  steps: GraphCommit[][];
  changes: ReactNode;
  run: Run;
  results: ReactNode[];
  outcome: "warn" | "bad";
}) {
  return (
    <div className="gx-card" data-outcome={run.done ? outcome : undefined}>
      <h4 className="gx-card-title">{name}</h4>
      <p className="gx-card-lede">{lede}</p>
      <div className="gx-changes">{changes}</div>
      <CommitGraph commits={steps[run.step]} lanes={3} rows={4} label={`${name}: ${lede}`} />
      <div className="gx-card-action">
        <Btn onClick={run.go} disabled={run.step !== 0} ariaLabel={`Go, ${name}`}>
          Go
        </Btn>
      </div>
      <Reserved
        active={String(run.step)}
        items={Object.fromEntries(results.map((result, step) => [String(step), result]))}
        className="gx-result"
        announce
      />
    </div>
  );
}

/* Each card has its own Go, because on a phone the two cards don't fit on one screen. */
export function ConflictKindsDemo() {
  const sameLine = useGoSteps(SAME_LINE_MS);
  const differentLines = useGoSteps(DIFFERENT_LINES_MS);

  return (
    <DemoFrame label="Two kinds of clash" tag="newest on top">
      <div className="gx-figure">
        <div className="gx-cards">
          <Card
            name="Problem 3: same line"
            lede="Kai's #4 and Ben's #5 edit the same title line in inbox.ts."
            steps={SAME_LINE_STEPS}
            run={sameLine}
            results={SAME_LINE_RESULTS}
            outcome="warn"
            changes={
              <>
                <Change id="#4" person="kai">{'title = "Inbox"'}</Change>
                <Change id="#5" person="ben">{'title = "Mail"'}</Change>
              </>
            }
          />
          <Card
            name="Problem 4: different lines"
            lede="Julius's #1 renames a function. Maria's #2 still calls the old name."
            steps={DIFFERENT_LINES_STEPS}
            run={differentLines}
            results={DIFFERENT_LINES_RESULTS}
            outcome="bad"
            changes={
              <>
                <Change id="#1" person="julius">{"function deliver(to)"}</Change>
                <Change id="#2" person="maria">{"sendEmail(to);"}</Change>
              </>
            }
          />
        </div>
        <Actions>
          <Btn
            onClick={() => {
              sameLine.reset();
              differentLines.reset();
            }}
            tone="muted"
          >
            reset
          </Btn>
        </Actions>
      </div>
    </DemoFrame>
  );
}
