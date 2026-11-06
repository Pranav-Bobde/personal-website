import type { ReactNode } from "react";

import { Actions, CommitGraph, People, Reserved, type GraphCommit } from "./commit-graph";
import { DEFAULT_SPACING } from "./commit-graph-layout";
import { Btn, DemoFrame } from "./demo-ui";
import { branchRef, INIT, mainRef, MARIA_SYNCED, prMessage, MAIN_MOVES } from "./merge-scenario";
import { useGoSteps } from "./use-go-steps";

const ROWS = MAIN_MOVES.length + 2;

/* Lanes sit far apart here so each one has room for its own name. */
const SPACING = { ...DEFAULT_SPACING, laneW: 40, padX: 26, top: 12 };
const LANE_TAGS = [
  /* Sits left of its node so Maria's curve can reach the top of main after a sync. */
  { lane: 0, label: "main", owner: "main", nudgeLeft: 9 },
  { lane: 1, label: "Maria", owner: "maria" },
] as const;

type Drift = { mainCount: number; baseCount: number; syncing?: boolean };

/* Starts where the post leaves off, 2 behind. Two more PRs land, then Maria syncs. */
export const DRIFT_STEPS: Drift[] = [
  { mainCount: 2, baseCount: 0 },
  { mainCount: 3, baseCount: 0 },
  { mainCount: 4, baseCount: 0 },
  { mainCount: 4, baseCount: 0, syncing: true },
  { mainCount: 4, baseCount: 4 },
];

const STEP_MS = [1800, 2000, 1500];
const LAST_STEP = DRIFT_STEPS.length - 1;

const baseId = (baseCount: number) => (baseCount === 0 ? INIT.id : MAIN_MOVES[baseCount - 1].id);

const STARTS_HERE = { text: "Maria starts here", tone: "owner", owner: "maria" } as const;
const STARTED_HERE = { text: "Maria was here", tone: "faint" } as const;

export function driftCommits({ mainCount, baseCount, syncing }: Drift): GraphCommit[] {
  const behind = mainCount - baseCount;
  const syncStatus = (id: string) => {
    if (baseCount === 0) return undefined;
    if (id === baseId(baseCount)) return STARTS_HERE;
    return id === INIT.id ? STARTED_HERE : undefined;
  };
  const maria: GraphCommit = {
    id: "maria",
    lane: 1,
    parent: baseId(baseCount),
    message: prMessage("#2"),
    hash: MARIA_SYNCED[baseCount],
    owner: "maria",
    refs: [
      branchRef(
        "#2",
        syncing ? "● syncing" : behind > 0 ? `${behind} behind main` : "✓ up to date",
        behind > 0 ? "wait" : "ok",
      ),
    ],
  };
  const onMain = MAIN_MOVES.slice(0, mainCount)
    .map(
      (commit, index): GraphCommit => ({
        ...commit,
        lane: 0,
        parent: baseId(index),
        refs: index === mainCount - 1 ? [mainRef()] : undefined,
        status: syncStatus(commit.id),
      }),
    )
    .reverse();
  return [maria, ...onMain, { ...INIT, status: syncStatus(INIT.id) }];
}

const CAPTIONS: ReactNode[] = [
  <>
    <code>main</code> moved on and Maria&apos;s branch did not. Maria is <b>2 behind main</b>.
  </>,
  <>
    Kai&apos;s <code>add labels</code> lands. Maria is now <b>3 behind main</b>.
  </>,
  <>
    Julius&apos;s <code>add drafts</code> lands. Maria is now <b>4 behind main</b>.
  </>,
  <>
    You ask Maria to run <code>git rebase main</code>.
  </>,
  <>
    <b>Only Maria&apos;s branch moved.</b> It now starts from the top of <code>main</code>, and
    Maria&apos;s commit got a new hash: <code>{MARIA_SYNCED[0]}</code> became{" "}
    <code>{MARIA_SYNCED[MAIN_MOVES.length]}</code>. <code>main</code> did not change.
  </>,
];

const CAPTION_ITEMS = Object.fromEntries(CAPTIONS.map((caption, step) => [String(step), caption]));

export function BranchDriftDemo() {
  const { step, done, go, reset } = useGoSteps(STEP_MS);
  const drift = DRIFT_STEPS[step];
  const behind = drift.mainCount - drift.baseCount;

  return (
    <DemoFrame label="Maria's branch falls behind main" tag="newest on top">
      <div className="gx-figure">
        <People ids={["julius", "maria", "ben", "kai"]} />
        <CommitGraph
          commits={driftCommits(drift)}
          lanes={2}
          rows={ROWS}
          spacing={SPACING}
          laneTags={LANE_TAGS}
          label={
            done
              ? "Maria's branch maria/send-reply now starts from the newest commit on main"
              : `Maria's branch maria/send-reply is ${behind} commits behind main`
          }
          bracket={{
            span: behind > 0 ? { from: MAIN_MOVES[drift.mainCount - 1].id, to: MAIN_MOVES[0].id } : null,
            label: "Maria doesn't have these",
            owner: "maria",
          }}
          pulse={
            done
              ? {
                  key: "sync",
                  commitId: baseId(drift.baseCount),
                  childId: "maria",
                  oldParentId: INIT.id,
                  owner: "maria",
                }
              : undefined
          }
        />
        <Reserved
          active={String(step)}
          items={CAPTION_ITEMS}
          className="gx-caption"
          tone={step === LAST_STEP ? "ok" : "wait"}
          announce
        />
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
