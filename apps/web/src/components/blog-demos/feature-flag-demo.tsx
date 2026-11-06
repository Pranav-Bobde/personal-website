import { useEffect, useState, type ReactNode } from "react";

import { Actions, CommitGraph, Reserved, type GraphCommit } from "./commit-graph";
import { Btn, DemoFrame } from "./demo-ui";
import { branchRef, mainRef, prMessage, REPLAYED } from "./merge-scenario";
import { prefersReducedMotion, useGoSteps } from "./use-go-steps";

const MAILS = [
  { from: "Sam", subject: "Lease, needs signature" },
  { from: "Dana", subject: "Q3 vendor call" },
  { from: "Figma", subject: "Weekly digest" },
];

/* main after the merge queue run: Kai's #4, then Maria's fixed #2 on top. */
const kaiOnMain: GraphCommit = {
  id: "#4",
  lane: 0,
  message: prMessage("#4"),
  hash: REPLAYED.fourOnOne,
  owner: "kai",
};

const mariaOnMain = (tip: boolean): GraphCommit => ({
  id: "#2",
  lane: 0,
  parent: "#4",
  message: prMessage("#2"),
  hash: REPLAYED.fixedTwoOnFour,
  owner: "maria",
  refs: tip ? [mainRef()] : undefined,
});

const CHECKING: GraphCommit["status"] = { text: "● check running", tone: "wait" };
const PASSES: GraphCommit["status"] = { text: "✓ builds", tone: "ok" };
const BEN_STATUS: (GraphCommit["status"] | undefined)[] = [undefined, CHECKING, PASSES];

/* Go: the check runs, it passes, #3 lands, and then the inbox shows what the flag decided. */
const STEP_MS = [1400, 1100, 1500];
const LANDS_AT = 3;

const benFlagged = (step: number): GraphCommit => {
  const merged = step >= LANDS_AT;
  return {
    id: "#3",
    lane: merged ? 0 : 1,
    parent: "#2",
    message: prMessage("#3"),
    hash: REPLAYED.flagThreeOnTwo,
    owner: "ben",
    refs: [merged ? mainRef() : branchRef("#3")],
    status: BEN_STATUS[step],
  };
};

export const flagCommits = (step: number): GraphCommit[] => [
  benFlagged(step),
  mariaOnMain(step < LANDS_AT),
  kaiOnMain,
];

/* How long the app takes to read a flag you flipped after #3 landed. */
const READ_FLAG_MS = 800;

function FlagSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className="demo-switch" data-on={on} aria-pressed={on}>
      <span className="demo-switch-track">
        <span className="demo-switch-thumb" />
      </span>
      <span className="gx-switch-label">
        reply-button flag <b data-on={on}>{on ? "ON" : "OFF"}</b>
      </span>
    </button>
  );
}

function Inbox({
  live,
  reading,
  sent,
  onReply,
}: {
  live: boolean;
  reading: boolean;
  sent: boolean;
  onReply: () => void;
}) {
  return (
    <div className="gx-inbox" data-live={live} data-reading={reading}>
      <p className="gx-inbox-head">what users see</p>
      {MAILS.map((mail, index) => (
        <div key={mail.from} className="gx-mail">
          <span className="gx-mail-text">
            <b>{mail.from}</b> {mail.subject}
          </span>
          {index === 0 ? (
            <button
              type="button"
              className="demo-btn gx-reply"
              data-live={live}
              tabIndex={live ? 0 : -1}
              aria-hidden={!live}
              onClick={onReply}
            >
              Reply
            </button>
          ) : null}
        </div>
      ))}
      <code className="gx-sent" data-shown={live && sent}>
        sendReply(&quot;sam&quot;) ran
      </code>
    </div>
  );
}

type Note = "none" | "early" | "check" | "passed" | "lands" | "reading" | "both" | "together" | "live";

const CAPTIONS: Record<Note, ReactNode> = {
  none: (
    <>
      Maria&apos;s #2 is already on <code>main</code>. Ben&apos;s #3 is still open, with its button
      behind the flag.
    </>
  ),
  early: (
    <>
      <b>The flag is ON but nothing changed</b>, because Ben&apos;s button code is not on{" "}
      <code>main</code> yet.
    </>
  ),
  check: <>Ben&apos;s check runs on #3.</>,
  passed: (
    <>
      <b>#3 is green.</b> Maria&apos;s #2 is underneath it on <code>main</code>.
    </>
  ),
  lands: (
    <>
      <b>Ben&apos;s #3 lands</b> on <code>main</code>. Now watch the inbox.
    </>
  ),
  reading: <>The app reads the new flag value. Nothing merges and nothing deploys.</>,
  both: (
    <>
      <b>Merged, not released.</b> Ben&apos;s #3 is on <code>main</code> and the inbox looks the same.
      Flip the flag.
    </>
  ),
  together: (
    <>
      <b>Merged and released together</b>, because the flag was already ON. Flip it off and the button is
      gone, with no revert and no deploy.
    </>
  ),
  live: (
    <>
      <b>Released, with no new merge.</b> Flip it back and the button is gone, with no revert and no
      deploy.
    </>
  ),
};

const RUN_NOTES: Note[] = ["check", "passed", "lands"];

export function FeatureFlagDemo() {
  const { step, done, go, reset: resetRun } = useGoSteps(STEP_MS);
  const [on, setOn] = useState(false);
  /* True once you have flipped the flag after #3 landed. */
  const [flippedAfter, setFlippedAfter] = useState(false);
  const [reading, setReading] = useState(false);
  const [sent, setSent] = useState(false);
  const live = done && on && !reading;

  useEffect(() => {
    if (!reading) return;
    const timer = setTimeout(() => setReading(false), READ_FLAG_MS);
    return () => clearTimeout(timer);
  }, [reading, on]);

  const flip = () => {
    setOn((current) => !current);
    if (!done) return;
    setFlippedAfter(true);
    setReading(!prefersReducedMotion());
  };

  const reset = () => {
    resetRun();
    setOn(false);
    setFlippedAfter(false);
    setReading(false);
    setSent(false);
  };

  const noteFor = (): Note => {
    if (step === 0) return on ? "early" : "none";
    if (!done) return RUN_NOTES[step - 1];
    if (reading) return "reading";
    if (!on) return "both";
    return flippedAfter ? "live" : "together";
  };

  return (
    <DemoFrame label="Ben's Reply button, behind one flag" tag="newest on top">
      <div className="gx-figure">
        <div className="gx-cards">
          <CommitGraph
            commits={flagCommits(step)}
            lanes={2}
            rows={3}
            label={step >= LANDS_AT ? "Ben's #3 is on main" : "Ben's #3 is still open"}
          />
          <Inbox live={live} reading={reading} sent={sent} onReply={() => setSent(true)} />
        </div>
        <Reserved
          active={noteFor()}
          items={CAPTIONS}
          className="gx-caption"
          tone={live ? "ok" : done ? "wait" : "run"}
          announce
        />
        <Actions>
          <FlagSwitch on={on} onToggle={flip} />
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
