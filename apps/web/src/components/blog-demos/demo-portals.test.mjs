import { expect, test } from "bun:test";
import { JSDOM } from "jsdom";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { act, createElement, useRef } from "react";
import { createRoot } from "react-dom/client";

import { BlogDemoPortals } from "./demo-portals.tsx";
import { demoRegistry } from "./registry.ts";
import { MergeQueueDemo } from "./merge-queue-demo.tsx";
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

test("merge queue changes phases without conflicting inline styles", async () => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const errors = [];
  const originalError = console.error;
  console.error = (...args) => errors.push(args.join(" "));

  try {
    await act(async () => {
      root.render(createElement(MergeQueueDemo));
    });

    const runButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "run merge queue",
    );
    expect(runButton).toBeDefined();

    await act(async () => {
      runButton?.click();
      await new Promise((resolve) => setTimeout(resolve, 1_200));
    });

    expect(errors.filter((error) => error.includes("conflicting property"))).toEqual([]);
  } finally {
    console.error = originalError;
    await act(async () => {
      root.unmount();
    });
    container.remove();
  }
});

test("merge queue rewires #3 onto #1 after #2 is ejected", async () => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  try {
    await act(async () => {
      root.render(createElement(MergeQueueDemo));
    });

    expect(container.querySelector('[data-chain-node="#3"]')?.getAttribute("data-parent")).toBe(
      "#2",
    );

    const clashToggle = container.querySelector('input[type="checkbox"]');
    const runButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "run merge queue",
    );

    await act(async () => {
      clashToggle?.click();
    });
    await act(async () => {
      runButton?.click();
      await new Promise((resolve) => setTimeout(resolve, 1_200));
    });

    expect(container.querySelector('[data-chain-node="#3"]')?.getAttribute("data-parent")).toBe(
      "#1",
    );
    expect(container.textContent).toContain("#2 ejected");
    expect(container.textContent).toContain("#3 now bases on #1");
  } finally {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  }
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
