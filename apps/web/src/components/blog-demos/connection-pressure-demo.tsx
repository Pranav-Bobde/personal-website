import { useState } from "react";

import { Btn, C, DemoFrame, Meter } from "./demo-ui";

const SWEET_SPOT = 12;

function pressureFor(connections: number) {
  const overload = Math.max(0, connections - SWEET_SPOT);
  const contention = 1 + overload * 0.07;
  const throughput = Math.round((Math.min(connections, SWEET_SPOT) * 8) / contention);
  const latency = Math.round(55 + overload * overload * 1.9);
  return { overload, throughput, latency };
}

function pressureTone(connections: number, overload: number) {
  if (overload === 0) return C.green;
  return connections <= 22 ? C.amber : C.red;
}

function BackendCloud({ connections, tone }: { connections: number; tone: string }) {
  const visibleBackends = Math.min(connections, 32);
  const hiddenBackends = connections - visibleBackends;
  return (
    <div className="demo-backend-cloud">
      {Array.from({ length: visibleBackends }, (_, index) => {
        const overloaded = index >= SWEET_SPOT;
        return (
          <span
            className="demo-backend-dot"
            data-overloaded={overloaded}
            key={index}
            style={{ background: overloaded ? tone : C.green }}
          />
        );
      })}
      <small>{hiddenBackends > 0 ? `+${hiddenBackends}` : ""}</small>
    </div>
  );
}

function PressureVerdict({ connections, overload }: { connections: number; overload: number }) {
  const healthy = overload === 0;
  const text = healthy
    ? `${SWEET_SPOT - connections} useful slots remain`
    : `${overload} backends now add contention`;
  return (
    <div className="demo-verdict" data-tone={healthy ? "good" : "warn"}>
      {text}
    </div>
  );
}

export function ConnectionPressureDemo() {
  const [connections, setConnections] = useState(8);
  const { overload, throughput, latency } = pressureFor(connections);
  const tone = pressureTone(connections, overload);

  return (
    <DemoFrame
      label="connection pressure — add concurrency and watch the tradeoff"
      footer={
        <>
          After the useful parallelism is saturated, extra backends mostly add scheduling and
          shared-state work.
          <b style={{ color: tone }}> More connections stop meaning more throughput.</b>
        </>
      }
    >
      <div className="demo-two-col">
        <div>
          <div className="demo-control-heading">
            <span>open connections</span>
            <strong style={{ color: tone }}>{connections}</strong>
          </div>
          <input
            className="demo-range"
            type="range"
            min="2"
            max="40"
            value={connections}
            onChange={(event) => setConnections(Number(event.currentTarget.value))}
            aria-label="Open Postgres connections"
          />
          <div className="demo-actions demo-range-actions">
            <Btn
              onClick={() => setConnections((value) => Math.max(2, value - 4))}
              disabled={connections === 2}
              tone="muted"
            >
              fewer
            </Btn>
            <Btn
              onClick={() => setConnections((value) => Math.min(40, value + 4))}
              disabled={connections === 40}
            >
              more
            </Btn>
          </div>
          <div
            className="demo-process-flow"
            aria-label={`${connections} client connections create ${connections} Postgres backend processes`}
          >
            <div className="demo-process-node">clients</div>
            <span aria-hidden="true">→</span>
            <div className="demo-process-node">postmaster</div>
            <span aria-hidden="true">→</span>
            <BackendCloud connections={connections} tone={tone} />
          </div>
          <p className="demo-caption">
            One client connection maps to one server backend process. The first {SWEET_SPOT} are
            useful parallelism here; the rest compete for the same machine.
          </p>
        </div>

        <div className="demo-stat-stack">
          <div>
            <div className="demo-control-heading">
              <span>throughput</span>
              <strong>{throughput} q/s</strong>
            </div>
            <Meter value={throughput} tone={C.green} />
          </div>
          <div>
            <div className="demo-control-heading">
              <span>query latency</span>
              <strong style={{ color: tone }}>{latency} ms</strong>
            </div>
            <Meter value={Math.min(100, latency / 5)} tone={tone} />
          </div>
          <PressureVerdict connections={connections} overload={overload} />
        </div>
      </div>
    </DemoFrame>
  );
}
