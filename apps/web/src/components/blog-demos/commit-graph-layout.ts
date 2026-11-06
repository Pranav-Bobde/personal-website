/*
 * Where commits and edges sit in a commit graph. Rows fill up from the bottom of a
 * fixed-height area, so a new commit never moves older commits.
 */
export type Point = { x: number; y: number };

const ROW_H = 46;

export type GraphSpacing = { rowH: number; laneW: number; padX: number; top: number };

export const DEFAULT_SPACING: GraphSpacing = { rowH: ROW_H, laneW: 20, padX: 13, top: 0 };

const laneX = (lane: number, spacing: GraphSpacing) => spacing.padX + lane * spacing.laneW;

export const graphWidth = (lanes: number, spacing: GraphSpacing = DEFAULT_SPACING) =>
  laneX(lanes - 1, spacing) + spacing.padX;

type Placed = { id: string; lane: number; gapBelow?: number };

const totalGap = (commits: readonly Placed[]) =>
  commits.reduce((sum, commit) => sum + (commit.gapBelow ?? 0), 0);

export const graphHeight = (
  commits: readonly Placed[],
  rows: number,
  spacing: GraphSpacing = DEFAULT_SPACING,
) => spacing.top + rows * spacing.rowH + totalGap(commits);

/* Takes commits newest first. `rows` is the height reserved for the largest state. */
export function layoutCommits(
  commits: readonly Placed[],
  rows: number,
  spacing: GraphSpacing = DEFAULT_SPACING,
) {
  const points = new Map<string, Point>();
  let y = graphHeight(commits, rows, spacing) - spacing.rowH / 2;
  for (let index = commits.length - 1; index >= 0; index -= 1) {
    const commit = commits[index];
    points.set(commit.id, { x: laneX(commit.lane, spacing), y });
    y -= spacing.rowH + (commits[index - 1]?.gapBelow ?? 0);
  }
  return points;
}

/*
 * Every edge uses the same path commands, even a straight one, so the browser can
 * animate one edge into another when a branch's fork point moves.
 */
export function edgePath(child: Point, parent: Point, rowH: number = ROW_H) {
  const turn = Math.max(child.y, parent.y - rowH);
  const span = parent.y - turn;
  return `M ${child.x} ${child.y} L ${child.x} ${turn} C ${child.x} ${turn + span * 0.55}, ${parent.x} ${turn + span * 0.45}, ${parent.x} ${parent.y}`;
}
