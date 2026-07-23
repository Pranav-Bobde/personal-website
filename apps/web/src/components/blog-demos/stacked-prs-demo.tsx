import { useRef, useState } from "react";

import { Btn, C, DemoFrame, Meter, usePrefersReducedMotion } from "./demo-ui";

type StackItem = { id: string; title: string; base: string };

const STACK: StackItem[] = [
  { id: "#1", title: "snooze API", base: "main" },
  { id: "#2", title: "toolbar button", base: "#1" },
  { id: "#3", title: '"Snoozed" view', base: "#2" },
];

const CARD_REST = { border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.accent}`, transform: "none", opacity: 1 };
const CARD_MERGING = { border: `1px solid ${C.green}`, borderLeft: `3px solid ${C.green}`, transform: "translateY(14px)", opacity: 0 };

function StackCard({ pr, indent, merging }: { pr: StackItem; indent: number; merging: boolean }) {
  const v = merging ? CARD_MERGING : CARD_REST;
  return (
    <div
      style={{
        marginLeft: indent * 26,
        padding: "10px 13px",
        borderRadius: 8,
        background: C.panel2,
        transition: "transform .45s cubic-bezier(.4,0,.2,1), opacity .45s, margin-left .4s, border-color .3s",
        ...v,
      }}
    >
      <span style={{ color: C.accent, fontWeight: 700, fontSize: 13 }}>{pr.id}</span>
      <span style={{ color: "#eee", fontSize: 13 }}> {pr.title}</span>
      <span style={{ color: C.faint, fontSize: 11 }}> · base: {pr.base}</span>
    </div>
  );
}

function TrunkBar({ mergedCount, remaining }: { mergedCount: number; remaining: number }) {
  const done = remaining === 0 ? " — done ✓" : "";
  const label =
    mergedCount === 0 ? "waiting for the stack" : `moved ${mergedCount}× cleanly${done}`;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 12px",
        border: `1px solid ${C.green}`,
        borderRadius: 8,
        background: "hsl(150 40% 10% / .4)",
        marginTop: 8,
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: 9, background: C.green, flex: "none" }} />
      <span style={{ fontSize: 13, color: "#fff" }}>main</span>
      <span style={{ marginLeft: "auto", fontSize: 11.5, color: C.green }}>{label}</span>
    </div>
  );
}

function StackView({
  mergedCount,
  merging,
  onMerge,
  onReset,
}: {
  mergedCount: number;
  merging: string | null;
  onMerge: () => void;
  onReset: () => void;
}) {
  const remaining = STACK.length - mergedCount;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column-reverse", gap: 8, minHeight: 176 }}>
        {STACK.map((pr, i) =>
          i < mergedCount ? null : (
            <StackCard key={pr.id} pr={pr} indent={i - mergedCount} merging={pr.id === merging} />
          ),
        )}
      </div>
      <TrunkBar mergedCount={mergedCount} remaining={remaining} />
      <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
        <Btn onClick={onMerge} disabled={remaining === 0 || merging !== null}>
          merge bottom PR
        </Btn>
        <Btn onClick={onReset} tone="muted">
          reset
        </Btn>
      </div>
    </div>
  );
}

function PileView({
  pileWork,
  onPile,
  onReset,
}: {
  pileWork: number;
  onPile: () => void;
  onReset: () => void;
}) {
  const days = pileWork > 1 ? "s" : "";
  return (
    <div>
      <div
        style={{
          padding: "16px 14px",
          border: `1px solid ${C.border}`,
          borderLeft: `3px solid ${C.red}`,
          borderRadius: 8,
          background: C.panel2,
          minHeight: 176,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <div>
          <span style={{ color: C.red, fontWeight: 700, fontSize: 13 }}>#1</span>
          <span style={{ color: "#eee", fontSize: 13 }}> snooze — everything in one branch</span>
        </div>
        <div style={{ fontSize: 12.5, color: C.muted }}>
          {8 + pileWork * 11} files changed · open for {pileWork} day{days}
        </div>
        <div style={{ maxWidth: 260 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: C.muted }}>drift &amp; review pain</span>
            <span style={{ fontSize: 12, color: C.red, fontWeight: 700 }}>
              {pileWork >= 4 ? "unmergeable" : "rising"}
            </span>
          </div>
          <Meter value={Math.min(100, pileWork * 24)} tone={C.red} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
        <Btn onClick={onPile} disabled={pileWork >= 5}>
          keep piling on
        </Btn>
        <Btn onClick={onReset} tone="muted">
          reset
        </Btn>
      </div>
    </div>
  );
}

const STACK_FOOTER = (
  <>
    Each PR is based on the one below it, so every piece stays tiny and reviewable. When the bottom
    merges, the tool <b style={{ color: C.accent }}>auto-rebases the rest down</b> — the stack flows
    into main one clean commit at a time.
  </>
);
const PILE_FOOTER = (
  <>
    One giant branch: <b style={{ color: C.red }}>nobody can review it</b>, and it drifts from main
    the whole time it&rsquo;s open. This is the trap stacking avoids.
  </>
);

export function StackedPrsDemo() {
  const [mode, setMode] = useState<"stack" | "pile">("stack");
  const [mergedCount, setMergedCount] = useState(0);
  const [merging, setMerging] = useState<string | null>(null);
  const [pileWork, setPileWork] = useState(1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduced = usePrefersReducedMotion();

  const mergeBottom = () => {
    const remaining = STACK.slice(mergedCount);
    if (merging || remaining.length === 0) return;
    setMerging(remaining[0].id);
    timer.current = setTimeout(
      () => {
        setMergedCount((n) => n + 1);
        setMerging(null);
      },
      reduced ? 120 : 460,
    );
  };

  const reset = () => {
    if (timer.current) clearTimeout(timer.current);
    setMergedCount(0);
    setMerging(null);
    setPileWork(1);
  };

  return (
    <DemoFrame
      label="stack vs pile — dependent work, two ways"
      footer={mode === "stack" ? STACK_FOOTER : PILE_FOOTER}
    >
      <div
        style={{
          display: "inline-flex",
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: 3,
          marginBottom: 18,
        }}
      >
        {(["stack", "pile"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className="demo-seg"
            data-active={mode === m}
          >
            {m === "stack" ? "stack it" : "pile it"}
          </button>
        ))}
      </div>

      {mode === "stack" ? (
        <StackView mergedCount={mergedCount} merging={merging} onMerge={mergeBottom} onReset={reset} />
      ) : (
        <PileView pileWork={pileWork} onPile={() => setPileWork((n) => Math.min(5, n + 1))} onReset={reset} />
      )}
    </DemoFrame>
  );
}
