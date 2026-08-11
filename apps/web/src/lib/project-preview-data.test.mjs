import { expect, test } from "bun:test";

import { readFileSync } from "node:fs";

import { previewProjects, projectPreviewVariants } from "./project-preview-data.ts";

test("project previews expose the logbook with detail-modal variant", () => {
  expect(projectPreviewVariants).toContainEqual({
    to: "/preview/projects/logbook-detail",
    name: "logbook + detail",
    tagline: "Compact index, case-study depth on demand.",
    tradeoff:
      "Keeps the fast logbook scan, then uses Space to open the selected project as a focused case study without leaving the index.",
  });
});

test("closing the detail modal cannot reset the selected logbook row", () => {
  const pageSource = readFileSync(
    new URL("../components/projects-page.tsx", import.meta.url),
    "utf8",
  );

  expect(pageSource).toContain('itemSelector: ".project-log-detail-item"');
  expect(pageSource).toContain("enabled: !selectedProject");
  expect(pageSource).not.toContain("project-log-modal-paused");
  expect(pageSource).toContain("setActiveIndex(projectIndex)");
  expect(pageSource).toContain("onPreview={openProjectPreview}");
});

test("thread-sourced project descriptions are not draft copy", () => {
  for (const project of previewProjects) {
    expect(project.thesis.placeholder).toBe(false);
    expect(project.context.placeholder).toBe(false);
  }
});

test("logbook rows leave detailed notes to the modal preview", () => {
  const rowSource = readFileSync(
    new URL("../components/project-logbook-rows.tsx", import.meta.url),
    "utf8",
  );

  expect(rowSource).not.toContain("LogSpine");
  expect(rowSource).not.toContain("[notes");
});

test("final project metadata omits role, started, and status", () => {
  for (const project of previewProjects) {
    expect(project.facts.map((fact) => fact.key)).not.toContain("role");
    expect(project.facts.map((fact) => fact.key)).not.toContain("started");
    expect(project.facts.map((fact) => fact.key)).not.toContain("status");
  }
});

test("projects production route uses approved logbook detail experience", () => {
  const routeSource = readFileSync(new URL("../routes/projects.tsx", import.meta.url), "utf8");
  const configSource = readFileSync(new URL("./config.ts", import.meta.url), "utf8");
  const navigationSource = readFileSync(
    new URL("../components/navigation.tsx", import.meta.url),
    "utf8",
  );

  expect(routeSource).toContain("<ProjectsPage />");
  expect(routeSource).toContain("projectsPageSeo");
  expect(configSource).toContain("projects: true");
  expect(navigationSource).toContain("[p] projects");
});

test("project rows expose modal preview to pointer users", () => {
  const rowSource = readFileSync(
    new URL("../components/project-logbook-rows.tsx", import.meta.url),
    "utf8",
  );

  expect(rowSource).toContain("onPreview");
  expect(rowSource).toContain("event.stopPropagation()");
});

test("project keyboard hint names preview details", () => {
  const pageSource = readFileSync(
    new URL("../components/projects-page.tsx", import.meta.url),
    "utf8",
  );

  expect(pageSource).toContain("preview-details");
  expect(pageSource).not.toContain("> previews");
});
