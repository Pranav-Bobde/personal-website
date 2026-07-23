import { type CSSProperties, useState } from "react";

import { C, DemoFrame } from "./demo-ui";

type Email = { from: string; subj: string; cat: string };

const EMAILS: Email[] = [
  { from: "Marcus", subj: "Lease — signature", cat: "needs-you" },
  { from: "Stripe", subj: "Payout of $4,120 sent", cat: "receipt" },
  { from: "Dana", subj: "Q3 vendor call", cat: "needs-you" },
  { from: "Figma", subj: "Weekly digest", cat: "newsletter" },
  { from: "LinkedIn", subj: "3 new roles for you", cat: "noise" },
  { from: "Amazon", subj: "Order shipped", cat: "receipt" },
];

const CAT_LABEL: Record<string, string> = {
  receipt: "filed",
  newsletter: "muted",
  noise: "muted",
  "needs-you": "flagged",
};

const HANDLED = EMAILS.filter((e) => e.cat !== "needs-you").length;
const FLAGGED = EMAILS.length - HANDLED;

type RowKind = "unread" | "flagged" | "handled";
const ROW: Record<
  RowKind,
  { opacity: number; dot: string; from: string; left: string; tag: string; showTag: boolean }
> = {
  unread: { opacity: 1, dot: C.accent, from: "#eee", left: "transparent", tag: C.faint, showTag: false },
  flagged: { opacity: 1, dot: "transparent", from: "#eee", left: C.accent, tag: C.accent, showTag: true },
  handled: { opacity: 0.42, dot: "transparent", from: C.faint, left: "transparent", tag: C.faint, showTag: true },
};

function rowKind(cat: string, on: boolean): RowKind {
  if (!on) return "unread";
  return cat === "needs-you" ? "flagged" : "handled";
}

function EmailRow({ email, on }: { email: Email; on: boolean }) {
  const st = ROW[rowKind(email.cat, on)];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 11px",
        borderBottom: `1px solid ${C.border}`,
        borderLeft: `2px solid ${st.left}`,
        opacity: st.opacity,
        transition: "opacity .4s, border-color .4s",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 9, background: st.dot, flex: "none" }} />
      <span style={{ fontSize: 12, color: st.from, minWidth: 52 }}>{email.from}</span>
      <span
        style={{ fontSize: 12, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
      >
        {email.subj}
      </span>
      {st.showTag ? (
        <span
          style={{
            marginLeft: "auto",
            fontSize: 10,
            color: st.tag,
            border: `1px solid ${st.tag === C.accent ? C.accent : C.line}`,
            borderRadius: 5,
            padding: "1px 5px",
            flex: "none",
          }}
        >
          {CAT_LABEL[email.cat]}
        </span>
      ) : null}
    </div>
  );
}

function MiniInbox({ on }: { on: boolean }) {
  const count = on ? `${HANDLED} handled · ${FLAGGED} flagged` : `${EMAILS.length} unread`;
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", background: C.panel }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "7px 11px",
          borderBottom: `1px solid ${C.border}`,
          background: C.panel2,
          fontSize: 12,
        }}
      >
        <span style={{ color: "#fff", fontWeight: 700 }}>Inbox</span>
        <span style={{ marginLeft: "auto", color: on ? C.green : C.faint, fontSize: 11 }}>{count}</span>
      </div>
      {EMAILS.map((e) => (
        <EmailRow key={e.from + e.subj} email={e} on={on} />
      ))}
    </div>
  );
}

const FLIP_ON: CSSProperties = { background: C.accent, border: `2px solid ${C.accent}`, color: "#000" };
const FLIP_OFF: CSSProperties = { background: "transparent", border: `2px solid ${C.line}`, color: C.faint };

function Timeline({ merges, on }: { merges: number; on: boolean }) {
  return (
    <div style={{ position: "relative", height: 46, marginBottom: 6 }}>
      <div style={{ position: "absolute", top: 21, left: 0, right: 0, height: 2, background: C.green }} />
      {Array.from({ length: merges }, (_, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: 15,
            left: `${8 + (i * 74) / Math.max(merges, 5)}%`,
            width: 13,
            height: 13,
            borderRadius: 9,
            background: C.bg,
            border: `2.5px solid ${C.green}`,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          top: 10,
          right: "2%",
          width: 24,
          height: 24,
          borderRadius: 6,
          display: "grid",
          placeItems: "center",
          fontSize: 13,
          fontWeight: 700,
          transition: "all .3s",
          ...(on ? FLIP_ON : FLIP_OFF),
        }}
      >
        ✓
      </div>
    </div>
  );
}

function FlagSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className="demo-switch" data-on={on} aria-pressed={on}>
      <span className="demo-switch-track">
        <span className="demo-switch-thumb" />
      </span>
      <span style={{ fontSize: 13 }}>
        autoTriage <b style={{ color: on ? C.accent : C.muted }}>{on ? "ON" : "OFF"}</b>
      </span>
    </button>
  );
}

export function FeatureFlagDemo() {
  const [on, setOn] = useState(false);
  const [merges, setMerges] = useState(4);
  const status = on ? "released → flag ON" : "behind flag: OFF (merged, dormant)";

  return (
    <DemoFrame
      label="feature flag — merged is not released"
      footer={
        <>
          The code merged to main days ago behind <code style={{ color: C.amber }}>autoTriage:
          false</code> — integrated, but invisible. Shipping is <b style={{ color: C.accent }}>one
          switch</b>, decoupled from every merge. Flip it back and it&rsquo;s an instant rollback —
          no revert, no redeploy.
        </>
      }
    >
      <div
        className="demo-flag-grid"
        style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.1fr)", gap: 18 }}
      >
        <div>
          <div
            style={{ fontSize: 11.5, color: C.faint, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}
          >
            commits to main
          </div>
          <Timeline merges={merges} on={on} />
          <div style={{ fontSize: 11.5, color: on ? C.accent : C.amber, marginBottom: 20 }}>{status}</div>
          <FlagSwitch on={on} onToggle={() => setOn((v) => !v)} />
          <button
            type="button"
            onClick={() => setMerges((n) => Math.min(8, n + 1))}
            disabled={merges >= 8}
            className="demo-btn"
            data-tone="muted"
            style={{ marginTop: 12, display: "block" }}
          >
            merge a commit
          </button>
        </div>
        <MiniInbox on={on} />
      </div>
    </DemoFrame>
  );
}
