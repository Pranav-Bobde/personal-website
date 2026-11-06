import type { GraphCommit, GraphRef, Person, Tone } from "./commit-graph";

/*
 * The four agents and mail app every merging-in-parallel demo uses.
 * The code, hashes and compiler errors below are verbatim: they came from replaying * this scenario through real git and tsc with fixed identities and commit dates, so the
 * widgets never show an outcome that was not observed.
 */
export type PrId = "#1" | "#2" | "#3" | "#4";

type LineKind = "add" | "del" | "ctx";
type CodeLine = [LineKind, string];
export type Patch = {
  file: string;
  note: string;
  lines: CodeLine[];
  /* The line the compiler rejects, and what it says. */
  failure?: { line: number; message: string };
};
type Pr = {
  id: PrId;
  title: string;
  owner: Person;
  branch: string;
  hash: string;
  passesAlone: boolean;
  patch: Patch;
};

export const MAIN_PATCH: Patch = {
  file: "mail.ts",
  note: "already on main",
  lines: [
    ["ctx", "export function sendEmail(to: string) {"],
    ["ctx", "  // talks to the mail server"],
    ["ctx", "}"],
  ],
};

const ERR_NO_MODULE =
  "reply-button.ts(1,27): error TS2307: Cannot find module './reply' or its corresponding type declarations.";
export const ERR_NO_EXPORT =
  "reply.ts(1,10): error TS2305: Module '\"./mail\"' has no exported member 'sendEmail'.";

export const PRS: Record<PrId, Pr> = {
  "#1": {
    id: "#1",
    title: "rename sendEmail",
    owner: "julius",
    branch: "julius/rename-send-email",
    hash: "4f8a0d3",
    passesAlone: true,
    patch: {
      file: "mail.ts",
      note: "edited",
      lines: [
        ["del", "export function sendEmail(to: string) {"],
        ["add", "export function deliver(to: string) {"],
      ],
    },
  },
  "#2": {
    id: "#2",
    title: "define sendReply",
    owner: "maria",
    branch: "maria/send-reply",
    hash: "32f872f",
    passesAlone: true,
    patch: {
      file: "reply.ts",
      note: "new file",
      lines: [
        ["add", 'import { sendEmail } from "./mail";'],
        ["add", ""],
        ["add", "export function sendReply(to: string) {"],
        ["add", "  sendEmail(to);"],
        ["add", "}"],
      ],
    },
  },
  "#3": {
    id: "#3",
    title: "add Reply button",
    owner: "ben",
    branch: "ben/reply-button",
    hash: "d44b58a",
    passesAlone: false,
    patch: {
      file: "reply-button.ts",
      note: "new file",
      failure: { line: 0, message: ERR_NO_MODULE },
      lines: [
        ["add", 'import { sendReply } from "./reply";'],
        ["add", ""],
        ["add", "export function onReply() {"],
        ["add", '  sendReply("sam");'],
        ["add", "}"],
      ],
    },
  },
  "#4": {
    id: "#4",
    title: "fix inbox title",
    owner: "kai",
    branch: "kai/inbox-title",
    hash: "40cd97e",
    passesAlone: true,
    patch: {
      file: "inbox.ts",
      note: "edited",
      lines: [
        ["del", 'export const title = "Inbx";'],
        ["add", 'export const title = "Inbox";'],
      ],
    },
  },
};

export const INIT: GraphCommit = {
  id: "init",
  message: "init mail app",
  hash: "aeb6c36",
  lane: 0,
};

/* Small PRs that merge while the others wait, oldest first. */
export const MAIN_MOVES = [
  { id: "archive", message: "add archive", hash: "2123270", owner: "julius" },
  { id: "search", message: "add search", hash: "cf9a92a", owner: "ben" },
  { id: "labels", message: "add labels", hash: "6c60aa9", owner: "kai" },
  { id: "drafts", message: "add drafts", hash: "7a9b1a2", owner: "julius" },
] as const;

/* Maria's #2 replayed on each of those commits, so each sync gives it a different hash. */
export const MARIA_SYNCED = ["32f872f", "d069518", "6050d29", "d50139f", "8711336"];

/* Where every branch starts from after all of them sync. */
export const SYNCED_MAIN: GraphCommit = {
  id: "drafts",
  message: "add drafts",
  hash: "7a9b1a2",
  lane: 0,
  owner: "julius",
};

/* The same PRs replayed on that main. */
export const ON_SYNCED_MAIN: Record<"#1" | "#2" | "#4", string> = {
  "#1": "929755d",
  "#2": "8711336",
  "#4": "ad65cff",
};

/* Ben's second PR. It edits the title line that Kai's #4 edits. */
export const BEN_TITLE = {
  id: "#5",
  message: "#5 rename inbox title",
  hash: "8fe3a2f",
  branch: "ben/mail-title",
  owner: "ben",
} as const;

/* With no queue, merged in the order #4, #1, #2. */
export const LANDED_NO_QUEUE = { one: "996e429", two: "50f359d" };

/* Hashes from the merge queue runs, and from the stacks later in the post. */
export const REPLAYED = {
  twoOnOne: "d9bbb0f",
  fourOnTwo: "76d9e12",
  fourOnOne: "2636a0c",
  fixedTwoOnFour: "209f19e",
  threeOnTwo: "5ab646e",
  stackedTwoOnOne: "49ba257",
  stackedFourOnOne: "2d74213",
  flagThreeOnTwo: "aede21d",
};

const ERROR_RULES: { error: string; when: (merged: readonly PrId[]) => boolean }[] = [
  { error: ERR_NO_EXPORT, when: (merged) => merged.includes("#1") && merged.includes("#2") },
  { error: ERR_NO_MODULE, when: (merged) => merged.includes("#3") && !merged.includes("#2") },
];

/* Returns the tsc error for main with these PRs merged, or null when it builds. */
export function buildError(merged: readonly PrId[]): string | null {
  return ERROR_RULES.find((rule) => rule.when(merged))?.error ?? null;
}

export const prMessage = (id: PrId) => `${id} ${PRS[id].title}`;

export const mainRef = (stat?: string, tone?: GraphRef["tone"]): GraphRef => ({
  name: "main",
  stat,
  tone,
  owner: "main",
});

export const branchRef = (id: PrId, stat?: string, tone?: Tone): GraphRef => ({
  name: PRS[id].branch,
  stat,
  tone,
  owner: PRS[id].owner,
});

export const BUILDS = { stat: "✓ builds", tone: "ok" } as const;
export const BROKEN = { stat: "✗ build broken", tone: "bad" } as const;
export const BUILDING = { stat: "● build running", tone: "wait" } as const;

const SYMBOLS = /(sendReply|sendEmail|deliver)/;

function highlight(text: string) {
  return text
    .split(SYMBOLS)
    .map((part, index) =>
      SYMBOLS.test(part) ? (
        <span key={`${part}-${index}`} className="gx-sym" data-sym={part}>
          {part}
        </span>
      ) : (
        part
      ),
    );
}

const GUTTER: Record<LineKind, string> = { add: "+", del: "-", ctx: " " };

export function Code({ patch }: { patch: Patch }) {
  return (
    <div className="gx-code">
      <div className="gx-code-file">
        <span>{patch.file}</span>
        <span className="gx-code-note">{patch.note}</span>
      </div>
      <pre className="gx-code-body">
        {patch.lines.map(([kind, text], index) => (
          <span key={index} className="gx-line-group">
            <span className="gx-line" data-kind={kind} data-failed={patch.failure?.line === index}>
              <span className="gx-gutter" aria-hidden>
                {GUTTER[kind]}
              </span>
              <span>{highlight(text)}</span>
            </span>
            {patch.failure?.line === index ? (
              <span className="gx-line-error">{patch.failure.message}</span>
            ) : null}
          </span>
        ))}
      </pre>
    </div>
  );
}
