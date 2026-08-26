import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import generatedVideos from "../generated/youtube-videos.json";
import { generatedYoutubeVideosSchema } from "./youtube-video-schema.ts";
import { homepageYoutubeVideos } from "./youtube-video-data.ts";

const homeVideoComponentPath = path.resolve(
  import.meta.dirname,
  "../components/home-video-library-section.tsx",
);

test("homepage videos are newest-first and limited to three", () => {
  const expectedIds = [...generatedVideos]
    .sort((first, second) => second.publishedAt.localeCompare(first.publishedAt))
    .slice(0, 3)
    .map((video) => video.id);

  expect(homepageYoutubeVideos.map((video) => video.id)).toEqual(expectedIds);
  expect(homepageYoutubeVideos.length).toBeLessThanOrEqual(3);
});

test("YouTube data maps to homepage fields without requiring companion post", () => {
  const source = generatedVideos.find((video) => !video.companionBlogId);
  const video = homepageYoutubeVideos.find((candidate) => candidate.id === source?.id);

  expect(video).toMatchObject({
    id: source?.id,
    title: source?.title,
    shortTitle: source?.title,
    date: source?.publishedAt.slice(0, 10),
    thumbnail: source?.thumbnail,
    youtubeUrl: `https://www.youtube.com/watch?v=${source?.id}`,
    blog: undefined,
  });
});

test("homepage hides companion link when no pairing exists and avoids local thumbnail srcsets", () => {
  const component = fs.readFileSync(homeVideoComponentPath, "utf8");

  expect(component).toContain("if (!video.blog)");
  expect(component).not.toContain("getVideoThumbnailSrcSet");
  expect(component).not.toContain("srcSet=");
});

test("every generated thumbnail exists and matches its content hash", () => {
  const publicDirectory = path.resolve(import.meta.dirname, "../../public");

  for (const video of generatedVideos) {
    const thumbnailPath = path.join(publicDirectory, video.thumbnail);
    const bytes = fs.readFileSync(thumbnailPath);
    const filenameHash = video.thumbnail.match(/-([a-f0-9]{12})\.jpg$/)?.[1];
    const contentHash = createHash("sha256").update(bytes).digest("hex").slice(0, 12);

    expect(filenameHash).toBe(contentHash);
    expect([...bytes.subarray(0, 2)]).toEqual([0xff, 0xd8]);
    expect([...bytes.subarray(-2)]).toEqual([0xff, 0xd9]);
    expect(readJpegDimensions(bytes)).toEqual({ width: 1280, height: 720 });
  }
});

test("generated YouTube data accepts complete safe records", () => {
  expect(generatedYoutubeVideosSchema.parse([validGeneratedVideo()])).toHaveLength(1);
});

test.each([
  ["video ID", { id: "too-short" }],
  ["title", { title: "  " }],
  ["summary", { summary: "" }],
  ["published timestamp", { publishedAt: "August 24" }],
  ["display duration", { duration: "PT15M3S" }],
  ["local thumbnail path", { thumbnail: "https://i.ytimg.com/example.jpg" }],
  ["thumbnail content hash", { thumbnail: "/video-previews/youtube/L3dtD_1UNII-nope.jpg" }],
  ["companion blog slug", { companionBlogId: "../unsafe" }],
])("generated YouTube data rejects invalid %s", (_label, invalidField) => {
  expect(() =>
    generatedYoutubeVideosSchema.parse([{ ...validGeneratedVideo(), ...invalidField }]),
  ).toThrow();
});

function validGeneratedVideo() {
  return {
    id: "L3dtD_1UNII",
    title: "Video title",
    summary: "Video summary",
    publishedAt: "2026-08-13T15:00:00.000Z",
    duration: "15:22",
    thumbnail: "/video-previews/youtube/L3dtD_1UNII-fa2fec00e505.jpg",
    companionBlogId: "safe-blog-slug",
  };
}

function readJpegDimensions(bytes) {
  const startOfFrameMarkers = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
  ]);
  let offset = 2;

  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    while (bytes[offset] === 0xff) {
      offset += 1;
    }
    const marker = bytes[offset];
    offset += 1;

    if (startOfFrameMarkers.has(marker)) {
      return {
        height: bytes.readUInt16BE(offset + 3),
        width: bytes.readUInt16BE(offset + 5),
      };
    }

    if (
      marker === 0xd8 ||
      marker === 0xd9 ||
      marker === 0x01 ||
      (marker >= 0xd0 && marker <= 0xd7)
    ) {
      continue;
    }

    const segmentLength = bytes.readUInt16BE(offset);
    if (segmentLength < 2) {
      break;
    }
    offset += segmentLength;
  }

  throw new Error("JPEG dimensions not found");
}
