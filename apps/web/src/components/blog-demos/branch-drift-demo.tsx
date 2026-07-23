import { useState } from "react";

import { Btn, C, DemoFrame, Meter } from "./demo-ui";

const GAP = 74;
const START = 44;
const Y_MAIN = 112;
const Y_BRANCH = 44;
const MAX_DRIFT = 6;
const VBW = 600;

function driftTone(drift: number) {
  if (drift === 0) return C.green;
  if (drift <= 2) return C.amber;
  return C.red;
}

function DriftGraph({ drift }: { drift: number }) {
  const baseX = START + GAP;
  const mainNodes = 2 + drift;
  const lastMainX = START + (mainNodes - 1) * GAP;
  const branchX1 = baseX + GAP * 0.92;
  const branchX2 = branchX1 + GAP * 0.95;

  return (
    <svg
      viewBox={`0 0 ${VBW} 150`}
      style={{ width: "100%", maxWidth: VBW, height: "auto", display: "block" }}
      role="img"
      aria-label={`main is ${drift} commits ahead of your branch base`}
    >
      {drift > 0 ? (
        <rect
          x={baseX + 12}
          y={Y_MAIN - 22}
          width={lastMainX - baseX - 12}
          height={44}
          rx={7}
          fill={C.amber}
          opacity={0.12}
          style={{ transition: "all .4s" }}
        />
      ) : null}

      <line x1={START} y1={Y_MAIN} x2={lastMainX} y2={Y_MAIN} stroke={C.green} strokeWidth={2.5} style={{ transition: "all .4s" }} />
      <path
        d={`M ${baseX} ${Y_MAIN} C ${baseX + 24} ${Y_MAIN}, ${branchX1 - 24} ${Y_BRANCH}, ${branchX1} ${Y_BRANCH} L ${branchX2} ${Y_BRANCH}`}
        fill="none"
        stroke={C.accent}
        strokeWidth={2.5}
      />

      {Array.from({ length: mainNodes }, (_, i) => (
        <circle
          key={`m${i}`}
          cx={START + i * GAP}
          cy={Y_MAIN}
          r={7}
          fill={C.green}
          stroke={C.bg}
          strokeWidth={3}
          className={i === mainNodes - 1 && drift > 0 ? "drift-pop" : undefined}
        />
      ))}
      {[branchX1, branchX2].map((x, i) => (
        <circle key={`b${i}`} cx={x} cy={Y_BRANCH} r={7} fill={C.accent} stroke={C.bg} strokeWidth={3} />
      ))}

      <text x={START - 2} y={Y_MAIN + 28} fill={C.green} fontSize={13}>
        main
      </text>
      <text x={branchX1 - 6} y={Y_BRANCH - 14} fill={C.accent} fontSize={13}>
        your branch
      </text>
      <text x={baseX} y={Y_MAIN + 28} fill={C.muted} fontSize={12} textAnchor="middle">
        ↑ fork
      </text>
    </svg>
  );
}

export function BranchDriftDemo() {
  // How many commits main is ahead of the commit your branch forked from.
  const [drift, setDrift] = useState(2);
  const tone = driftTone(drift);
  const status = drift === 0 ? "in sync" : `${drift} behind`;

  return (
    <DemoFrame
      label="branch drift — main keeps moving after you fork"
      footer={
        <>
          Your branch is a diff against <b style={{ color: "#fff" }}>one frozen commit</b>. Every
          push to main widens the gap you&rsquo;ll reconcile later.{" "}
          <b style={{ color: tone }}>Sync often</b> and it never grows teeth.
        </>
      }
    >
      <div style={{ overflowX: "auto" }}>
        <DriftGraph drift={drift} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "14px 20px", marginTop: 12 }}>
        <div style={{ minWidth: 150, flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: C.muted }}>conflict risk</span>
            <span style={{ fontSize: 12, color: tone, fontWeight: 700 }}>{status}</span>
          </div>
          <Meter value={Math.min(100, drift * 16.5)} tone={tone} />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Btn onClick={() => setDrift((d) => Math.min(MAX_DRIFT, d + 1))} disabled={drift >= MAX_DRIFT}>
            teammate pushes to main
          </Btn>
          <Btn onClick={() => setDrift(0)} tone="muted" disabled={drift === 0}>
            sync my branch
          </Btn>
        </div>
      </div>
    </DemoFrame>
  );
}
