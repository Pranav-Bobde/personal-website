import { expect, test } from "bun:test";

import { getPublishedVideos } from "./video-preview-data.ts";

test("homepage video list only includes published YouTube uploads", () => {
  const videos = getPublishedVideos();

  expect(videos.map((video) => video.id)).toEqual(["token-cost-minimization"]);
  expect(videos.map((video) => video.youtubeUrl)).toEqual([
    "https://www.youtube.com/watch?v=_PHYH45Gl1E",
  ]);
  expect(videos.map((video) => video.thumbnail)).toEqual([
    "/video-previews/cheap-ai-costs-more.jpg",
  ]);
  expect(videos.every((video) => video.stage === "published")).toBe(true);
});
