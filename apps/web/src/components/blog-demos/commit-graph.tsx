import { GitBranch } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import {
  DEFAULT_SPACING,
  edgePath,
  graphHeight,
  graphWidth,
  layoutCommits,
  type GraphSpacing,
  type Point,
} from "./commit-graph-layout";

/*
 * The one picture every Git widget in merging-in-parallel shares: a commit graph
 * in the style of GitLens and Git Graph. Newest on top, one vertical lane per
 * branch, a curve where a branch forks, and each branch name on its tip commit.
 * Colour belongs to an agent, not to a lane position, so Maria looks the same in
 * every widget. main is neutral and never shares an agent's colour.
 */
export type Person = "julius" | "maria" | "ben" | "kai";

export const PEOPLE: Record<Person, { name: string; initial: string }> = {
  julius: { name: "Julius", initial: "J" },
  maria: { name: "Maria", initial: "M" },
  ben: { name: "Ben", initial: "B" },
  kai: { name: "Kai", initial: "K" },
};

export type Tone = "ok" | "bad" | "wait" | "idle" | "owner" | "faint";

type Owner = Person | "main";

export type GraphRef = { name: string; stat?: string; tone?: Tone; owner?: Owner };

export type GraphCommit = {
  id: string;
  lane: number;
  parent?: string;
  message: string;
  hash: string;
  /* Who made this commit. Their initial goes on the node, wherever the commit lands. */
  owner?: Person;
  refs?: GraphRef[];
  /* wideOnly: drop this status where a phone has no room for it beside the branch name. */
  status?: { text: string; tone: Tone; wideOnly?: boolean; owner?: Person };
  /* trial: on a temporary branch. bad: this commit is the reason something failed. */
  look?: "trial" | "bad";
  /* The row being talked about. */
  selected?: boolean;
  /* Extra space under this row, and what to say in it. */
  gapBelow?: number;
  gapNote?: ReactNode;
};

const edgeOwner = (commit: GraphCommit): Owner =>
  commit.lane === 0 ? "main" : (commit.owner ?? "main");

function Edge({ path, commit }: { path: string; commit: GraphCommit }) {
  return (
    <path
      className="gx-edge"
      data-lane={commit.lane}
      data-owner={edgeOwner(commit)}
      data-look={commit.look}
      d={path}
      style={{ d: `path("${path}")` } as CSSProperties}
    />
  );
}

function Dot({ commit, point }: { commit: GraphCommit; point: Point }) {
  return (
    <g
      className="gx-dot"
      data-lane={commit.lane}
      data-owner={commit.owner ?? "main"}
      data-look={commit.look}
      style={{ transform: `translate(${point.x}px, ${point.y}px)` }}
    >
      <circle r={commit.owner ? 8.5 : 5.5} />
      {commit.owner ? <text>{PEOPLE[commit.owner].initial}</text> : null}
    </g>
  );
}

function BranchPill({ name, stat, tone, owner }: GraphRef) {
  return (
    <span className="gx-pill" data-tone={tone ?? "idle"} data-owner={owner ?? "main"}>
      <GitBranch size={11} aria-hidden />
      <span className="gx-pill-name">{name}</span>
      {stat ? <b className="gx-pill-stat">{stat}</b> : null}
    </span>
  );
}

function Row({ commit, y, rowH }: { commit: GraphCommit; y: number; rowH: number }) {
  const { status } = commit;
  return (
    <div
      className="gx-row"
      data-commit={commit.id}
      data-lane={commit.lane}
      data-hash={commit.hash}
      data-look={commit.look}
      data-selected={commit.selected}
      data-has-status={Boolean(status && !status.wideOnly)}
      style={{ transform: `translateY(${y - rowH / 2}px)` }}
    >
      <span className="gx-refs">
        {commit.refs?.map((ref) => (
          <BranchPill key={ref.name} {...ref} />
        ))}
      </span>
      <span className="gx-msg">{commit.message}</span>
      <code key={commit.hash} className="gx-hash">
        {commit.hash}
      </code>
      <span
        className="gx-status"
        data-tone={status?.tone}
        data-owner={status?.owner}
        data-wide-only={status?.wideOnly}
      >
        {status?.text}
      </span>
    </div>
  );
}

export type GraphPulse = {
  key: string;
  commitId: string;
  childId: string;
  oldParentId: string;
  owner: Person;
};

function GhostEdge({
  pulse,
  points,
  rowH,
}: {
  pulse: GraphPulse;
  points: Map<string, Point>;
  rowH: number;
}) {
  const child = points.get(pulse.childId);
  const parent = points.get(pulse.oldParentId);
  if (!child || !parent) return null;
  return <path className="gx-ghost" data-owner={pulse.owner} d={edgePath(child, parent, rowH)} />;
}

function PulseRing({ pulse, points }: { pulse: GraphPulse; points: Map<string, Point> }) {
  const point = points.get(pulse.commitId);
  if (!point) return null;
  return <circle className="gx-pulse" data-owner={pulse.owner} cx={point.x} cy={point.y} r={9} />;
}

function EdgeFor({
  commit,
  points,
  rowH,
}: {
  commit: GraphCommit;
  points: Map<string, Point>;
  rowH: number;
}) {
  const point = points.get(commit.id);
  const parent = commit.parent ? points.get(commit.parent) : undefined;
  if (!point || !parent) return null;
  return <Edge commit={commit} path={edgePath(point, parent, rowH)} />;
}

/* A red dashed arrow from a commit to the commit it needs. */
function DependencyArrow({
  from,
  to,
  points,
}: {
  from: string;
  to: string;
  points: Map<string, Point>;
}) {
  const start = points.get(from);
  const end = points.get(to);
  if (!start || !end) return null;
  const top = start.y + 10;
  const bottom = end.y - 12;
  const middle = (top + bottom) / 2;
  return (
    <g className="gx-dep" data-from={from} data-to={to}>
      <path
        d={`M ${start.x} ${top} C ${start.x} ${middle}, ${end.x} ${middle}, ${end.x} ${bottom}`}
      />
      <path className="gx-dep-head" d={`M ${end.x - 4} ${bottom - 5} L ${end.x} ${bottom + 1} L ${end.x + 4} ${bottom - 5}`} />
    </g>
  );
}

function GapNote({ commit, y, rowH }: { commit: GraphCommit; y: number; rowH: number }) {
  return (
    <div
      className="gx-gap-note"
      style={{ top: y + rowH / 2, height: commit.gapBelow }}
    >
      {commit.gapNote}
    </div>
  );
}

export type GraphBracket = {
  /* The newest and oldest rows it spans, or null to hide it. */
  span: { from: string; to: string } | null;
  label: string;
  owner: Person;
};

function Bracket({
  bracket,
  points,
  rowH,
}: {
  bracket: GraphBracket;
  points: Map<string, Point>;
  rowH: number;
}) {
  const from = bracket.span ? points.get(bracket.span.from) : undefined;
  const to = bracket.span ? points.get(bracket.span.to) : undefined;
  const shown = Boolean(from && to);
  const style: CSSProperties =
    from && to ? { top: from.y - rowH / 2 + 5, height: to.y - from.y + rowH - 10 } : {};
  return (
    <div className="gx-bracket" data-owner={bracket.owner} data-shown={shown} style={style}>
      <span>{bracket.label}</span>
    </div>
  );
}

export type LaneTag = { lane: number; label: string; owner: Owner; nudgeLeft?: number };

function LaneTagAt({
  tag,
  commits,
  points,
}: {
  tag: LaneTag;
  commits: readonly GraphCommit[];
  points: Map<string, Point>;
}) {
  const tip = commits.find((commit) => commit.lane === tag.lane);
  const point = tip ? points.get(tip.id) : undefined;
  if (!point) return null;
  return (
    <span
      className="gx-lane-tag"
      data-owner={tag.owner}
      style={{ transform: `translate(calc(${point.x - (tag.nudgeLeft ?? 0)}px - 50%), ${point.y - 25}px)` }}
    >
      {tag.label}
    </span>
  );
}

export function CommitGraph({
  commits,
  lanes,
  rows,
  pulse,
  label,
  spacing = DEFAULT_SPACING,
  dependency,
  bracket,
  laneTags,
}: {
  commits: readonly GraphCommit[];
  lanes: number;
  /* The largest number of commits this widget ever shows, so its height never changes. */
  rows: number;
  /* Draws attention to a fork point that just moved, and keeps the old edge visible. */
  pulse?: GraphPulse;
  label: string;
  spacing?: GraphSpacing;
  dependency?: { from: string; to: string };
  bracket?: GraphBracket;
  /* A coloured label that sits on a lane's newest commit and moves with it. */
  laneTags?: readonly LaneTag[];
}) {
  const { rowH } = spacing;
  const points = layoutCommits(commits, rows, spacing);
  const width = graphWidth(lanes, spacing);
  const height = graphHeight(commits, rows, spacing);

  return (
    <div
      className="gx-graph"
      role="img"
      aria-label={label}
      data-tall={rowH > DEFAULT_SPACING.rowH}
      data-bracket={Boolean(bracket)}
      style={{ height, "--gx-graph-w": `${width}px`, "--gx-row-h": `${rowH}px` } as CSSProperties}
    >
      {commits.map((commit) => (
        <Row key={commit.id} commit={commit} y={points.get(commit.id)?.y ?? 0} rowH={rowH} />
      ))}
      {commits
        .filter((commit) => commit.gapNote)
        .map((commit) => (
          <GapNote key={commit.id} commit={commit} y={points.get(commit.id)?.y ?? 0} rowH={rowH} />
        ))}
      {bracket ? <Bracket bracket={bracket} points={points} rowH={rowH} /> : null}
      <svg className="gx-svg" width={width} height={height} aria-hidden>
        {pulse ? <GhostEdge key={`ghost-${pulse.key}`} pulse={pulse} points={points} rowH={rowH} /> : null}
        {commits.map((commit) => (
          <EdgeFor key={commit.id} commit={commit} points={points} rowH={rowH} />
        ))}
        {dependency ? <DependencyArrow {...dependency} points={points} /> : null}
        {pulse ? <PulseRing key={`pulse-${pulse.key}`} pulse={pulse} points={points} /> : null}
        {commits.map((commit) => {
          const point = points.get(commit.id);
          return point ? <Dot key={commit.id} commit={commit} point={point} /> : null;
        })}
      </svg>
      {laneTags?.map((tag) => (
        <LaneTagAt key={tag.lane} tag={tag} commits={commits} points={points} />
      ))}
    </div>
  );
}

export function Avatar({ person }: { person: Person }) {
  return (
    <span className="gx-avatar" data-owner={person} aria-hidden>
      {PEOPLE[person].initial}
    </span>
  );
}

/* Says who each initial and colour belongs to, once, where a widget first needs it. */
export function People({ ids }: { ids: readonly Person[] }) {
  return (
    <p className="gx-people">
      {ids.map((id) => (
        <span key={id} className="gx-person" data-owner={id}>
          <Avatar person={id} />
          {PEOPLE[id].name}
        </span>
      ))}
    </p>
  );
}

/*
 * Renders every version of a panel in the same grid cell and shows only the active
 * one. The panel is always as tall as its tallest version at any width, so changing
 * state cannot move what sits below it.
 */
export function Reserved({
  active,
  items,
  className,
  announce,
  tone,
}: {
  active: string;
  items: Record<string, ReactNode>;
  className?: string;
  announce?: boolean;
  /* Colours the panel. A widget's outcome shows here as green or red. */
  tone?: "run" | "wait" | "ok" | "bad" | "pick";
}) {
  return (
    <div
      className={`gx-reserved ${className ?? ""}`}
      data-active={active}
      data-tone={tone}
      aria-live={announce ? "polite" : undefined}
    >
      {Object.entries(items).map(([key, item]) => (
        <div key={key} className="gx-reserved-item" data-shown={key === active} aria-hidden={key !== active}>
          {item}
        </div>
      ))}
    </div>
  );
}

export function Actions({ children }: { children: ReactNode }) {
  return <div className="gx-actions">{children}</div>;
}

export function Segments<T extends string>({
  options,
  value,
  onChange,
  label,
  disabled,
}: {
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <div className="gx-segments" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className="demo-seg"
          data-active={value === option.id}
          aria-pressed={value === option.id}
          disabled={disabled}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
