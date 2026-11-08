import { expect, test } from "bun:test";
import { JSDOM } from "jsdom";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { act, createElement, useRef } from "react";
import { createRoot } from "react-dom/client";

import { BlogDemoPortals } from "./demo-portals.tsx";
import { demoRegistry } from "./registry.ts";
import { renderMarkdown } from "../../lib/markdown.ts";
import { BranchDriftDemo, driftCommits, DRIFT_STEPS } from "./branch-drift-demo.tsx";
import { edgePath, layoutCommits } from "./commit-graph-layout.ts";
import { ConflictKindsDemo, DIFFERENT_LINES_STEPS, SAME_LINE_STEPS } from "./conflict-kinds-demo.tsx";
import { CUES, buildOutput, scheduleCue } from "./demo-sound.tsx";
import { FeatureFlagDemo, flagCommits } from "./feature-flag-demo.tsx";
import { MergeQueueDemo, NO_QUEUE_FRAMES, QUEUE_FRAMES, QUEUE_STEP_MS } from "./merge-queue-demo.tsx";
import { buildError, ERR_NO_EXPORT, LANDED_NO_QUEUE, ON_SYNCED_MAIN, PRS, REPLAYED } from "./merge-scenario.tsx";
import { PrCastDemo } from "./pr-cast-demo.tsx";
import { PushbackDemo, PUSHBACK_STEP_MS } from "./pushback-demo.tsx";
import { checkState, QueueOrStackDemo, CHECK_STEP_MS } from "./queue-or-stack-demo.tsx";
import { StackedPrsDemo } from "./stacked-prs-demo.tsx";
import { WriteSkewDemo } from "./write-skew-demo.tsx";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
});

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  Element: dom.window.Element,
  HTMLElement: dom.window.HTMLElement,
  MouseEvent: dom.window.MouseEvent,
  MutationObserver: dom.window.MutationObserver,
  IS_REACT_ACT_ENVIRONMENT: true,
});

Object.defineProperty(dom.window, "matchMedia", {
  configurable: true,
  value: () => ({
    matches: true,
    addEventListener() {},
    removeEventListener() {},
  }),
});

function DemoHarness({ html }) {
  const articleRef = useRef(null);

  return createElement(
    "div",
    null,
    createElement("div", {
      ref: articleRef,
      dangerouslySetInnerHTML: { __html: html },
    }),
    createElement(BlogDemoPortals, {
      containerRef: articleRef,
      contentKey: "same-blog",
    }),
  );
}

test("remounts demos when rendered markdown replaces their mount nodes", async () => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const html = '<div class="blog-demo" data-demo="branch-drift"></div>';

  await act(async () => {
    root.render(createElement(DemoHarness, { html }));
  });

  expect(container.querySelector("[data-demo]")?.children.length).toBe(1);
  const originalMount = container.querySelector("[data-demo]");

  await act(async () => {
    root.render(createElement(DemoHarness, { html: `${html}<!-- markdown updated -->` }));
    await Promise.resolve();
  });

  const replacementMount = container.querySelector("[data-demo]");
  expect(replacementMount).not.toBe(originalMount);
  expect(replacementMount?.children.length).toBe(1);

  await act(async () => {
    root.unmount();
  });
  container.remove();
});

const visibleLabel = (button) => button.textContent.trim();

const setReducedMotion = (matches) =>
  Object.defineProperty(dom.window, "matchMedia", {
    configurable: true,
    value: () => ({ matches, addEventListener() {}, removeEventListener() {} }),
  });

async function renderDemo(Demo) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(createElement(Demo));
  });
  return {
    container,
    click: async (label) => {
      const button = Array.from(container.querySelectorAll("button")).find(
        (candidate) => visibleLabel(candidate) === label,
      );
      expect(button).toBeDefined();
      await act(async () => button.click());
    },
    cleanup: async () => {
      await act(async () => root.unmount());
      container.remove();
    },
  };
}

const row = (container, id) => container.querySelector(`[data-commit="${id}"]`);
const graphRows = (container) =>
  Array.from(container.querySelectorAll(".gx-row")).map((node) => ({
    id: node.dataset.commit,
    lane: node.dataset.lane,
    hash: node.dataset.hash,
    position: node.style.transform,
  }));
const shownCaption = (container) =>
  container.querySelector('.gx-caption [data-shown="true"]').textContent;

test("layout keeps older commits in place when a new one lands on top", () => {
  const init = { id: "init", lane: 0, message: "init", hash: "a" };
  const next = { id: "next", lane: 0, parent: "init", message: "next", hash: "b" };
  const before = layoutCommits([init], 4);
  const after = layoutCommits([next, init], 4);
  expect(after.get("init")).toEqual(before.get("init"));
  expect(after.get("next").y).toBeLessThan(after.get("init").y);
});

test("a moved fork point keeps the same path commands so the browser can animate it", () => {
  const commands = (path) => path.replace(/[\d.\-,\s]/g, "");
  const straight = edgePath({ x: 13, y: 23 }, { x: 13, y: 69 });
  const curved = edgePath({ x: 33, y: 23 }, { x: 13, y: 207 });
  expect(commands(straight)).toBe(commands(curved));
  expect(curved.endsWith("13 207")).toBe(true);
});

// Reported by Pranav: "sync my branch" used to read as main moving backward.
test("Go lands two more PRs, then syncing moves only Maria's branch and changes only Maria's hash", async () => {
  const { container, click, cleanup } = await renderDemo(BranchDriftDemo);
  const mainRows = () => graphRows(container).filter((item) => item.id !== "maria");
  const bracket = () => container.querySelector(".gx-bracket");
  const status = (id) => row(container, id).querySelector(".gx-status").textContent;

  try {
    expect(row(container, "maria").textContent).toContain("2 behind main");
    expect(bracket().dataset.shown).toBe("true");
    expect(bracket().textContent).toBe("Maria doesn't have these");
    expect(row(container, "maria").dataset.hash).toBe(PRS["#2"].hash);
    const before = mainRows();

    await click("Go");
    expect(mainRows().filter((item) => before.some((old) => old.id === item.id))).toEqual(before);
    expect(mainRows().length).toBe(before.length + 2);
    expect(row(container, "maria").dataset.hash).toBe(ON_SYNCED_MAIN["#2"]);
    expect(row(container, "maria").textContent).toContain("✓ up to date");
    expect(bracket().dataset.shown).toBe("false");
    expect(status("drafts")).toBe("Maria starts here");
    expect(status("init")).toBe("Maria was here");

    await click("reset");
    expect(mainRows()).toEqual(before);
    expect(row(container, "maria").dataset.hash).toBe(PRS["#2"].hash);
  } finally {
    await cleanup();
  }
});

test("the drift steps widen the gap to 4, and the sync step leaves main's commits alone", () => {
  const behindText = (step) => driftCommits(step).find((commit) => commit.id === "maria").refs[0].stat;
  const onMain = (step) =>
    driftCommits(step)
      .filter((commit) => commit.id !== "maria")
      .map(({ id, lane, hash }) => ({ id, lane, hash }));

  expect(DRIFT_STEPS.map(behindText)).toEqual([
    "2 behind main",
    "3 behind main",
    "4 behind main",
    "● syncing",
    "✓ up to date",
  ]);
  expect(onMain(DRIFT_STEPS[3])).toEqual(onMain(DRIFT_STEPS[4]));
  expect(driftCommits(DRIFT_STEPS[3]).find((commit) => commit.id === "maria").parent).toBe("init");
  expect(driftCommits(DRIFT_STEPS[4]).find((commit) => commit.id === "maria").parent).toBe("drafts");
});

// Reported by Pranav: "I'm so not able to identify which branch is which".
test("each lane in the drift demo has its own coloured label on its newest commit", async () => {
  const { container, click, cleanup } = await renderDemo(BranchDriftDemo);
  const tags = () =>
    Object.fromEntries(
      Array.from(container.querySelectorAll(".gx-lane-tag")).map((tag) => [tag.textContent, tag]),
    );

  try {
    expect(tags().main.dataset.owner).toBe("main");
    expect(tags().Maria.dataset.owner).toBe("maria");
    const before = tags().main.style.transform;
    await click("Go");
    expect(tags().main.style.transform).not.toBe(before);
    expect(tags().Maria.dataset.owner).toBe("maria");
  } finally {
    await cleanup();
  }
});

// Reported by Pranav: the button moved under the mouse each time a commit was added.
test("graph height is reserved up front and never changes with the commit count", async () => {
  const { container, click, cleanup } = await renderDemo(BranchDriftDemo);
  const height = () => container.querySelector(".gx-graph").style.height;

  try {
    const start = height();
    await click("Go");
    expect(height()).toBe(start);
    expect(graphRows(container).length).toBe(6);
  } finally {
    await cleanup();
  }
});

test("switching the merge mode goes back to the unplayed start of that mode", async () => {
  const { container, click, cleanup } = await renderDemo(MergeQueueDemo);
  const labels = () => Array.from(container.querySelectorAll("button")).map(visibleLabel);
  const go = () => Array.from(container.querySelectorAll("button")).find((button) => visibleLabel(button) === "Go");

  try {
    const all = labels();
    expect(all).toEqual(["no queue", "merge queue", "Go", "reset"]);
    await click("Go");
    expect(labels()).toEqual(all);
    expect(go().disabled).toBe(true);
    expect(container.textContent).toContain("✗ build broken");

    await click("merge queue");
    expect(labels()).toEqual(all);
    expect(go().disabled).toBe(false);
    expect(shownCaption(container)).toContain("The same three green PRs.");
    expect(container.querySelector('.gx-row[data-look="bad"]')).toBeNull();
  } finally {
    await cleanup();
  }
});

test("reserved panels keep every version in the layout and show only one", async () => {
  const { container, click, cleanup } = await renderDemo(MergeQueueDemo);
  const items = () => container.querySelectorAll(".gx-caption .gx-reserved-item");

  try {
    const count = items().length;
    expect(container.querySelectorAll('.gx-caption [data-shown="true"]').length).toBe(1);
    await click("Go");
    expect(items().length).toBe(count);
    expect(container.querySelectorAll('.gx-caption [data-shown="true"]').length).toBe(1);
  } finally {
    await cleanup();
  }
});

// Expected results come from running these exact PRs through real git and tsc.
test("build outcome matches the real tsc results", () => {
  expect(buildError([])).toBeNull();
  expect(buildError(["#1"])).toBeNull();
  expect(buildError(["#2"])).toBeNull();
  expect(buildError(["#4"])).toBeNull();
  expect(buildError(["#2", "#3"])).toBeNull();
  expect(buildError(["#1", "#4"])).toBeNull();
  expect(buildError(["#3"])).toContain("TS2307");
  expect(buildError(["#1", "#3"])).toContain("TS2307");
  expect(buildError(["#1", "#2"])).toBe(ERR_NO_EXPORT);
  expect(buildError(["#2", "#1"])).toBe(ERR_NO_EXPORT);
  expect(buildError(["#1", "#2", "#3"])).toBe(ERR_NO_EXPORT);
});

// Reported by Pranav: "the red flaginess isn't that apparent here in the #3 case".
test("the PR cast starts with no red, and Go ends on three green and Ben's #3 red", async () => {
  const { container, click, cleanup } = await renderDemo(PrCastDemo);
  const status = (id) => row(container, id).querySelector(".gx-status");

  try {
    expect(container.querySelectorAll(".gx-row").length).toBe(1);
    expect(container.querySelector('.gx-row[data-look="bad"]')).toBeNull();
    expect(container.querySelector(".gx-gap-note")).toBeNull();
    expect(container.querySelector(".gx-dep")).toBeNull();
    expect(container.querySelector(".gx-tasks").textContent).toContain("Kai#4 fix inbox title");
    Array.from(container.querySelectorAll(".demo-seg")).forEach((seg) => expect(seg.disabled).toBe(true));

    await click("Go");
    expect(row(container, "#3").dataset.look).toBe("bad");
    expect(status("#3").textContent).toBe("✗ sendReply doesn't exist here");
    expect(status("#3").dataset.tone).toBe("bad");
    expect(["#1", "#2", "#4"].map((id) => status(id).textContent)).toEqual([
      "✓ builds",
      "✓ builds",
      "✓ builds",
    ]);
    expect(["#1", "#2", "#4"].some((id) => row(container, id).dataset.look === "bad")).toBe(false);
    expect(container.querySelector(".gx-gap-note").textContent).toBe("Ben needs Maria's sendReply");
    expect(container.querySelector(".gx-dep").dataset.to).toBe("#2");

    await click("Julius #1");
    expect(row(container, "#1").dataset.selected).toBe("true");
    expect(shownCaption(container)).toContain("renames");

    await click("Ben #3");
    expect(row(container, "#3").dataset.selected).toBe("true");
    expect(row(container, "#3").dataset.look).toBe("bad");
    const shownCode = container.querySelector('[data-shown="true"] .gx-code');
    expect(shownCode.querySelector('[data-failed="true"]').textContent).toContain(
      'import { sendReply } from "./reply";',
    );
    expect(shownCode.querySelector(".gx-line-error").textContent).toBe(buildError(["#3"]));

    await click("reset");
    expect(container.querySelectorAll(".gx-row").length).toBe(1);
    expect(container.querySelector('.gx-row[data-look="bad"]')).toBeNull();
  } finally {
    await cleanup();
  }
});

test("same-line PRs stop at a conflict, different-line PRs merge and break the build", async () => {
  const { container, click, cleanup } = await renderDemo(ConflictKindsDemo);
  const results = () =>
    Array.from(container.querySelectorAll('.gx-result [data-shown="true"]')).map((item) => item.textContent);
  const card = (index) => container.querySelectorAll(".gx-card")[index];
  const goOn = async (index) => {
    await act(async () => card(index).querySelector(".gx-card-action .demo-btn").click());
  };

  try {
    expect(results().every((text) => text === "Not merged yet.")).toBe(true);
    expect(row(card(0), "#5").dataset.look).not.toBe("bad");
    expect(card(0).dataset.outcome).toBeUndefined();

    await goOn(0);
    expect(results()[0]).toContain("CONFLICT (content): Merge conflict in inbox.ts");
    expect(results()[1]).toBe("Not merged yet.");
    expect(row(card(0), "#5").dataset.look).toBe("bad");
    expect(row(card(0), "#5").dataset.lane).toBe("1");
    expect(card(0).dataset.outcome).toBe("warn");
    expect(card(1).dataset.outcome).toBeUndefined();

    await goOn(1);
    expect(results()[1]).toContain("Merge made by the 'ort' strategy.");
    expect(results()[1]).toContain("TS2305");
    expect(row(card(1), "#2").dataset.look).toBe("bad");
    expect(card(1).dataset.outcome).toBe("bad");

    await click("reset");
    expect(results().every((text) => text === "Not merged yet.")).toBe(true);
    expect(card(0).dataset.outcome).toBeUndefined();
  } finally {
    await cleanup();
  }
});

test("the conflict steps show red only on their last step, on the row that caused it", () => {
  const isRed = (commit) =>
    commit.look === "bad" || commit.refs?.some((ref) => ref.tone === "bad") || commit.status?.tone === "bad";
  for (const steps of [SAME_LINE_STEPS, DIFFERENT_LINES_STEPS]) {
    expect(steps.length).toBe(4);
    steps.slice(0, -1).forEach((step) => expect(step.some(isRed)).toBe(false));
  }
  expect(SAME_LINE_STEPS[3].filter(isRed).map((commit) => commit.id)).toEqual(["#5"]);
  expect(DIFFERENT_LINES_STEPS[3].filter(isRed).map((commit) => commit.id)).toEqual(["#2"]);
  expect(DIFFERENT_LINES_STEPS[3][0].hash).toBe(LANDED_NO_QUEUE.two);
  expect(DIFFERENT_LINES_STEPS[3][1].hash).toBe(LANDED_NO_QUEUE.one);
});

const frameCommit = (frame, id) => frame.commits.find((commit) => commit.id === id);
const mainIsRed = (frame) =>
  frame.commits.some((commit) => commit.lane === 0 && commit.refs?.some((ref) => ref.tone === "bad"));

test("without a queue the same PRs break main at Maria's #2", async () => {
  expect(QUEUE_STEP_MS.none.length).toBe(NO_QUEUE_FRAMES.length - 2);
  const [idle, kai, julius, mariaLands, broken] = NO_QUEUE_FRAMES;
  expect(frameCommit(idle, "#1").lane).toBe(1);
  expect(frameCommit(kai, "#4").lane).toBe(0);
  expect(frameCommit(kai, "#4").refs[0].stat).toBe("✓ builds");
  expect(frameCommit(julius, "#1").refs[0].stat).toBe("✓ builds");
  expect(frameCommit(mariaLands, "#2").refs[0].stat).toBe("● build running");
  expect(NO_QUEUE_FRAMES.slice(0, -1).some(mainIsRed)).toBe(false);
  expect(frameCommit(broken, "#2").refs[0].stat).toBe("✗ build broken");

  const { container, click, cleanup } = await renderDemo(MergeQueueDemo);
  try {
    expect(row(container, "#1").dataset.lane).toBe("1");
    expect(container.querySelector('.gx-row[data-look="bad"]')).toBeNull();
    await click("Go");
    expect(row(container, "#2").textContent).toContain("✗ build broken");
    expect(row(container, "#2").dataset.look).toBe("bad");
    expect(container.querySelector(".gx-caption").dataset.tone).toBe("bad");
    await click("reset");
    expect(row(container, "#1").dataset.lane).toBe("1");
    expect(container.querySelector(".gx-caption").dataset.tone).toBe("run");
  } finally {
    await cleanup();
  }
});

test("the queue removes #2, retests #4 without it, then lands the fixed #2", async () => {
  expect(QUEUE_STEP_MS.queue.length).toBe(QUEUE_FRAMES.length - 2);
  const [idle, joined, juliusLands, mariaFails, retest, kaiLands, mariaBack, final] = QUEUE_FRAMES;
  expect(idle.line).toEqual([]);
  expect(frameCommit(idle, "#2").look).toBeUndefined();
  expect(joined.line).toEqual(["#1", "#2", "#4"]);
  expect(frameCommit(joined, "#2").refs[0].name).toBe("temp: main + #1 + #2");
  expect(frameCommit(juliusLands, "#1").lane).toBe(0);
  expect(juliusLands.line).toEqual(["#2", "#4"]);
  expect(frameCommit(mariaFails, "#2").status.text).toBe("✗ removed");
  expect(frameCommit(mariaFails, "#2").lane).not.toBe(0);
  expect(mariaFails.tone).toBe("bad");
  expect(frameCommit(retest, "#4").refs[0].name).toBe("temp: main + #4");
  expect(frameCommit(kaiLands, "#4").lane).toBe(0);
  expect(kaiLands.line).toEqual([]);
  expect(frameCommit(mariaBack, "#2").look).toBe("trial");
  expect(frameCommit(final, "#2").lane).toBe(0);
  expect(frameCommit(final, "#2").refs[0].stat).toBe("✓ builds");
  expect(QUEUE_FRAMES.some(mainIsRed)).toBe(false);

  const { container, click, cleanup } = await renderDemo(MergeQueueDemo);
  const line = () =>
    Array.from(container.querySelectorAll('[data-shown="true"] .gx-chip')).map((chip) => chip.dataset.pr);
  try {
    await click("merge queue");
    expect(line()).toEqual([]);
    expect(shownCaption(container)).not.toContain("step");
    await click("Go");
    expect(line()).toEqual([]);
    expect(row(container, "#2").dataset.lane).toBe("0");
    expect(row(container, "#2").textContent).toContain("✓ builds");
    expect(container.querySelector(".gx-caption").dataset.tone).toBe("ok");
    expect(shownCaption(container)).toContain("step 7 of 7");
  } finally {
    await cleanup();
  }
});

// Reported by the lead: a landed PR must not also be listed beside main in a temp branch label.
test("a temporary branch label never lists a PR that already landed on main", () => {
  QUEUE_FRAMES.forEach((frame) => {
    const onMain = frame.commits
      .filter((commit) => commit.lane === 0)
      .map((commit) => commit.id)
      .filter((id) => id.startsWith("#"));
    frame.commits
      .flatMap((commit) => commit.refs ?? [])
      .map((ref) => ref.name)
      .filter((name) => name.startsWith("temp:"))
      .forEach((name) => onMain.forEach((id) => expect(name).not.toContain(id)));
  });
});

// Reported by Pranav: the idle state looked already solved, so #3 must visibly start on main and fail there first.
test("the stack starts with #3 forked from main, not red, and Go lands both PRs in order", async () => {
  const { container, click, cleanup } = await renderDemo(StackedPrsDemo);
  const labels = () => Array.from(container.querySelectorAll("button")).map(visibleLabel);

  try {
    expect(labels()).toEqual(["Go", "reset", "sound on"]);
    expect(row(container, "#3").dataset.lane).toBe("2");
    expect(row(container, "#3").dataset.look).not.toBe("bad");
    expect(row(container, "#3").dataset.hash).toBe(PRS["#3"].hash);
    expect(row(container, "#3").textContent).toContain("base: main");
    expect(row(container, "#2").textContent).toContain("✓ builds");
    expect(container.querySelector(".gx-dep")).toBeNull();

    await click("Go");
    expect(row(container, "#2").dataset.lane).toBe("0");
    expect(row(container, "#3").dataset.lane).toBe("0");
    expect(row(container, "#3").dataset.hash).toBe(REPLAYED.threeOnTwo);
    expect(row(container, "#3").textContent).toContain("✓ builds");
    expect(container.querySelector('.gx-row[data-look="bad"]')).toBeNull();
    expect(shownCaption(container)).toContain("Both landed, in order.");

    await click("reset");
    expect(row(container, "#3").dataset.lane).toBe("2");
    expect(row(container, "#3").dataset.look).not.toBe("bad");
  } finally {
    await cleanup();
  }
});

test("the stack animation fails on main before it moves, in 9 to 11 seconds, with main never red", async () => {
  const { STACK_STEPS, STACK_STEP_MS } = await import("./stacked-prs-demo.tsx");
  const { graphHeight } = await import("./commit-graph-layout.ts");
  const three = (step) => step.find((commit) => commit.id === "#3");
  const two = (step) => step.find((commit) => commit.id === "#2");
  const [idle, checkingOnMain, failedOnMain, lifted, checking, green, mariaLands, retargeted, final] = STACK_STEPS;

  expect(STACK_STEP_MS.length).toBe(STACK_STEPS.length - 2);
  const total = STACK_STEP_MS.reduce((sum, ms) => sum + ms, 0);
  expect(total).toBeGreaterThanOrEqual(9000);
  expect(total).toBeLessThanOrEqual(11000);

  expect(three(idle).parent).toBe("init");
  expect(three(idle).look).toBeUndefined();
  expect(three(idle).status).toBeUndefined();
  expect(three(checkingOnMain).parent).toBe("init");
  expect(three(failedOnMain).parent).toBe("init");
  expect(three(failedOnMain).look).toBe("bad");
  expect(three(lifted).parent).toBe("#2");
  expect(three(lifted).hash).toBe(REPLAYED.threeOnTwo);
  expect(three(lifted).refs[0].stat).toBe("base: maria/send-reply");
  expect(three(lifted).look).toBeUndefined();
  expect(three(checking).status.text).toBe("● check running");
  expect(three(checking).look).toBeUndefined();
  expect(three(green).status.text).toBe("✓ builds");
  expect(two(mariaLands).lane).toBe(0);
  expect(three(mariaLands).refs[0].stat).toBe("base: maria/send-reply");
  expect(three(retargeted).refs[0].stat).toBe("base: main");
  expect(three(final).lane).toBe(0);
  expect(three(final).refs[0].name).toBe("main");

  STACK_STEPS.forEach((step) => {
    expect(step.length).toBe(3);
    expect(graphHeight(step, 3)).toBe(3 * 46);
    step
      .filter((commit) => commit.lane === 0)
      .forEach((commit) => {
        expect(commit.look).toBeUndefined();
        commit.refs?.forEach((ref) => expect(ref.tone).toBe("ok"));
      });
  });
});

test("pressing reset mid-run cancels the stack animation, and Go is disabled while it runs", async () => {
  setReducedMotion(false);
  const { container, click, cleanup } = await renderDemo(StackedPrsDemo);
  const go = () => Array.from(container.querySelectorAll("button")).find((button) => visibleLabel(button) === "Go");

  try {
    expect(go().disabled).toBe(false);
    await click("Go");
    expect(go().disabled).toBe(true);
    expect(row(container, "#3").dataset.lane).toBe("2");
    expect(shownCaption(container)).toContain("check runs on");

    await click("reset");
    expect(go().disabled).toBe(false);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1900));
    });
    expect(row(container, "#3").dataset.lane).toBe("2");
    expect(shownCaption(container)).toContain("branches off");
  } finally {
    setReducedMotion(true);
    await cleanup();
  }
});

test("queue or stack follows whether each PR builds alone, and the shapes differ", async () => {
  const { container, click, cleanup } = await renderDemo(QueueOrStackDemo);
  const verdict = () => container.querySelector('.gx-caption [data-shown="true"] [data-verdict]')?.dataset.verdict;
  const cards = () => container.querySelectorAll(".gx-card");
  const shownChecks = () =>
    Array.from(container.querySelectorAll('[data-shown="true"] .gx-check')).map((check) => check.dataset.state);

  try {
    expect(verdict()).toBeUndefined();
    expect(cards()[0].dataset.pick).toBeUndefined();
    expect(cards()[1].dataset.pick).toBeUndefined();
    expect(shownChecks()).toEqual(["pending", "pending", "pending"]);

    await click("Go");
    expect(verdict()).toBe("queue");
    expect(cards()[0].dataset.pick).toBe("true");
    expect(shownChecks()).toEqual(["ok", "ok", "bad"]);

    await click("Maria #2 + Ben #3");
    expect(verdict()).toBeUndefined();
    expect(cards()[1].dataset.pick).toBeUndefined();
    expect(shownChecks()).toEqual(["pending", "pending", "pending"]);

    await click("Go");
    expect(verdict()).toBe("stack");
    expect(cards()[1].dataset.pick).toBe("true");
    expect(shownChecks()).toEqual(["ok", "bad", "ok"]);
    const lanes = (card) =>
      Array.from(card.querySelectorAll(".gx-row"))
        .filter((node) => node.dataset.commit !== "init")
        .map((node) => node.dataset.lane);
    expect(new Set(lanes(cards()[0])).size).toBe(2);
    expect(new Set(lanes(cards()[1])).size).toBe(1);

    await click("Julius #1 + Kai #4");
    await click("Go");
    expect(verdict()).toBe("queue");
    expect(shownChecks()).toEqual(["ok", "ok", "ok"]);
  } finally {
    await cleanup();
  }
});

test("a build check stays pending, then runs, then shows its result", () => {
  expect(CHECK_STEP_MS.length).toBe(6);
  const states = (ids, index) => [0, 1, 2, 3, 4, 5, 6, 7].map((step) => checkState(ids, index, step));
  expect(states(["#3"], 1)).toEqual(["pending", "pending", "pending", "running", "bad", "bad", "bad", "bad"]);
  expect(states(["#1", "#2"], 2)).toEqual(["pending", "pending", "pending", "pending", "pending", "running", "bad", "bad"]);
  expect(states(["#1"], 0)).toEqual(["pending", "running", "ok", "ok", "ok", "ok", "ok", "ok"]);
});

test("feature flag releases only when #3 is merged and the flag is on", async () => {
  const { container, click, cleanup } = await renderDemo(FeatureFlagDemo);
  const live = () => container.querySelector(".gx-inbox").dataset.live;
  const flip = async () => {
    const flag = container.querySelector(".demo-switch");
    await act(async () => flag.click());
  };

  try {
    await flip();
    expect(live()).toBe("false");
    expect(shownCaption(container)).toContain("nothing changed");
    await flip();
    expect(row(container, "#3").dataset.lane).toBe("1");
    await click("Go");
    expect(row(container, "#3").dataset.lane).toBe("0");
    expect(live()).toBe("false");
    expect(shownCaption(container)).toContain("Merged, not released.");
    await flip();
    expect(live()).toBe("true");
    expect(shownCaption(container)).toContain("Released, with no new merge.");
    await click("Reply");
    expect(container.querySelector(".gx-sent").dataset.shown).toBe("true");
    await flip();
    expect(live()).toBe("false");
  } finally {
    await cleanup();
  }
});

test("setting the flag ON before Go plays a different ending: the button ships with the merge", async () => {
  const { container, click, cleanup } = await renderDemo(FeatureFlagDemo);
  const flag = () => container.querySelector(".demo-switch");

  try {
    await act(async () => flag().click());
    await click("Go");
    expect(container.querySelector(".gx-inbox").dataset.live).toBe("true");
    expect(shownCaption(container)).toContain("Merged and released together");
    await click("reset");
    expect(flag().dataset.on).toBe("false");
    expect(container.querySelector(".gx-inbox").dataset.live).toBe("false");
  } finally {
    await cleanup();
  }
  expect(flagCommits(0)[0].lane).toBe(1);
  expect(flagCommits(2)[0].status.text).toBe("✓ builds");
  expect(flagCommits(3)[0].lane).toBe(0);
  expect(flagCommits(3)[0].hash).toBe(REPLAYED.flagThreeOnTwo);
});

const VISIBLE_RED = [
  '.gx-row[data-look="bad"]',
  '.gx-status[data-tone="bad"]',
  '.gx-pill[data-tone="bad"]',
  '.gx-check[data-state="bad"]',
  '.gx-caption[data-tone="bad"]',
  ".gx-card[data-outcome]",
  ".gx-card[data-pick]",
  '.gx-inbox[data-live="true"]',
  ".chat-flag[data-on=\"true\"]",
].join(",");

const visibleText = (container) => {
  const copy = container.cloneNode(true);
  copy.querySelectorAll('[data-shown="false"]').forEach((node) => node.remove());
  return copy.textContent;
};

const GO_WIDGETS = [
  ["branch drift", BranchDriftDemo, /up to date/],
  ["conflict kinds", ConflictKindsDemo, /CONFLICT/],
  ["merge queue", MergeQueueDemo, /build broken/],
  ["queue or stack", QueueOrStackDemo, /Use a queue/],
  ["feature flag", FeatureFlagDemo, /Merged, not released/],
  ["pushback", PushbackDemo, /That was misleading\./],
];

for (const [name, Demo, outcome] of GO_WIDGETS) {
  test(`${name} starts with no spoiler, reveals only after Go, and reset returns to the start`, async () => {
    const { container, click, cleanup } = await renderDemo(Demo);
    try {
      const start = visibleText(container);
      expect(container.querySelector(VISIBLE_RED)).toBeNull();
      expect(start).not.toContain("✗");
      expect(start).not.toMatch(outcome);

      await click("Go");
      expect(visibleText(container)).toMatch(outcome);

      await click("reset");
      expect(visibleText(container)).toBe(start);
      expect(container.querySelector(VISIBLE_RED)).toBeNull();
    } finally {
      await cleanup();
    }
  });

  test(`${name} clears its timer on reset and on unmount`, async () => {
    const realSet = globalThis.setTimeout;
    const realClear = globalThis.clearTimeout;
    const pending = new Set();
    globalThis.setTimeout = (callback, ms, ...rest) => {
      const id = realSet(() => {
        pending.delete(id);
        callback(...rest);
      }, ms);
      if (ms >= 500) pending.add(id);
      return id;
    };
    globalThis.clearTimeout = (id) => {
      pending.delete(id);
      realClear(id);
    };
    setReducedMotion(false);
    const { container, click, cleanup } = await renderDemo(Demo);
    const go = () => Array.from(container.querySelectorAll("button")).find((button) => visibleLabel(button) === "Go");

    try {
      const start = visibleText(container);
      await click("Go");
      expect(go().disabled).toBe(true);
      expect(pending.size).toBe(1);
      expect(visibleText(container)).not.toBe(start);

      await click("reset");
      expect(pending.size).toBe(0);
      expect(visibleText(container)).toBe(start);
      expect(go().disabled).toBe(false);

      await click("Go");
      expect(pending.size).toBe(1);
      await cleanup();
      expect(pending.size).toBe(0);
    } finally {
      globalThis.setTimeout = realSet;
      globalThis.clearTimeout = realClear;
      setReducedMotion(true);
    }
  });

  test(`${name} text keeps one reader POV with no em dashes`, async () => {
    const { container, cleanup } = await renderDemo(Demo);
    try {
      const text = container.textContent;
      expect(text).not.toContain("—");
      expect(text).not.toMatch(/\b(he|she|his|her|hers|him|himself|herself)\b/i);
      expect(text).not.toMatch(/project manager|\bteam\b|, so press/i);
    } finally {
      await cleanup();
    }
  });
}

test("Go plays one step at a time: the first check runs, then shows its result", async () => {
  setReducedMotion(false);
  const { container, click, cleanup } = await renderDemo(QueueOrStackDemo);
  const shownChecks = () =>
    Array.from(container.querySelectorAll('[data-shown="true"] .gx-check')).map((check) => check.dataset.state);

  try {
    await click("Go");
    expect(shownChecks()).toEqual(["running", "pending", "pending"]);
    expect(shownCaption(container)).toContain("Building Julius's #1 on its own.");
    await act(async () => {
      await new Promise((done) => setTimeout(done, CHECK_STEP_MS[0] + 100));
    });
    expect(shownChecks()).toEqual(["ok", "pending", "pending"]);
    expect(shownCaption(container)).toContain("Julius's #1 builds.");
  } finally {
    setReducedMotion(true);
    await cleanup();
  }
});

test("reduced motion skips Go straight to the outcome in every widget", async () => {
  for (const [, Demo, outcome] of GO_WIDGETS) {
    const { container, click, cleanup } = await renderDemo(Demo);
    try {
      await click("Go");
      expect(visibleText(container)).toMatch(outcome);
    } finally {
      await cleanup();
    }
  }
});

// Reported by Pranav: the reader must never have to work out who owns what.
test("every widget gives an agent's pills, nodes and lanes the same owner", async () => {
  const demos = [
    PrCastDemo,
    BranchDriftDemo,
    ConflictKindsDemo,
    MergeQueueDemo,
    StackedPrsDemo,
    QueueOrStackDemo,
    FeatureFlagDemo,
  ];
  for (const Demo of demos) {
    const { container, click, cleanup } = await renderDemo(Demo);
    const checkOwners = () => {
      Array.from(container.querySelectorAll(".gx-pill")).forEach((pill) => {
        const name = pill.querySelector(".gx-pill-name")?.textContent ?? "main";
        if (name === "main") expect(pill.dataset.owner).toBe("main");
        else if (name.includes("/")) expect(pill.dataset.owner).toBe(name.split("/")[0]);
      });
      Array.from(container.querySelectorAll(".gx-edge")).forEach((edge) => {
        if (edge.dataset.lane === "0") expect(edge.dataset.owner).toBe("main");
        else expect(edge.dataset.owner).not.toBe("main");
      });
      Array.from(container.querySelectorAll(".gx-dot")).forEach((dot) => {
        const letter = dot.querySelector("text")?.textContent;
        if (letter) expect(dot.dataset.owner[0].toUpperCase()).toBe(letter);
      });
    };
    try {
      checkOwners();
      await click("Go");
      checkOwners();
    } finally {
      await cleanup();
    }
  }
});

test("the merging post keeps its required parts and uses no gendered pronouns for agents", async () => {
  const repoRoot = resolve(import.meta.dir, "../../../../../");
  const article = await readFile(resolve(repoRoot, "content/blogs/merging-in-parallel.md"), "utf8");

  expect(article).not.toMatch(/\b(he|she|his|her|hers|him|himself|herself)\b/i);
  expect(article).not.toMatch(/Elon|project manager|the team|Monday|Tuesday|Wednesday|Thursday|Friday/);
  for (const part of [
    "how the hell does this not constantly break?",
    "made-up mail app",
    "27.67%",
    "Require branches to be up to date before merging",
    "red alone",
    "The flag hides behaviour, not code.",
    "Don't merge ten things at once. Merge one thing ten times, each against the real current `main`.",
    "Further reading:",
  ]) {
    expect(article).toContain(part);
  }
});

test("every demo in the merging post exists and its prose has no em dashes", async () => {
  const repoRoot = resolve(import.meta.dir, "../../../../../");
  const article = await readFile(resolve(repoRoot, "content/blogs/merging-in-parallel.md"), "utf8");
  const names = Array.from(article.matchAll(/::demo\[([^\]]+)\]/g), (match) => match[1]);

  expect(names).toEqual([
    "pr-cast",
    "branch-drift",
    "conflict-kinds",
    "merge-queue",
    "stacked-prs",
    "queue-or-stack",
    "feature-flag",
  ]);
  names.forEach((name) => expect(name in demoRegistry).toBe(true));
  expect(article).not.toContain("—");
});

test("write skew demo uses the compact SQL trace to explain the full event trail", async () => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  try {
    await act(async () => {
      root.render(createElement(WriteSkewDemo));
    });

    expect(container.textContent).toContain("SQL trace");
    expect(container.textContent).toContain("S_A = Tx A's read snapshot");
    expect(container.textContent).toContain("S_B = Tx B's read snapshot");
    expect(container.textContent).toContain("Tx B read Account A → Tx A writes Account A");
    expect(container.textContent).toContain("Tx A read Account B → Tx B writes Account B");
    expect(container.textContent).toContain("event 1 / 5");

    const traceStates = () =>
      Array.from(container.querySelectorAll('[aria-label="SQL event trace"] li')).map(
        (item) => item.getAttribute("data-state"),
      );
    expect(traceStates()).toEqual(["current", "upcoming", "upcoming", "upcoming", "upcoming"]);

    const nextEvent = () =>
      Array.from(container.querySelectorAll("button")).find(
        (button) => button.textContent === "next event",
      );

    await act(async () => nextEvent()?.click());
    expect(traceStates()).toEqual(["complete", "current", "upcoming", "upcoming", "upcoming"]);
    expect(container.textContent).toContain("Tx A> SELECT balance FROM accounts");
    expect(container.textContent).toContain("after A-$600: total $600 >= $500 -> true");

    await act(async () => nextEvent()?.click());
    expect(traceStates()).toEqual(["complete", "complete", "current", "upcoming", "upcoming"]);
    expect(container.textContent).toContain("Tx B> SELECT balance FROM accounts");
    expect(container.textContent).toContain("S_B = Tx B's read snapshot");

    await act(async () => nextEvent()?.click());
    expect(traceStates()).toEqual(["complete", "complete", "complete", "current", "upcoming"]);
    expect(container.textContent).toContain("Tx A> UPDATE accounts SET balance = 0");
    expect(container.textContent).toContain("edge exists; no SSI tracking");

    await act(async () => nextEvent()?.click());
    expect(traceStates()).toEqual(["complete", "complete", "complete", "complete", "current"]);
    expect(container.textContent).toContain("Tx B> UPDATE accounts SET balance = 0");
    expect(container.textContent).toContain("no SSI check; cycle commits");
    expect(container.textContent).toContain("rule broken");
    expect(container.textContent).toContain("event 5 / 5");
    expect(container.querySelector('[aria-current="step"]')?.textContent).toContain("COMMIT");
  } finally {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  }
});

test("write skew SQL trace shows Serializable abort and resets its trail on mode change", async () => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  try {
    await act(async () => {
      root.render(createElement(WriteSkewDemo));
    });

    const serializable = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent === "Serializable",
    );
    expect(serializable?.getAttribute("aria-pressed")).toBe("false");

    const nextEventBeforeSwitch = () =>
      Array.from(container.querySelectorAll("button")).find(
        (button) => button.textContent === "next event",
      );
    await act(async () => nextEventBeforeSwitch()?.click());
    await act(async () => nextEventBeforeSwitch()?.click());
    expect(container.textContent).toContain("event 3 / 5");

    await act(async () => serializable?.click());
    expect(serializable?.getAttribute("aria-pressed")).toBe("true");
    expect(container.textContent).toContain("event 1 / 5");
    expect(container.querySelector('[aria-current="step"]')?.getAttribute("aria-label")).toContain(
      "Invariant established",
    );

    const nextEvent = () =>
      Array.from(container.querySelectorAll("button")).find(
        (button) => button.textContent === "next event",
      );
    for (let index = 0; index < 4; index += 1) {
      await act(async () => nextEvent()?.click());
    }

    expect(container.textContent).toContain("aborted (SQLSTATE 40001)");
    expect(container.textContent).toContain("SQLSTATE 40001");
    expect(container.textContent).toContain("ROLLBACK");
    expect(container.textContent).toContain("SSI rejects dangerous structure");
    expect(container.textContent).toContain("rule holds");
    expect(container.querySelector('[aria-current="step"]')?.getAttribute("aria-label")).toContain(
      "Tx B writes Account B",
    );
    expect(container.querySelector('[role="group"][aria-label="Write skew isolation mode"]')).toBeTruthy();
  } finally {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  }
});

test("registers every Postgres connection teaching demo", () => {
  expect(Object.keys(demoRegistry)).toEqual(
    expect.arrayContaining([
      "connection-pressure",
      "mvcc-visibility",
      "write-skew",
      "checkout-window",
    ]),
  );
});

test("Postgres connections article preserves the personal investigation and interactive lessons", async () => {
  const repoRoot = resolve(import.meta.dir, "../../../../../");
  const article = await readFile(
    resolve(repoRoot, "content/blogs/postgres-connections.md"),
    "utf8",
  );

  expect(article).toContain("why not just increase `max_connections`");
  expect(article).toContain("https://brandur.org/postgres-connections");
  expect(article.match(/::demo\[/g)?.length).toBe(4);
  expect(article).toContain("::demo[connection-pressure]");
  expect(article).toContain("::demo[mvcc-visibility]");
  expect(article).toContain("::demo[write-skew]");
  expect(article).toContain("::demo[checkout-window]");
});

test("Postgres connections article is discoverable in the sitemap", async () => {
  const repoRoot = resolve(import.meta.dir, "../../../../../");
  const sitemap = await readFile(resolve(repoRoot, "apps/web/public/sitemap.xml"), "utf8");

  expect(sitemap).toContain("https://pranavb.xyz/blogs/postgres-connections");
  expect(sitemap).toContain("<lastmod>2026-08-25</lastmod>");
});

// Reported by the typecheck: a rename gave two replayed hashes the same key, and the last one won.
test("the PR cast shows red only on its very last beat, and the graph height never changes", async () => {
  const { castCommits } = await import("./pr-cast-demo.tsx");
  const { graphHeight } = await import("./commit-graph-layout.ts");
  for (let step = 0; step < 12; step += 1) {
    expect(castCommits(step, "main").some((commit) => commit.look === "bad")).toBe(false);
    expect(castCommits(step, "main").some((commit) => commit.status?.tone === "bad")).toBe(false);
  }
  expect(castCommits(12, "main").filter((commit) => commit.look === "bad").map((commit) => commit.id)).toEqual(["#3"]);
  expect(castCommits(9, "main").slice(0, 3).map((commit) => commit.id)).toEqual(["#2", "#4", "#1"]);
  expect(graphHeight(castCommits(12, "main"), 5)).toBe(5 * 46 + 24);
});

test("the merge queue and the stack picker each keep their own replayed hashes", async () => {
  const { REPLAYED } = await import("./merge-scenario.tsx");
  expect(REPLAYED.twoOnOne).toBe("d9bbb0f");
  expect(REPLAYED.fourOnOne).toBe("2636a0c");
  expect(REPLAYED.stackedTwoOnOne).toBe("49ba257");
  expect(REPLAYED.stackedFourOnOne).toBe("2d74213");
});

test("the pushback demo keeps the quotes word for word and flags only the claim's two words", async () => {
  expect(PUSHBACK_STEP_MS.length).toBe(3);
  const { container, click, cleanup } = await renderDemo(PushbackDemo);
  const shownTurns = () =>
    Array.from(container.querySelectorAll('.chat-text[data-shown="true"]')).map((turn) => turn.textContent);

  try {
    expect(shownTurns()).toEqual([]);
    expect(container.querySelector(".chat-flag").dataset.on).toBe("false");
    expect(container.querySelector(".chat-flag").textContent).toBe("very efficiently");

    await click("Go");
    expect(container.querySelector(".chat-flag").dataset.on).toBe("true");
    expect(container.querySelector(".chat-flag-note").dataset.shown).toBe("true");
    expect(shownTurns()[0]).toContain(
      "With Node.js's common single-process async model, many concurrent handlers can share one pool very efficiently:",
    );
    expect(shownTurns()[1]).toContain("you just self claimly tagged The node one as the efficient one");
    expect(shownTurns()[2]).toContain("there is no special efficiency difference just because it\u2019s Node.js.");
    expect(shownTurns()[2].endsWith("That was misleading.")).toBe(true);
    expect(container.querySelector(".gx-caption").dataset.tone).toBe("ok");
  } finally {
    await cleanup();
  }
});

/* A stand-in for the browser's AudioContext that records what the sound helper asks it to do. */
class FakeParam {
  value = 1;
  targets = [];
  setValueAtTime() {}
  linearRampToValueAtTime() {}
  exponentialRampToValueAtTime() {}
  setTargetAtTime(value) {
    this.targets.push(value);
  }
}

class FakeNode {
  gain = new FakeParam();
  frequency = new FakeParam();
  connect(node) {
    return node;
  }
  disconnect() {}
}

class FakeAudioContext {
  static instances = [];
  static oscillators = [];
  static resumed = 0;
  currentTime = 0;
  sampleRate = 8000;
  destination = new FakeNode();
  constructor() {
    FakeAudioContext.instances.push(this);
  }
  resume() {
    FakeAudioContext.resumed += 1;
    return Promise.resolve();
  }
  createGain() {
    return new FakeNode();
  }
  createConvolver() {
    return new FakeNode();
  }
  createBiquadFilter() {
    return new FakeNode();
  }
  createBuffer(_channels, length) {
    const samples = new Float32Array(length);
    return { getChannelData: () => samples };
  }
  createOscillator() {
    const oscillator = new FakeNode();
    oscillator.starts = [];
    oscillator.stops = [];
    oscillator.start = (time) => oscillator.starts.push(time);
    oscillator.stop = (time) => oscillator.stops.push(time);
    FakeAudioContext.oscillators.push(oscillator);
    return oscillator;
  }
}

const startedWaves = () => FakeAudioContext.oscillators.map((oscillator) => oscillator.type);
const startedHz = () => FakeAudioContext.oscillators.map((oscillator) => oscillator.frequency.value);
const clearOscillators = () => {
  FakeAudioContext.oscillators = [];
};

/* Runs before any test installs the fake, because the helper keeps the first context it opens. */
test("with no audio available, the widgets still run and the toggle still works", async () => {
  expect(globalThis.AudioContext).toBeUndefined();
  const { container, click, cleanup } = await renderDemo(PushbackDemo);
  try {
    await click("Go");
    expect(visibleText(container)).toContain("That was misleading.");
    await click("sound on");
    await click("sound off");
    await click("reset");
    expect(visibleText(container)).not.toContain("That was misleading.");
  } finally {
    await cleanup();
  }
});

test("a throwing AudioContext constructor leaves the widget running", async () => {
  globalThis.AudioContext = class {
    constructor() {
      throw new Error("blocked");
    }
  };
  const { container, click, cleanup } = await renderDemo(PushbackDemo);
  try {
    await click("Go");
    expect(visibleText(container)).toContain("That was misleading.");
  } finally {
    delete globalThis.AudioContext;
    await cleanup();
  }
});

test("sound starts only from Go, and reset stops it and plays G3 then C3", async () => {
  globalThis.AudioContext = FakeAudioContext;
  const { click, cleanup } = await renderDemo(PushbackDemo);
  try {
    expect(FakeAudioContext.instances.length).toBe(0);
    await click("reset");
    expect(FakeAudioContext.instances.length).toBe(0);
    expect(FakeAudioContext.oscillators.length).toBe(0);

    await click("Go");
    expect(FakeAudioContext.instances.length).toBe(1);
    expect(FakeAudioContext.resumed).toBe(1);
    expect(new Set(startedWaves())).toEqual(new Set(["triangle"]));
    expect(startedHz()).toEqual([523.25, 659.25, 783.99, 1046.5]);

    const running = FakeAudioContext.oscillators;
    clearOscillators();
    await click("reset");
    running.forEach((oscillator) => expect(oscillator.stops.length).toBe(2));
    expect(new Set(startedWaves())).toEqual(new Set(["sine"]));
    expect(startedHz()).toEqual([196, 130.81]);
    const [g3, c3] = FakeAudioContext.oscillators;
    expect(c3.starts[0] - g3.starts[0]).toBeCloseTo(0.1, 5);

    clearOscillators();
    await click("reset");
    expect(FakeAudioContext.oscillators.length).toBe(0);
  } finally {
    clearOscillators();
    await cleanup();
  }
});

test("unmounting stops what is playing, with no extra sound", async () => {
  const { click, cleanup } = await renderDemo(PushbackDemo);
  await click("Go");
  const playing = FakeAudioContext.oscillators;
  clearOscillators();
  await cleanup();
  playing.forEach((oscillator) => expect(oscillator.stops.length).toBe(2));
  expect(FakeAudioContext.oscillators.length).toBe(0);
});

test("one sound setting: every toggle follows it, it is remembered, and off is silent", async () => {
  const first = await renderDemo(PushbackDemo);
  const second = await renderDemo(StackedPrsDemo);
  const toggle = (container) => container.querySelector(".demo-sound");
  const contexts = FakeAudioContext.instances.length;

  try {
    await first.click("sound on");
    expect(visibleLabel(toggle(first.container))).toBe("sound off");
    expect(visibleLabel(toggle(second.container))).toBe("sound off");
    expect(window.localStorage.getItem("blog-demo-sound")).toBe("off");

    await second.click("Go");
    expect(FakeAudioContext.oscillators.length).toBe(0);
    expect(FakeAudioContext.instances.length).toBe(contexts);

    await second.click("reset");
    expect(FakeAudioContext.oscillators.length).toBe(0);

    await second.click("sound off");
    expect(window.localStorage.getItem("blog-demo-sound")).toBe("on");
    await second.click("Go");
    expect(startedHz()).toEqual([523.25, 659.25, 783.99, 1046.5]);

    const playing = FakeAudioContext.oscillators;
    await first.click("sound on");
    playing.forEach((oscillator) => expect(oscillator.stops.length).toBe(2));
    await first.click("sound off");
  } finally {
    clearOscillators();
    await first.cleanup();
    await second.cleanup();
  }
});

test("blocked localStorage doesn't break the toggle", async () => {
  const descriptor = Object.getOwnPropertyDescriptor(dom.window, "localStorage");
  Object.defineProperty(dom.window, "localStorage", {
    configurable: true,
    get() {
      throw new Error("blocked");
    },
  });
  const { container, click, cleanup } = await renderDemo(PushbackDemo);
  try {
    await click("sound on");
    expect(visibleLabel(container.querySelector(".demo-sound"))).toBe("sound off");
    await click("sound off");
    expect(visibleLabel(container.querySelector(".demo-sound"))).toBe("sound on");
  } finally {
    await cleanup();
    if (descriptor) Object.defineProperty(dom.window, "localStorage", descriptor);
    else delete dom.window.localStorage;
  }
});

test("every cue is short and starts at its own time", () => {
  for (const [name, patch] of Object.entries(CUES)) {
    const longest = Math.max(...patch.notes.map((note) => note.at + note.seconds));
    expect(longest, name).toBeLessThanOrEqual(0.7);
    patch.notes.forEach((note) => expect(note.peak, name).toBeLessThanOrEqual(0.55));
  }
  const ctx = new FakeAudioContext();
  const { input } = buildOutput(ctx);
  clearOscillators();
  scheduleCue(ctx, input, "running");
  const starts = FakeAudioContext.oscillators.map((oscillator) => oscillator.starts[0]);
  [0.01, 0.15, 0.29].forEach((time, index) => expect(starts[index]).toBeCloseTo(time, 5));
  clearOscillators();
});

const FIRST_BLOG = "content/blogs/first-blog.md";

test("the first-blog post has its demos, its facts, and none of the banned content", async () => {
  const repoRoot = resolve(import.meta.dir, "../../../../../");
  const article = await readFile(resolve(repoRoot, FIRST_BLOG), "utf8");
  const names = Array.from(article.matchAll(/::demo\[([^\]]+)\]/g), (match) => match[1]);

  expect(names).toEqual(["pushback", "stacked-prs"]);
  names.forEach((name) => expect(name in demoRegistry).toBe(true));
  for (const part of [
    "at least 3 to 4 hours",
    "curl -fsSL https://opencode.ai/install | bash",
    "Cladius Fernando",
    "finished the deploy in Claude Code",
    "https://samwho.dev/",
    "https://test-blog-ruby-two.vercel.app/",
    "/blogs/durable-objects-rabbit-hole",
    "https://www.linkedin.com/feed/update/urn:li:activity:7520548724108939264/",
    "If the AI changes its answer when you question it, the first answer was never proof.",
    "## Hand this post to your agent",
    "(#hand-this-post-to-your-agent)",
    "Read this post first: https://pranavb.xyz/blogs/first-blog",
    "```mermaid",
    "Just never skip the checking and the pushback.",
    "cud u create me another version",
  ]) {
    expect(article).toContain(part);
  }
  expect(article).not.toContain("\u2014");
  expect(article).not.toMatch(/\b(he|she|his|her|hers|him|himself|herself)\b/i);
  expect(article).not.toMatch(
    /Senslyze|salary|ex-boss|left behind|10 to 20 PRs|top harness|the team|hire-me|chatgpt\.com\/share|Claudius|Do this today|matter more than the prompts/i,
  );
});

test("the first-blog post is in the sitemap and its images are on disk", async () => {
  const repoRoot = resolve(import.meta.dir, "../../../../../");
  const sitemap = await readFile(resolve(repoRoot, "apps/web/public/sitemap.xml"), "utf8");
  const article = await readFile(resolve(repoRoot, FIRST_BLOG), "utf8");

  expect(sitemap).toContain("https://pranavb.xyz/blogs/first-blog");
  const images = Array.from(article.matchAll(/!\[([^\]]+)\]\(([^)]+)\)/g), (match) => [match[1], match[2]]);
  expect(images.length).toBe(2);
  for (const [alt, path] of images) {
    expect(alt.length).toBeGreaterThan(20);
    expect((await readFile(resolve(repoRoot, "apps/web/public", `.${path}`))).length).toBeGreaterThan(1000);
  }
});

test("a prompt fence wraps its text and drops the word prompt, and a plain fence stays as it was", () => {
  const { html } = renderMarkdown("```prompt\nopen <site>\n```\n\n```\ngh auth login\n```");
  expect(html).toContain('<pre class="markdown-prompt"><code>open &lt;site&gt;</code></pre>');
  expect(html).toContain("<pre><code>gh auth login</code></pre>");
});

test("every code fence gets a copy button, and its language line never shows as code", () => {
  const { html } = renderMarkdown("```prompt\nopen <site>\n```\n\n```typescript\nconst a = 1;\n```");
  expect(html.match(/data-copy-code/g)?.length).toBe(2);
  expect(html).toContain('aria-label="Copy prompt"');
  expect(html).toContain('aria-label="Copy code"');
  expect(html).toContain("<pre><code>const a = 1;</code></pre>");
  expect(html).not.toContain("typescript");
});

test("a mermaid fence renders as an SVG diagram with no copy button", () => {
  const { html } = renderMarkdown('```mermaid\nflowchart TD\n  A["You type yourname.xyz"] --> B["Vercel"]\n```');
  expect(html).toContain('<figure class="markdown-diagram"><svg');
  expect(html).toContain("yourname.xyz");
  expect(html).not.toContain("data-copy-code");
  expect(html).not.toContain("flowchart TD");
});

test("a same-page anchor link stays in the tab, and outside links open a new one", () => {
  const { html } = renderMarkdown("[prompt](#hand-this-post-to-your-agent) and [site](https://samwho.dev/)");
  expect(html).toContain('<a href="#hand-this-post-to-your-agent" class="text-accent hover:underline">prompt</a>');
  expect(html).toContain('<a href="https://samwho.dev/" class="text-accent hover:underline" target="_blank"');
});
