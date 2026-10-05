import { expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";

const homeVideoComponentPath = path.resolve(
  import.meta.dirname,
  "../components/home-video-library-section.tsx",
);

test("feature-first layout places the two archive videos side by side without a brewing CTA", () => {
  const component = fs.readFileSync(homeVideoComponentPath, "utf8");

  expect(component).toContain('data-video-layout="featured"');
  expect(component).toContain('data-video-layout="archive-grid"');
  expect(component).toContain("sm:grid-cols-2");
  expect(component).not.toContain("Next video is brewing");
});

test("desktop archive cards stretch to equal heights", () => {
  const component = fs.readFileSync(homeVideoComponentPath, "utf8");

  expect(component).toContain('className="mt-4 grid items-stretch gap-4 sm:grid-cols-2"');
  expect(component).not.toContain('className="mt-4 grid items-start gap-4 sm:grid-cols-2"');
});
