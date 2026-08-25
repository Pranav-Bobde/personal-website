import { useState } from "react";

import { C, DemoFrame } from "./demo-ui";

type Scope = "request" | "query";

const scopeView = {
  request: { heldFor: 100, marginLeft: 0, tone: C.red, api: "yes", served: "1×" },
  query: { heldFor: 18, marginLeft: "30%", tone: C.green, api: "no", served: "~5×" },
} as const;

const phases = [
  { label: "parse", width: 14 },
  { label: "validate", width: 16 },
  { label: "database", width: 18 },
  { label: "external API", width: 34 },
  { label: "respond", width: 18 },
];

export function CheckoutWindowDemo() {
  const [scope, setScope] = useState<Scope>("request");
  const view = scopeView[scope];

  return (
    <DemoFrame
      label="minimum viable checkout — borrow the connection only for database work"
      footer={
        <>
          Parse and validate first. Check out immediately before the query. Commit or roll back,
          then return the connection before slow network work begins.
        </>
      }
    >
      <div className="demo-segmented" aria-label="Connection checkout scope">
        <button
          className="demo-seg"
          data-active={scope === "request"}
          onClick={() => setScope("request")}
          type="button"
        >
          whole request
        </button>
        <button
          className="demo-seg"
          data-active={scope === "query"}
          onClick={() => setScope("query")}
          type="button"
        >
          database only
        </button>
      </div>

      <div className="demo-timeline" aria-label={`Connection held for ${view.heldFor}% of request`}>
        <div className="demo-timeline-label">request</div>
        <div className="demo-phase-row">
          {phases.map((phase) => (
            <span key={phase.label} style={{ width: `${phase.width}%` }}>
              {phase.label}
            </span>
          ))}
        </div>
        <div className="demo-hold-row">
          <span
            className="demo-hold-bar"
            data-scope={scope}
            style={{ width: `${view.heldFor}%`, marginLeft: view.marginLeft }}
          >
            connection checked out
          </span>
        </div>
      </div>

      <div className="demo-stat-grid">
        <div>
          <span>pool occupied</span>
          <strong style={{ color: view.tone }}>{view.heldFor}%</strong>
        </div>
        <div>
          <span>slow API holds DB slot?</span>
          <strong style={{ color: view.tone }}>{view.api}</strong>
        </div>
        <div>
          <span>same pool serves</span>
          <strong>{view.served} requests</strong>
        </div>
      </div>
    </DemoFrame>
  );
}
