import type { ReactNode } from "react";

import { Actions, Reserved } from "./commit-graph";
import { Btn, DemoFrame } from "./demo-ui";
import { SoundToggle, useSoundedGoSteps, type SoundCue } from "./demo-sound";

/* Word for word from a real chat. "..." marks a cut, the same as in the post. */
const Cut = () => <span className="chat-cut"> ... </span>;

const CLAIM_BEFORE = "With Node.js's common single-process async model, many concurrent handlers can share one pool ";
const CLAIM_FLAGGED = "very efficiently";
const PUSHBACK = [
  "omg - I'm still not getting what is the difference.",
  "Node is handling 100 requests, and that example is handling 20 requests, both being greater than 10. So why is node labeled or considered as the fine case",
  "you just self claimly tagged The node one as the efficient one and the other one as the inefficient one",
];
const ANSWER_OPENING = "You’re right to call that out. ";
const ANSWER_BOLD =
  "If we compare one Node.js process with one pool of 10 against one other single process with one pool of 10, there is no special efficiency difference just because it’s Node.js.";
const ANSWER_ADMITS = "My earlier wording made it sound like Node was inherently better here. ";
const ANSWER_LAST = "That was misleading.";

const CLAIM_AT = 1;
const FLAG_AT = 2;
const PUSHBACK_AT = 3;
const ANSWER_AT = 4;

/* How long each step holds. The answer is the last step, so it has no entry. */
export const PUSHBACK_STEP_MS = [1700, 2100, 3400];
const CUES: readonly (SoundCue | null)[] = [null, "note", "failure", "running", "success"];

const CAPTIONS: ReactNode[] = [
  <>One real moment from my chat with an AI about Postgres. Nothing here is rewritten.</>,
  <>The AI makes a claim. It reads fine.</>,
  <>
    <b>&quot;Very efficiently&quot; has nothing behind it.</b> No comparison, no number.
  </>,
  <>I push back, using its own example against it.</>,
  <>
    <b>It takes the claim back.</b> Nothing about Node changed. I asked.
  </>,
];
const CAPTION_ITEMS = Object.fromEntries(CAPTIONS.map((caption, step) => [String(step), caption]));

function Turn({
  who,
  label,
  shown,
  children,
}: {
  who: "ai" | "me";
  label: string;
  shown: boolean;
  children: ReactNode;
}) {
  return (
    <div className="chat-turn" data-who={who}>
      <span className="chat-label">{label}</span>
      <div className="chat-bubble" data-filled={shown}>
        <div className="chat-text" data-shown={shown} aria-hidden={!shown}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function PushbackDemo() {
  const { step, done, go, reset } = useSoundedGoSteps(PUSHBACK_STEP_MS, CUES);
  const flagged = step >= FLAG_AT;

  return (
    <DemoFrame
      label="A claim from my Postgres chat"
      tag="real chat"
      footer={<>Quotes are copied word for word. &quot;...&quot; marks a cut.</>}
    >
      <div className="gx-figure">
        <div className="chat-log">
          <Turn who="ai" label="AI's claim" shown={step >= CLAIM_AT}>
            <p>
              {CLAIM_BEFORE}
              <mark className="chat-flag" data-on={flagged}>
                {CLAIM_FLAGGED}
              </mark>
              :
            </p>
            <p className="chat-flag-note" data-shown={flagged} aria-hidden={!flagged}>
              ✗ very efficiently compared to what?
            </p>
          </Turn>
          <Turn who="me" label="My pushback" shown={step >= PUSHBACK_AT}>
            <p>
              {PUSHBACK[0]}
              <Cut />
              {PUSHBACK[1]}
              <Cut />
              {PUSHBACK[2]}
            </p>
          </Turn>
          <Turn who="ai" label="AI's new answer" shown={step >= ANSWER_AT}>
            <p>
              {ANSWER_OPENING}
              <b>{ANSWER_BOLD}</b>
              <Cut />
              {ANSWER_ADMITS}
              <span className="chat-admit">{ANSWER_LAST}</span>
            </p>
          </Turn>
        </div>
        <Reserved
          active={String(step)}
          items={CAPTION_ITEMS}
          className="gx-caption"
          tone={step === FLAG_AT ? "bad" : done ? "ok" : "run"}
          announce
        />
        <Actions>
          <Btn onClick={go} disabled={step !== 0}>
            Go
          </Btn>
          <Btn onClick={reset} tone="muted">
            reset
          </Btn>
          <SoundToggle />
        </Actions>
      </div>
    </DemoFrame>
  );
}
