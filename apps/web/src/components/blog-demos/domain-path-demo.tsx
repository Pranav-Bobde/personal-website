import { useState, type CSSProperties, type ReactNode } from "react";

import { Actions, Reserved, Segments } from "./commit-graph";
import { Btn, DemoFrame } from "./demo-ui";
import { SoundToggle, useSoundedGoSteps, type SoundCue } from "./demo-sound";

type Mode = "none" | "record";
type RowState = "idle" | "active" | "ok" | "bad" | "skipped";
type Frame = {
  /* The row the address has reached. null before Go. */
  at: number | null;
  states: [RowState, RowState, RowState, RowState];
  caption: ReactNode;
  tone?: "ok" | "bad";
};

const MODE_OPTIONS: { id: Mode; label: string }[] = [
  { id: "none", label: "no record" },
  { id: "record", label: "record added" },
];
const MODES = MODE_OPTIONS.map((option) => option.id);

const ADDRESS = <code>yourname.xyz</code>;

const TYPED: Frame = {
  at: 0,
  states: ["active", "idle", "idle", "idle"],
  caption: <>You type the address. The browser has to find out where that name lives.</>,
};
const LOOKING_UP: Frame = {
  at: 1,
  states: ["ok", "active", "idle", "idle"],
  caption: <>The browser asks DNS, the internet&apos;s phone book, for this name&apos;s record.</>,
};

export const DOMAIN_FRAMES: Record<Mode, Frame[]> = {
  none: [
    {
      at: null,
      states: ["idle", "idle", "idle", "idle"],
      caption: <>You bought {ADDRESS}, but added no record at your registrar.</>,
    },
    TYPED,
    LOOKING_UP,
    {
      at: 1,
      states: ["ok", "bad", "skipped", "skipped"],
      tone: "bad",
      caption: (
        <>
          <b>Stopped at DNS.</b> No record means nothing says where this name points. The browser shows
          &quot;This site can&apos;t be reached&quot;, and Vercel never hears about it.
        </>
      ),
    },
  ],
  record: [
    {
      at: null,
      states: ["idle", "idle", "idle", "idle"],
      caption: <>Same address. This time your registrar has the record you copied from Vercel.</>,
    },
    TYPED,
    LOOKING_UP,
    {
      at: 1,
      states: ["ok", "ok", "idle", "idle"],
      caption: <>The record is there, and it sends the browser to Vercel.</>,
    },
    {
      at: 2,
      states: ["ok", "ok", "active", "idle"],
      caption: <>Vercel checks which project this address belongs to.</>,
    },
    {
      at: 2,
      states: ["ok", "ok", "ok", "idle"],
      caption: <>It matches yours. Vercel answers with the SSL certificate it made for you.</>,
    },
    {
      at: 3,
      states: ["ok", "ok", "ok", "ok"],
      tone: "ok",
      caption: (
        <>
          <b>{ADDRESS} loads</b> over <code>https</code>, on your own domain.
        </>
      ),
    },
  ],
};

/* How long each frame holds after Go, one entry per frame between the first and the last. */
export const DOMAIN_STEP_MS: Record<Mode, readonly number[]> = {
  none: [1300, 1700],
  record: [1300, 1700, 1300, 1500, 1500],
};

const CUES: Record<Mode, readonly (SoundCue | null)[]> = {
  none: [null, "tick", "running", "failure"],
  record: [null, "tick", "running", "note", "running", "pass", "success"],
};

const ROWS: {
  name: string;
  detail: Record<Mode, ReactNode>;
  status: Partial<Record<RowState, string>>;
}[] = [
  {
    name: "Browser",
    detail: {
      none: <>You type {ADDRESS}.</>,
      record: <>You type {ADDRESS}.</>,
    },
    status: { active: "● asking", ok: "✓ asked" },
  },
  {
    name: "DNS record",
    detail: {
      none: <>At your registrar: no record for this name.</>,
      record: <>At your registrar: a CNAME or A record, set to the value Vercel shows you.</>,
    },
    status: { active: "● looking up", ok: "✓ record found", bad: "✗ no record found" },
  },
  {
    name: "Vercel",
    detail: {
      none: <>Hosts your project and sets up SSL for you.</>,
      record: <>Hosts your project and sets up SSL for you.</>,
    },
    status: { active: "● checking", ok: "✓ matched, SSL ready", skipped: "not reached" },
  },
  {
    name: "Your site",
    detail: {
      none: <>Opens at https://yourname.xyz with the padlock.</>,
      record: <>Opens at https://yourname.xyz with the padlock.</>,
    },
    status: { ok: "✓ live", skipped: "not reached" },
  },
];

const stepItems = (read: (frame: Frame, index: number, mode: Mode) => ReactNode) =>
  Object.fromEntries(
    MODES.flatMap((mode) =>
      DOMAIN_FRAMES[mode].map((frame, index) => [`${mode}-${index}`, read(frame, index, mode)]),
    ),
  );

const CAPTION_ITEMS = stepItems((frame, index, mode) =>
  index === 0 ? (
    frame.caption
  ) : (
    <>
      <span className="gx-step">
        step {index} of {DOMAIN_FRAMES[mode].length - 1}
      </span>{" "}
      {frame.caption}
    </>
  ),
);

export function DomainPathDemo() {
  const [mode, setMode] = useState<Mode>("none");
  const { step, go, reset, rewind } = useSoundedGoSteps(DOMAIN_STEP_MS[mode], CUES[mode]);
  const frame = DOMAIN_FRAMES[mode][step];
  const key = `${mode}-${step}`;

  const switchMode = (next: Mode) => {
    rewind();
    setMode(next);
  };

  return (
    <DemoFrame label="Where an address goes when you type it" tag="top to bottom">
      <div className="gx-figure">
        <div className="dp-wrap">
          <span
            className="dp-packet"
            aria-hidden
            data-state={frame.at === null ? "idle" : frame.states[frame.at]}
            style={{ "--dp-row": frame.at ?? 0 } as CSSProperties}
          />
          <ol className="dp-path" aria-label="The path from your browser to your site">
            {ROWS.map((row, index) => {
              const state = frame.states[index];
              return (
                <li key={row.name} className="dp-row" data-row={row.name} data-state={state}>
                  <span className="dp-dot" aria-hidden />
                  <div className="dp-body">
                    <div className="dp-head">
                      <span className="dp-name">{row.name}</span>
                      <span className="dp-status">{row.status[state] ?? ""}</span>
                    </div>
                    <Reserved
                      active={mode}
                      items={{ none: row.detail.none, record: row.detail.record }}
                      className="dp-detail"
                    />
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
        <Reserved active={key} items={CAPTION_ITEMS} className="gx-caption" tone={frame.tone ?? "run"} announce />
        <Actions>
          <Segments options={MODE_OPTIONS} value={mode} onChange={switchMode} label="DNS record" />
        </Actions>
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
