import type { ReactNode } from "react";

/* Shared palette + chrome for the in-post interactive demos.
   Terminal aesthetic: near-black panels, cyan accent, Space Mono (inherited). */
export const C = {
  accent: "hsl(180 100% 45%)", // cyan — the site's signature
  green: "hsl(150 62% 47%)", // merged / healthy
  amber: "hsl(42 95% 58%)", // waiting / drift
  red: "hsl(2 72% 58%)", // conflict / ejected
  muted: "hsl(0 0% 63.9%)",
  faint: "hsl(0 0% 42%)",
  border: "hsl(0 0% 18%)",
  line: "hsl(0 0% 24%)",
  panel: "hsl(0 0% 5.5%)",
  panel2: "hsl(0 0% 8.5%)",
  bg: "hsl(0 0% 3.9%)",
};

export function DemoFrame({
  label,
  children,
  footer,
}: {
  label: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div
      style={{
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        background: C.panel,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "9px 13px",
          borderBottom: `1px solid ${C.border}`,
          background: C.panel2,
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: 9, background: C.accent, flex: "none" }} />
        <span style={{ fontSize: 12.5, color: C.muted, letterSpacing: 0.3 }}>{label}</span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 9.5,
            color: C.faint,
            textTransform: "uppercase",
            letterSpacing: 1.4,
          }}
        >
          interactive
        </span>
      </div>
      <div style={{ padding: "18px 16px" }}>{children}</div>
      {footer ? (
        <div
          style={{
            padding: "10px 16px",
            borderTop: `1px solid ${C.border}`,
            fontSize: 12.5,
            color: C.muted,
            lineHeight: 1.55,
          }}
        >
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export function Btn({
  children,
  onClick,
  disabled,
  tone = "accent",
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "accent" | "muted";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="demo-btn"
      data-tone={tone}
    >
      {children}
    </button>
  );
}

export function Meter({ value, tone }: { value: number; tone: string }) {
  return (
    <div
      style={{
        height: 6,
        borderRadius: 6,
        background: C.line,
        overflow: "hidden",
        width: "100%",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: tone,
          borderRadius: 6,
          transition: "width .45s cubic-bezier(.4,0,.2,1), background .3s",
        }}
      />
    </div>
  );
}

export function usePrefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
