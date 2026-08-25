import { useState } from "react";

import { Btn, DemoFrame } from "./demo-ui";

type Mode = "repeatable" | "serializable";

const labels: Record<Mode, string> = {
  repeatable: "Repeatable Read",
  serializable: "Serializable",
};

const eventTitles = [
  "Invariant established",
  "Tx A reads both accounts",
  "Tx B reads both accounts",
  "Tx A writes Account A",
  "Tx B writes Account B",
] as const;

const eventCount = eventTitles.length;

const eventDetailsByMode = {
  repeatable: [
    "A=$600 and B=$600. The application predicate is A + B ≥ $500, so the current snapshot passes. A single $600 withdrawal would still leave $600 committed; nothing has been read or written yet.",
    "Tx A reads both rows and stores its read snapshot (S_A): A=$600, B=$600. Its local check passes, so it plans to withdraw $600 from Account A.",
    "Tx B reads both rows and stores its own read snapshot (S_B): the same A=$600, B=$600. Its local check also passes. Both transactions now depend on the two-row predicate.",
    "Tx A updates Account A from $600 to $0 and commits. Tx B had already read Account A, so a conceptual read→write edge exists; Repeatable Read does not run the SSI monitor that would track it.",
    "Tx B updates Account B from $600 to $0. There is no direct row conflict with Tx A, and Repeatable Read does not run Serializable Snapshot Isolation cycle detection, so B commits. The final total becomes $0: the rule is broken.",
  ],
  serializable: [
    "A=$600 and B=$600. The application predicate is A + B ≥ $500, so the current snapshot passes. A single $600 withdrawal would still leave $600 committed; nothing has been read or written yet.",
    "Tx A reads both rows and stores its read snapshot (S_A): A=$600, B=$600. Its local check passes, so it plans to withdraw $600 from Account A.",
    "Tx B reads both rows and stores its own read snapshot (S_B): the same A=$600, B=$600. Its local check also passes. Both transactions now depend on the two-row predicate.",
    "Tx A updates Account A from $600 to $0 and commits. Tx B had already read Account A, so Serializable records the first read→write edge in its SSI conflict graph.",
    "Tx B attempts Account B: $600 → $0. Serializable sees both crossed dependencies, raises SQLSTATE 40001, rolls back B's attempted write, and leaves committed state A=$0, B=$600. The application must retry B.",
  ],
} as const satisfies Record<Mode, readonly string[]>;

const traceLines = {
  repeatable: [
    "-- application predicate: Account A + Account B >= 500  ->  true",
    "Tx A> SELECT balance FROM accounts WHERE id IN ('A','B')  ->  S_A = ($600, $600); after A-$600: total $600 >= $500 -> true",
    "Tx B> SELECT balance FROM accounts WHERE id IN ('A','B')  ->  S_B = ($600, $600); after B-$600: total $600 >= $500 -> true",
    "Tx A> UPDATE accounts SET balance = 0 WHERE id = 'A'; COMMIT  ->  edge exists: B read A -> A wrote A; no SSI tracking",
    "Tx B> UPDATE accounts SET balance = 0 WHERE id = 'B'; COMMIT  ->  edge exists: A read B -> B wrote B; no SSI check",
  ],
  serializable: [
    "-- application predicate: Account A + Account B >= 500  ->  true",
    "Tx A> SELECT balance FROM accounts WHERE id IN ('A','B')  ->  S_A = ($600, $600); after A-$600: total $600 >= $500 -> true",
    "Tx B> SELECT balance FROM accounts WHERE id IN ('A','B')  ->  S_B = ($600, $600); after B-$600: total $600 >= $500 -> true",
    "Tx A> UPDATE accounts SET balance = 0 WHERE id = 'A'; COMMIT  ->  SSI tracks edge: B read A -> A wrote A",
    "Tx B> UPDATE accounts SET balance = 0 WHERE id = 'B'  ->  aborted (SQLSTATE 40001); ROLLBACK -> SSI rejects edge: A read B -> B wrote B",
  ],
} as const satisfies Record<Mode, readonly string[]>;

function getEventDetail(mode: Mode, step: number) {
  return eventDetailsByMode[mode][step] ?? eventDetailsByMode[mode][0];
}

function getEventState(index: number, step: number) {
  if (index < step) {
    return "complete";
  }

  return index === step ? "current" : "upcoming";
}

function getTotal(mode: Mode, step: number) {
  if (step < 3) {
    return 1200;
  }

  return mode === "serializable" || step === 3 ? 600 : 0;
}

const isolationResults = {
  repeatable: [
    "no dependency yet",
    "no dependency yet",
    "no dependency yet",
    "edge exists; no SSI tracking",
    "no SSI check; cycle commits",
  ],
  serializable: [
    "no dependency yet",
    "no dependency yet",
    "no dependency yet",
    "SSI tracks first edge",
    "SSI rejects dangerous structure",
  ],
} as const satisfies Record<Mode, readonly string[]>;

function getIsolationResult(mode: Mode, step: number) {
  return isolationResults[mode][Math.min(step, eventCount - 1)] ?? isolationResults[mode][0];
}

function getRuleLabel(total: number) {
  return total >= 500 ? "rule holds" : "rule broken";
}

export function WriteSkewDemo() {
  const [mode, setMode] = useState<Mode>("repeatable");
  const [step, setStep] = useState(0);
  const total = getTotal(mode, step);

  return (
    <DemoFrame
      label="write skew — SQL trace of the state transition"
      footer="Read this as one database trace: snapshot → local check → write → dependency → commit decision. Repeatable Read lets the cycle commit; Serializable rejects it with SQLSTATE 40001."
    >
      <div className="write-skew-sql-trace">
        <div className="write-skew-sql-trace-notation" aria-label="SQL trace notation guide">
          <span>notation guide</span>
          <dl>
            <div>
              <dt>S_A = Tx A's read snapshot</dt>
              <dd>What Tx A saw when it read Account A and Account B.</dd>
            </div>
            <div>
              <dt>S_B = Tx B's read snapshot</dt>
              <dd>What Tx B saw at its own read, often the same values.</dd>
            </div>
            <div>
              <dt>Tx B read Account A → Tx A writes Account A</dt>
              <dd>First crossed dependency: a prior read meets another transaction's later write.</dd>
            </div>
            <div>
              <dt>Tx A read Account B → Tx B writes Account B</dt>
              <dd>Second crossed dependency: together, these two edges form the cycle.</dd>
            </div>
          </dl>
        </div>

        <div className="write-skew-sql-trace-controls">
          <div className="demo-segmented" role="group" aria-label="Write skew isolation mode">
            {(Object.keys(labels) as Mode[]).map((value) => (
              <button
                key={value}
                type="button"
                className="demo-seg"
                data-active={mode === value}
                aria-pressed={mode === value}
                onClick={() => {
                  setMode(value);
                  setStep(0);
                }}
              >
                {labels[value]}
              </button>
            ))}
          </div>
          <span className="write-skew-sql-trace-step">
            event {step + 1} / {eventCount}
          </span>
        </div>

        <div className="write-skew-sql-trace-current" aria-live="polite">
          <span>current event</span>
          <strong>{eventTitles[step]}</strong>
          <p>{getEventDetail(mode, step)}</p>
        </div>

        <ol className="write-skew-trace" aria-label="SQL event trace">
          {traceLines[mode].map((line, index) => (
            <li
              key={line}
              data-state={getEventState(index, step)}
              aria-current={index === step ? "step" : undefined}
              aria-label={`Event ${index + 1}: ${eventTitles[index] ?? "database event"} — ${getEventState(index, step)}`}
            >
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <code>{line}</code>
            </li>
          ))}
        </ol>

        <div className="write-skew-sql-trace-outcome">
          <div>
            <span>committed balance</span>
            <strong>${total}</strong>
          </div>
          <div>
            <span>isolation handling</span>
            <strong>{getIsolationResult(mode, step)}</strong>
          </div>
          <div>
            <span>invariant</span>
            <strong className={total >= 500 ? "write-skew-good" : "write-skew-bad"}>
              {getRuleLabel(total)}
            </strong>
          </div>
        </div>

        <div className="write-skew-sql-trace-actions">
          <p>Advance one database event at a time. Earlier log lines stay visible as context.</p>
          <div className="demo-actions">
            <Btn
              onClick={() => setStep((value) => Math.min(eventCount - 1, value + 1))}
              disabled={step === eventCount - 1}
            >
              next event
            </Btn>
            <Btn onClick={() => setStep(0)} disabled={step === 0} tone="muted">
              reset
            </Btn>
          </div>
        </div>
      </div>
    </DemoFrame>
  );
}
