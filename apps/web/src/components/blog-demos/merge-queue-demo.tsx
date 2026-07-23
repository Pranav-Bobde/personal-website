import { useEffect, useRef, useState } from "react";

import { Btn, C, DemoFrame, usePrefersReducedMotion } from "./demo-ui";

type Phase = "idle" | "rebasing" | "testing" | "merged" | "ejected";

const PRS = [
  { id: "#1", title: "add snooze API" },
  { id: "#2", title: "snooze toolbar button" },
  { id: "#3", title: '"Snoozed" folder view' },
];

const PHASE_META: Record<Phase, { text: string; color: string }> = {
  idle: { text: "queued", color: C.muted },
  rebasing: { text: "rebasing on latest", color: C.amber },
  testing: { text: "testing…", color: C.amber },
  merged: { text: "✓ merged", color: C.green },
  ejected: { text: "✗ conflict — ejected", color: C.red },
};

const PHASE_STYLE: Record<Phase, { border: string; bg: string }> = {
  idle: { border: C.border, bg: C.panel },
  rebasing: { border: C.border, bg: C.panel },
  testing: { border: C.border, bg: C.panel },
  merged: { border: C.green, bg: C.panel },
  ejected: { border: C.red, bg: "hsl(2 60% 12% / .5)" },
};

const SHOW_BASE = new Set<Phase>(["rebasing", "testing", "merged"]);

function Spinner() {
  return (
    <span
      aria-hidden
      style={{
        width: 11,
        height: 11,
        borderRadius: 9,
        border: `2px solid ${C.amber}`,
        borderTopColor: "transparent",
        animation: "demoSpin .7s linear infinite",
        display: "inline-block",
      }}
    />
  );
}

function MainHead({ merged }: { merged: string[] }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 12px",
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        background: C.panel2,
        marginBottom: 14,
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: 9, background: C.green, flex: "none" }} />
      <span style={{ fontSize: 13, color: "#fff" }}>
        main <span style={{ color: C.faint }}>@</span>{" "}
        <span style={{ color: C.green }}>{merged.length ? merged.join(" + ") : "base"}</span>
      </span>
      <span style={{ marginLeft: "auto", fontSize: 11, color: C.green }}>always green ✓</span>
    </div>
  );
}

function BaseChain({ phases }: { phases: Phase[] }) {
  const secondEjected = phases[1] === "ejected";
  const chain = PRS.filter((_, index) => !(index === 1 && secondEjected));

  const parentFor = (id: string) => {
    if (id === "#1") return "main";
    if (id === "#2") return "#1";
    return secondEjected ? "#1" : "#2";
  };

  const depthFor = (id: string) => {
    if (id === "#1") return 0;
    if (id === "#2") return 1;
    return secondEjected ? 1 : 2;
  };

  return (
    <div
      aria-live="polite"
      style={{
        padding: "10px 12px",
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        background: C.panel2,
        marginBottom: 14,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          marginBottom: 9,
          color: C.faint,
          fontSize: 10,
          letterSpacing: ".08em",
          textTransform: "uppercase",
        }}
      >
        effective test base
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {chain.map((pr) => {
          const parent = parentFor(pr.id);
          const depth = depthFor(pr.id);
          return (
            <div
              key={pr.id}
              data-chain-node={pr.id}
              data-parent={parent}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                width: "fit-content",
                maxWidth: `calc(100% - ${depth * 24}px)`,
                color: C.muted,
                fontSize: 11.5,
                transform: `translateX(${depth * 24}px)`,
                transition: "transform .42s cubic-bezier(.22, 1, .36, 1)",
              }}
            >
              <span aria-hidden style={{ color: C.faint }}>
                {depth ? "↳" : "●"}
              </span>
              <b style={{ color: C.accent }}>{pr.id}</b>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                base → <b style={{ color: "#eee" }}>{parent}</b>
              </span>
            </div>
          );
        })}
      </div>

      {secondEjected ? (
        <div
          className="demo-chain-ejected"
          style={{
            marginTop: 9,
            paddingTop: 8,
            borderTop: `1px dashed ${C.border}`,
            color: C.red,
            fontSize: 11.5,
          }}
        >
          <b>#2 ejected</b>
          <span style={{ color: C.muted }}> → #3 now bases on </span>
          <b style={{ color: C.green }}>#1</b>
        </div>
      ) : null}
    </div>
  );
}

function QueueRow({
  pr,
  phase,
  base,
  dim,
}: {
  pr: { id: string; title: string };
  phase: Phase;
  base: string;
  dim: boolean;
}) {
  const meta = PHASE_META[phase];
  const s = PHASE_STYLE[phase];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "3rem 1fr auto",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        borderStyle: "solid",
        borderColor: s.border,
        borderWidth: "1px 1px 1px 3px",
        borderRadius: 8,
        background: s.bg,
        opacity: dim ? 0.5 : 1,
        transition: "border-color .3s, background .3s, opacity .3s",
      }}
    >
      <span style={{ fontWeight: 700, color: C.accent }}>{pr.id}</span>
      <span style={{ minWidth: 0 }}>
        <span style={{ fontSize: 13, color: "#eee" }}>{pr.title}</span>
        <span
          style={{
            display: "block",
            fontSize: 11,
            color: C.faint,
            marginTop: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {SHOW_BASE.has(phase) ? `base: ${base}` : " "}
        </span>
      </span>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: meta.color,
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        {phase === "testing" ? <Spinner /> : null}
        {meta.text}
      </span>
    </div>
  );
}

export function MergeQueueDemo() {
  const [phases, setPhases] = useState<Phase[]>(["idle", "idle", "idle"]);
  const [merged, setMerged] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [clash, setClash] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const reduced = usePrefersReducedMotion();

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const wait = (ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, reduced ? Math.min(ms, 120) : ms));
  };
  const setPhase = (i: number, p: Phase) =>
    setPhases((prev) => prev.map((x, j) => (j === i ? p : x)));

  const run = () => {
    clearTimers();
    setRunning(true);
    setMerged([]);
    setPhases(["idle", "idle", "idle"]);
    const willClash = clash;
    const done: string[] = [];

    const step = (i: number) => {
      if (i >= PRS.length) {
        setRunning(false);
        return;
      }
      setPhase(i, "rebasing");
      wait(620, () => {
        setPhase(i, "testing");
        wait(1000, () => {
          const ejected = i === 1 && willClash;
          setPhase(i, ejected ? "ejected" : "merged");
          if (!ejected) {
            done.push(PRS[i].id);
            setMerged([...done]);
          }
          wait(520, () => step(i + 1));
        });
      });
    };
    step(0);
  };

  const reset = () => {
    clearTimers();
    setRunning(false);
    setMerged([]);
    setPhases(["idle", "idle", "idle"]);
  };

  const baseLabel = (i: number) => {
    const ahead = merged.filter((id) => PRS.findIndex((p) => p.id === id) < i);
    return ahead.length ? `main + ${ahead.join(" + ")}` : "main";
  };

  return (
    <DemoFrame
      label="merge queue — re-tests each PR on the real, current base"
      footer={
        <>
          Toggle the clash and watch: <b style={{ color: C.green }}>#2 passed its own checks</b>{" "}
          earlier, but combined with #1 it breaks — so the queue{" "}
          <b style={{ color: C.red }}>ejects it before merge</b> instead of letting it poison main. A
          PR tested against a stale base can never sneak in.
        </>
      }
    >
      <MainHead merged={merged} />
      <BaseChain phases={phases} />

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {PRS.map((pr, i) => (
          <QueueRow
            key={pr.id}
            pr={pr}
            phase={phases[i]}
            base={baseLabel(i)}
            dim={phases[i] === "idle" && running}
          />
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16, flexWrap: "wrap" }}>
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12.5,
            color: C.muted,
            cursor: running ? "default" : "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={clash}
            disabled={running}
            onChange={(e) => setClash(e.target.checked)}
            className="demo-check"
          />
          make #2 clash with #1
        </label>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <Btn onClick={run} disabled={running}>
            {running ? "running…" : "run merge queue"}
          </Btn>
          <Btn onClick={reset} tone="muted">
            reset
          </Btn>
        </div>
      </div>
    </DemoFrame>
  );
}
