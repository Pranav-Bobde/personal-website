import { expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";

import { getPublishedVideos } from "./video-preview-data.ts";

const homeVideoComponentPath = path.resolve(
  import.meta.dirname,
  "../components/home-video-library-section.tsx",
);

test("homepage video list only includes published YouTube uploads", () => {
  const videos = getPublishedVideos();

  expect(videos.map((video) => video.id)).toEqual([
    "merging-in-parallel",
    "token-cost-minimization",
  ]);
  expect(videos.map((video) => video.youtubeUrl)).toEqual([
    "https://www.youtube.com/watch?v=F-3bpi4f0U8",
    "https://www.youtube.com/watch?v=_PHYH45Gl1E",
  ]);
  expect(videos.map((video) => video.thumbnail)).toEqual([
    "/video-previews/merging-ai-agent-prs.jpg",
    "/video-previews/cheap-ai-costs-more.jpg",
  ]);
  expect(videos[0]).toMatchObject({
    title: "How Are People Merging So Many AI-Agent PRs?",
    date: "2026-07-23",
    duration: "10:49",
  });
  expect(videos.every((video) => video.stage === "published")).toBe(true);
});

test("feature-first layout pairs archive mini-cards with the selected brewing CTA", () => {
  const component = fs.readFileSync(homeVideoComponentPath, "utf8");
  const normalizedComponent = component.replace(/\s+/g, " ");

  expect(component).toContain('data-video-layout="featured"');
  expect(component).toContain('data-video-layout="archive-row"');
  expect(component).toContain('data-video-layout="mini-grid"');
  expect(component).toContain("md:items-stretch");
  expect(component).toContain("md:h-full");
  expect(component).toContain("Next video is brewing");
  expect(normalizedComponent).toContain(
    "Practical AI-agent workflows, dev-tool rabbit holes, and the parts that broke before they worked.",
  );
  expect(component).toContain("youtube channel →");
  expect(component).toContain("read the notes →");
});
