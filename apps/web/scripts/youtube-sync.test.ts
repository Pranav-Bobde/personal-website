// @ts-nocheck -- Bun's test globals are runtime-only in this package; production script remains typechecked.
import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const temporaryDirectories: string[] = [];

async function temporaryDirectory() {
  const directory = await mkdtemp(join(tmpdir(), "youtube-sync-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  );
});

function jpegBytes(marker: string) {
  return new Uint8Array([0xff, 0xd8, 0xff, ...new TextEncoder().encode(marker), 0xff, 0xd9]);
}

function singleVideoFetch(image: Uint8Array | Response) {
  return async (input: string | URL | Request) => {
    const url = new URL(input.toString());
    const endpoint = url.pathname.split("/").at(-1);
    if (endpoint === "channels") {
      return Response.json({
        items: [{ contentDetails: { relatedPlaylists: { uploads: "uploads" } } }],
      });
    }
    if (endpoint === "playlistItems") {
      return Response.json({ items: [{ contentDetails: { videoId: "video-1" } }] });
    }
    if (endpoint === "videos") {
      return Response.json({
        items: [
          {
            id: "video-1",
            snippet: {
              title: "Title",
              description: "Summary",
              publishedAt: "2026-08-01T00:00:00Z",
              liveBroadcastContent: "none",
              thumbnails: {
                high: { url: "https://i.ytimg.com/vi/video-1/maxresdefault.jpg" },
              },
            },
            contentDetails: { duration: "PT1M" },
            status: { privacyStatus: "public" },
          },
        ],
      });
    }
    return image instanceof Response
      ? image
      : new Response(image, { headers: { "content-type": "image/jpeg" } });
  };
}

describe("YouTube sync", () => {
  test("exports the sync implementation", async () => {
    const module = await import("./youtube-sync").catch(() => undefined);

    expect(module?.syncYouTubeVideos).toBeFunction();
  });

  test("formats ISO 8601 durations for display", async () => {
    const { formatDuration } = await import("./youtube-sync");

    expect(formatDuration("PT49S")).toBe("0:49");
    expect(formatDuration("PT15M3S")).toBe("15:03");
    expect(formatDuration("PT1H2M9S")).toBe("1:02:09");
    expect(() => formatDuration("not-a-duration")).toThrow("Invalid YouTube duration");
  });

  test("recognizes explicit current and legacy companion-post markers", async () => {
    const { parseCompanionBlogId } = await import("./youtube-sync");

    expect(parseCompanionBlogId("Companion post: https://pranavb.xyz/blogs/one")).toBe("one");
    expect(parseCompanionBlogId("Full blog:\nhttps://pranavb.xyz/blogs/two/")).toBe("two");
    expect(
      parseCompanionBlogId("Full interactive blog:\n[Read it](https://pranavb.xyz/blogs/three)"),
    ).toBe("three");
  });

  test("ignores ordinary resource links and rejects invalid explicit companion links", async () => {
    const { parseCompanionBlogId } = await import("./youtube-sync");

    expect(
      parseCompanionBlogId("Resources:\nhttps://pranavb.xyz/blogs/not-a-pairing"),
    ).toBeUndefined();
    expect(() => parseCompanionBlogId("Companion post: https://example.com/blogs/wrong")).toThrow(
      "must use https://pranavb.xyz/blogs/<slug>",
    );
  });

  test("requires a matching local blog with complete frontmatter", async () => {
    const { validateCompanionBlog } = await import("./youtube-sync");
    const directory = await temporaryDirectory();
    await writeFile(
      join(directory, "valid.md"),
      '---\ntitle: "Valid"\ndate: "2026-08-01"\nreadingTime: "4 min read"\nsummary: "Summary"\ntags: ["one"]\n---\nBody\n',
    );
    await writeFile(join(directory, "invalid.md"), '---\ntitle: "Invalid"\n---\nBody\n');

    await expect(validateCompanionBlog("valid", directory)).resolves.toBeUndefined();
    await expect(validateCompanionBlog("missing", directory)).rejects.toThrow(
      "does not exist locally",
    );
    await expect(validateCompanionBlog("invalid", directory)).rejects.toThrow(
      "missing frontmatter",
    );
  });

  test("derives a deterministic summary without markers or AI", async () => {
    const { descriptionToSummary } = await import("./youtube-sync");
    const description = [
      "First line of the summary.",
      "Second line of the same paragraph.",
      "",
      "Companion post:",
      "https://pranavb.xyz/blogs/example",
      "",
      "Resources: https://example.com",
    ].join("\n");

    expect(descriptionToSummary(description)).toBe(
      "First line of the summary. Second line of the same paragraph.",
    );
  });

  test("keeps prose from a paragraph containing an inline URL", async () => {
    const { descriptionToSummary } = await import("./youtube-sync");

    expect(descriptionToSummary("Read the benchmark https://example.com before deciding.")).toBe(
      "Read the benchmark before deciding.",
    );
  });

  test("paginates uploads, batches video lookup, filters non-public and upcoming videos, then sorts newest first", async () => {
    const { fetchYouTubeVideos } = await import("./youtube-sync");
    const ids = Array.from({ length: 51 }, (_, index) => `video-${index + 1}`);
    const videoRequestSizes: number[] = [];
    const fetchImpl = async (input: string | URL | Request) => {
      const url = new URL(input.toString());
      const endpoint = url.pathname.split("/").at(-1);

      if (endpoint === "channels") {
        return Response.json({
          items: [{ contentDetails: { relatedPlaylists: { uploads: "uploads" } } }],
        });
      }

      if (endpoint === "playlistItems") {
        const secondPage = url.searchParams.get("pageToken") === "next";
        return Response.json(
          secondPage
            ? { items: ids.slice(50).map((id) => ({ contentDetails: { videoId: id } })) }
            : {
                items: ids.slice(0, 50).map((id) => ({ contentDetails: { videoId: id } })),
                nextPageToken: "next",
              },
        );
      }

      if (endpoint === "videos") {
        const requestedIds = url.searchParams.get("id")!.split(",");
        videoRequestSizes.push(requestedIds.length);
        return Response.json({
          items: requestedIds.map((id) => ({
            id,
            snippet: {
              title: `Title ${id}`,
              description:
                id === "video-51"
                  ? "Summary\n\nCompanion post: https://pranavb.xyz/blogs/paired"
                  : "Summary",
              publishedAt: id === "video-51" ? "2026-08-03T00:00:00Z" : "2026-08-01T00:00:00Z",
              liveBroadcastContent: id === "video-2" ? "upcoming" : "none",
              thumbnails: { high: { url: `https://i.ytimg.com/${id}.jpg` } },
            },
            contentDetails: { duration: "PT1M2S" },
            status: { privacyStatus: id === "video-1" ? "private" : "public" },
          })),
        });
      }

      if (url.hostname === "i.ytimg.com") {
        return new Response(jpegBytes(url.pathname), {
          headers: { "content-type": "image/jpeg" },
        });
      }

      return new Response("unexpected", { status: 500 });
    };
    const blogDirectory = await temporaryDirectory();
    await writeFile(
      join(blogDirectory, "paired.md"),
      '---\ntitle: "Paired"\ndate: "2026-08-01"\nreadingTime: "4 min read"\nsummary: "Summary"\ntags: ["one"]\n---\nBody\n',
    );

    const videos = await fetchYouTubeVideos({
      apiKey: "api-key",
      channelId: "channel-id",
      blogDirectory,
      fetchImpl: fetchImpl as typeof fetch,
    });

    expect(videoRequestSizes).toEqual([50, 1]);
    expect(videos).toHaveLength(49);
    expect(videos[0]).toEqual({
      id: "video-51",
      title: "Title video-51",
      summary: "Summary",
      publishedAt: "2026-08-03T00:00:00.000Z",
      duration: "1:02",
      thumbnail: expect.stringMatching(/^\/video-previews\/youtube\/video-51-[a-f0-9]{12}\.jpg$/),
      companionBlogId: "paired",
    });
    expect(videos.some((video) => video.id === "video-1")).toBeFalse();
    expect(videos.some((video) => video.id === "video-2")).toBeFalse();
  });

  test("does not rewrite unchanged bytes", async () => {
    const { writeIfChanged } = await import("./youtube-sync");
    const directory = await temporaryDirectory();
    const outputPath = join(directory, "youtube-videos.json");
    await writeFile(outputPath, "[]\n");
    const before = await stat(outputPath);

    expect(await writeIfChanged(outputPath, "[]\n")).toBeFalse();
    expect((await stat(outputPath)).mtimeMs).toBe(before.mtimeMs);
    expect(await writeIfChanged(outputPath, '[{"id":"new"}]\n')).toBeTrue();
  });

  test("reuses a content-addressed thumbnail when image bytes are unchanged", async () => {
    const { syncYouTubeVideos } = await import("./youtube-sync");
    const directory = await temporaryDirectory();
    const outputPath = join(directory, "youtube-videos.json");
    const thumbnailDirectory = join(directory, "thumbnails");
    const options = {
      apiKey: "api-key",
      channelId: "channel-id",
      outputPath,
      thumbnailDirectory,
      blogDirectory: directory,
      fetchImpl: singleVideoFetch(jpegBytes("same")) as typeof fetch,
    };

    expect(await syncYouTubeVideos(options)).toBeTrue();
    const firstJsonStat = await stat(outputPath);
    const [thumbnailFilename] = await readdir(thumbnailDirectory);
    const firstThumbnailStat = await stat(join(thumbnailDirectory, thumbnailFilename));
    expect(await syncYouTubeVideos(options)).toBeFalse();
    expect((await stat(outputPath)).mtimeMs).toBe(firstJsonStat.mtimeMs);
    expect((await stat(join(thumbnailDirectory, thumbnailFilename))).mtimeMs).toBe(
      firstThumbnailStat.mtimeMs,
    );
  });

  test("writes changed thumbnail bytes under a new hash and removes the obsolete asset", async () => {
    const { syncYouTubeVideos } = await import("./youtube-sync");
    const directory = await temporaryDirectory();
    const outputPath = join(directory, "youtube-videos.json");
    const thumbnailDirectory = join(directory, "thumbnails");
    const baseOptions = {
      apiKey: "api-key",
      channelId: "channel-id",
      outputPath,
      thumbnailDirectory,
      blogDirectory: directory,
    };

    await syncYouTubeVideos({
      ...baseOptions,
      fetchImpl: singleVideoFetch(jpegBytes("first")) as typeof fetch,
    });
    const [firstFilename] = await readdir(thumbnailDirectory);
    await syncYouTubeVideos({
      ...baseOptions,
      fetchImpl: singleVideoFetch(jpegBytes("second")) as typeof fetch,
    });
    const filenames = await readdir(thumbnailDirectory);
    const generated = JSON.parse(await readFile(outputPath, "utf8"));

    expect(filenames).toHaveLength(1);
    expect(filenames[0]).not.toBe(firstFilename);
    expect(generated[0].thumbnail).toBe(`/video-previews/youtube/${filenames[0]}`);
    expect(new Uint8Array(await readFile(join(thumbnailDirectory, filenames[0])))).toEqual(
      jpegBytes("second"),
    );
  });

  test("preserves prior JSON and thumbnail assets when a thumbnail fetch fails", async () => {
    const { syncYouTubeVideos } = await import("./youtube-sync");
    const directory = await temporaryDirectory();
    const outputPath = join(directory, "youtube-videos.json");
    const thumbnailDirectory = join(directory, "thumbnails");
    await mkdir(thumbnailDirectory);
    await writeFile(outputPath, '[{"id":"prior"}]\n');
    await writeFile(join(thumbnailDirectory, "prior-deadbeef0000.jpg"), jpegBytes("prior"));

    await expect(
      syncYouTubeVideos({
        apiKey: "api-key",
        channelId: "channel-id",
        outputPath,
        thumbnailDirectory,
        blogDirectory: directory,
        fetchImpl: singleVideoFetch(new Response("failed", { status: 500 })) as typeof fetch,
      }),
    ).rejects.toThrow("YouTube thumbnail request failed (500)");
    expect(await readFile(outputPath, "utf8")).toBe('[{"id":"prior"}]\n');
    expect(await readdir(thumbnailDirectory)).toEqual(["prior-deadbeef0000.jpg"]);
    expect(
      new Uint8Array(await readFile(join(thumbnailDirectory, "prior-deadbeef0000.jpg"))),
    ).toEqual(jpegBytes("prior"));
  });

  test("preserves nonempty prior JSON and assets when the uploads playlist is empty", async () => {
    const { syncYouTubeVideos } = await import("./youtube-sync");
    const directory = await temporaryDirectory();
    const outputPath = join(directory, "youtube-videos.json");
    const thumbnailDirectory = join(directory, "thumbnails");
    await mkdir(thumbnailDirectory);
    await writeFile(outputPath, '[{"id":"prior"}]\n');
    await writeFile(join(thumbnailDirectory, "prior-deadbeef0000.jpg"), jpegBytes("prior"));
    const fetchImpl = async (input: string | URL | Request) => {
      const endpoint = new URL(input.toString()).pathname.split("/").at(-1);
      if (endpoint === "channels") {
        return Response.json({
          items: [{ contentDetails: { relatedPlaylists: { uploads: "uploads" } } }],
        });
      }
      return Response.json({ items: [] });
    };

    await expect(
      syncYouTubeVideos({
        apiKey: "api-key",
        channelId: "channel-id",
        outputPath,
        thumbnailDirectory,
        blogDirectory: directory,
        fetchImpl: fetchImpl as typeof fetch,
      }),
    ).rejects.toThrow("Refusing to replace nonempty generated YouTube data with an empty feed");
    expect(await readFile(outputPath, "utf8")).toBe('[{"id":"prior"}]\n');
    expect(await readdir(thumbnailDirectory)).toEqual(["prior-deadbeef0000.jpg"]);
    expect(
      new Uint8Array(await readFile(join(thumbnailDirectory, "prior-deadbeef0000.jpg"))),
    ).toEqual(jpegBytes("prior"));
  });

  test("preserves prior output when the YouTube API fails", async () => {
    const { syncYouTubeVideos } = await import("./youtube-sync");
    const directory = await temporaryDirectory();
    const outputPath = join(directory, "youtube-videos.json");
    await writeFile(outputPath, '[{"id":"prior"}]\n');

    await expect(
      syncYouTubeVideos({
        apiKey: "api-key",
        channelId: "channel-id",
        outputPath,
        blogDirectory: directory,
        fetchImpl: async () => new Response("quota exhausted", { status: 403 }),
      }),
    ).rejects.toThrow("YouTube API request failed (403)");
    expect(await readFile(outputPath, "utf8")).toBe('[{"id":"prior"}]\n');
  });

  test("preserves prior output when an HTTP 200 video response omits items", async () => {
    const { syncYouTubeVideos } = await import("./youtube-sync");
    const directory = await temporaryDirectory();
    const outputPath = join(directory, "youtube-videos.json");
    await writeFile(outputPath, '[{"id":"prior"}]\n');
    const fetchImpl = async (input: string | URL | Request) => {
      const endpoint = new URL(input.toString()).pathname.split("/").at(-1);
      if (endpoint === "channels") {
        return Response.json({
          items: [{ contentDetails: { relatedPlaylists: { uploads: "uploads" } } }],
        });
      }
      if (endpoint === "playlistItems") {
        return Response.json({ items: [{ contentDetails: { videoId: "video-1" } }] });
      }
      return Response.json({});
    };

    await expect(
      syncYouTubeVideos({
        apiKey: "api-key",
        channelId: "channel-id",
        outputPath,
        blogDirectory: directory,
        fetchImpl: fetchImpl as typeof fetch,
      }),
    ).rejects.toThrow("Invalid YouTube API response for videos");
    expect(await readFile(outputPath, "utf8")).toBe('[{"id":"prior"}]\n');
  });

  test("preserves prior output when nonempty uploads resolve to zero video resources", async () => {
    const { syncYouTubeVideos } = await import("./youtube-sync");
    const directory = await temporaryDirectory();
    const outputPath = join(directory, "youtube-videos.json");
    await writeFile(outputPath, '[{"id":"prior"}]\n');
    const fetchImpl = async (input: string | URL | Request) => {
      const endpoint = new URL(input.toString()).pathname.split("/").at(-1);
      if (endpoint === "channels") {
        return Response.json({
          items: [{ contentDetails: { relatedPlaylists: { uploads: "uploads" } } }],
        });
      }
      if (endpoint === "playlistItems") {
        return Response.json({ items: [{ contentDetails: { videoId: "video-1" } }] });
      }
      return Response.json({ items: [] });
    };

    await expect(
      syncYouTubeVideos({
        apiKey: "api-key",
        channelId: "channel-id",
        outputPath,
        blogDirectory: directory,
        fetchImpl: fetchImpl as typeof fetch,
      }),
    ).rejects.toThrow("resolved 1 uploads to zero video resources");
    expect(await readFile(outputPath, "utf8")).toBe('[{"id":"prior"}]\n');
  });

  test("preserves prior output when a video batch returns only some requested IDs", async () => {
    const { syncYouTubeVideos } = await import("./youtube-sync");
    const directory = await temporaryDirectory();
    const outputPath = join(directory, "youtube-videos.json");
    await writeFile(outputPath, '[{"id":"prior"}]\n');
    const fetchImpl = async (input: string | URL | Request) => {
      const endpoint = new URL(input.toString()).pathname.split("/").at(-1);
      if (endpoint === "channels") {
        return Response.json({
          items: [{ contentDetails: { relatedPlaylists: { uploads: "uploads" } } }],
        });
      }
      if (endpoint === "playlistItems") {
        return Response.json({
          items: ["video-1", "video-2"].map((videoId) => ({ contentDetails: { videoId } })),
        });
      }
      return Response.json({
        items: [
          {
            id: "video-1",
            snippet: {
              title: "Title",
              description: "Summary",
              publishedAt: "2026-08-01T00:00:00Z",
              liveBroadcastContent: "none",
              thumbnails: { high: { url: "https://i.ytimg.com/video-1.jpg" } },
            },
            contentDetails: { duration: "PT1M" },
            status: { privacyStatus: "public" },
          },
        ],
      });
    };

    await expect(
      syncYouTubeVideos({
        apiKey: "api-key",
        channelId: "channel-id",
        outputPath,
        blogDirectory: directory,
        fetchImpl: fetchImpl as typeof fetch,
      }),
    ).rejects.toThrow("YouTube API videos response IDs did not match requested batch");
    expect(await readFile(outputPath, "utf8")).toBe('[{"id":"prior"}]\n');
  });

  test("preserves prior output when a published video has no usable summary prose", async () => {
    const { syncYouTubeVideos } = await import("./youtube-sync");
    const directory = await temporaryDirectory();
    const outputPath = join(directory, "youtube-videos.json");
    await writeFile(outputPath, '[{"id":"prior"}]\n');
    const fetchImpl = async (input: string | URL | Request) => {
      const url = new URL(input.toString());
      const endpoint = url.pathname.split("/").at(-1);
      if (endpoint === "channels") {
        return Response.json({
          items: [{ contentDetails: { relatedPlaylists: { uploads: "uploads" } } }],
        });
      }
      if (endpoint === "playlistItems") {
        return Response.json({ items: [{ contentDetails: { videoId: "video-1" } }] });
      }
      if (endpoint === "videos") {
        return Response.json({
          items: [
            {
              id: "video-1",
              snippet: {
                title: "Title",
                description: "Resources:\nhttps://example.com",
                publishedAt: "2026-08-01T00:00:00Z",
                liveBroadcastContent: "none",
                thumbnails: { high: { url: "https://i.ytimg.com/video-1.jpg" } },
              },
              contentDetails: { duration: "PT1M" },
              status: { privacyStatus: "public" },
            },
          ],
        });
      }
      return new Response("thumbnail");
    };

    await expect(
      syncYouTubeVideos({
        apiKey: "api-key",
        channelId: "channel-id",
        outputPath,
        blogDirectory: directory,
        fetchImpl: fetchImpl as typeof fetch,
      }),
    ).rejects.toThrow('Published YouTube video "video-1" has no usable summary');
    expect(await readFile(outputPath, "utf8")).toBe('[{"id":"prior"}]\n');
  });

  test("validates required YouTube environment variables", async () => {
    const { parseEnvironment } = await import("./youtube-sync");

    expect(parseEnvironment({ YOUTUBE_API_KEY: "key", YOUTUBE_CHANNEL_ID: "channel" })).toEqual({
      YOUTUBE_API_KEY: "key",
      YOUTUBE_CHANNEL_ID: "channel",
    });
    expect(() => parseEnvironment({})).toThrow();
  });
});
