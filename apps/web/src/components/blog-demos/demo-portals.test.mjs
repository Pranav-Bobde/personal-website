import { expect, test } from "bun:test";
import { JSDOM } from "jsdom";
import { act, createElement, useRef } from "react";
import { createRoot } from "react-dom/client";

import { BlogDemoPortals } from "./demo-portals.tsx";
import { MergeQueueDemo } from "./merge-queue-demo.tsx";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
});

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  Element: dom.window.Element,
  HTMLElement: dom.window.HTMLElement,
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
