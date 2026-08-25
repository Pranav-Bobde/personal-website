import { useState } from "react";

import { Btn, DemoFrame } from "./demo-ui";

type Isolation = "read-committed" | "repeatable-read";

const EVENTS = ["A reads row", "B updates + commits", "A reads row again"];
const isolationView = {
  "read-committed": {
    label: "Read Committed",
    secondRead: "$200",
    explanation: "each statement gets a fresh snapshot",
  },
  "repeatable-read": {
    label: "Repeatable Read",
    secondRead: "$100",
    explanation: "the transaction keeps its original snapshot",
  },
} as const;

function MvccOutcome({ isolation, step }: { isolation: Isolation; step: number }) {
  if (step !== 3) return null;
  const view = isolationView[isolation];
  return (
    <div className="demo-verdict" data-tone="good">
      A sees {view.secondRead}: {view.explanation}.
    </div>
  );
}

export function MvccVisibilityDemo() {
  const [isolation, setIsolation] = useState<Isolation>("read-committed");
  const [step, setStep] = useState(0);
  const view = isolationView[isolation];

  return (
    <DemoFrame
      label="MVCC visibility — same row, different snapshots"
      footer={
        <>
          MVCC keeps multiple row versions. Isolation decides which committed version a transaction
          may see, not whether that older version still exists.
        </>
      }
    >
      <div className="demo-segmented" aria-label="Transaction isolation">
        {(["read-committed", "repeatable-read"] as const).map((value) => (
          <button
            className="demo-seg"
            data-active={isolation === value}
            key={value}
            onClick={() => {
              setIsolation(value);
              setStep(0);
            }}
            type="button"
          >
            {isolationView[value].label}
          </button>
        ))}
      </div>

      <div className="demo-version-stage">
        <div className="demo-tx-lane">
          <strong>Transaction A</strong>
          <span data-active={step >= 1}>read → $100</span>
          <span data-active={step >= 3}>read again → {step >= 3 ? view.secondRead : "?"}</span>
        </div>
        <div className="demo-version-store" aria-label="Row versions">
          <span className="demo-version" data-visible={true}>
            v1 · $100
          </span>
          <span className="demo-version" data-visible={step >= 2}>
            v2 · $200
          </span>
        </div>
        <div className="demo-tx-lane">
          <strong>Transaction B</strong>
          <span data-active={step >= 2}>update → $200</span>
          <span data-active={step >= 2}>commit ✓</span>
        </div>
      </div>

      <div className="demo-control-row">
        <span className="demo-caption">{["Ready", ...EVENTS][step]}</span>
        <div className="demo-actions">
          <Btn onClick={() => setStep((value) => Math.min(3, value + 1))} disabled={step === 3}>
            next event
          </Btn>
          <Btn onClick={() => setStep(0)} disabled={step === 0} tone="muted">
            reset
          </Btn>
        </div>
      </div>
      <MvccOutcome isolation={isolation} step={step} />
    </DemoFrame>
  );
}
