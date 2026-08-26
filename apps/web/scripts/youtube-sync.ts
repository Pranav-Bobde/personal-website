import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const youtubeApiBaseUrl = "https://www.googleapis.com/youtube/v3";
const videoBatchSize = 50;
const thumbnailPublicDirectory = "/video-previews/youtube";
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const webDirectory = resolve(scriptDirectory, "..");

const environmentSchema = z.object({
  YOUTUBE_API_KEY: z.string().trim().min(1),
  YOUTUBE_CHANNEL_ID: z.string().trim().min(1),
});

const requiredBlogFrontmatter = ["title", "date", "readingTime", "summary", "tags"] as const;
const companionMarker =
  /^\s*(?:[-*]\s*)?(companion post|full blog|full interactive blog)\s*:\s*(.*)$/i;
const urlPattern = /https?:\/\/[^\s)\]]+/i;
const allUrlsPattern = /https?:\/\/[^\s)\]]+/gi;

const thumbnailSchema = z.object({
  url: z.string().url().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

const channelsResponseSchema = z.object({
  items: z
    .array(
      z.object({
        contentDetails: z.object({
          relatedPlaylists: z.object({ uploads: z.string().min(1) }),
        }),
      }),
    )
    .min(1),
});

const playlistItemsResponseSchema = z.object({
  items: z.array(
    z.object({
      contentDetails: z.object({ videoId: z.string().min(1) }),
    }),
  ),
  nextPageToken: z.string().min(1).optional(),
});

const videoResourceSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]+$/),
  snippet: z.object({
    title: z.string().min(1),
    description: z.string(),
    publishedAt: z.string().min(1),
    liveBroadcastContent: z.enum(["none", "live", "upcoming"]),
    thumbnails: z.record(z.string(), thumbnailSchema.optional()),
  }),
  contentDetails: z.object({ duration: z.string().min(1) }),
  status: z.object({ privacyStatus: z.enum(["private", "public", "unlisted"]) }),
});

const videosResponseSchema = z.object({
  items: z.array(videoResourceSchema),
});

export interface GeneratedYouTubeVideo {
  id: string;
  title: string;
  summary: string;
  publishedAt: string;
  duration: string;
  thumbnail: string;
  companionBlogId?: string;
}

interface ThumbnailAsset {
  bytes: Uint8Array;
  filename: string;
}

interface GeneratedVideoWithAsset {
  video: GeneratedYouTubeVideo;
  thumbnailAsset: ThumbnailAsset;
}

interface SyncOptions {
  apiKey: string;
  channelId: string;
  outputPath: string;
  thumbnailDirectory: string;
  blogDirectory: string;
  fetchImpl?: typeof fetch;
}

interface FetchOptions {
  apiKey: string;
  channelId: string;
  blogDirectory: string;
  fetchImpl?: typeof fetch;
}

interface YouTubeThumbnail {
  url?: string;
  width?: number;
  height?: number;
}

interface YouTubeVideoResource {
  id?: string;
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    liveBroadcastContent?: string;
    thumbnails?: Record<string, YouTubeThumbnail | undefined>;
  };
  contentDetails?: { duration?: string };
  status?: { privacyStatus?: string };
}

export function parseEnvironment(environment: Record<string, string | undefined>) {
  return environmentSchema.parse(environment);
}

export function formatDuration(duration: string) {
  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match || !(match[1] || match[2] || match[3])) {
    throw new Error(`Invalid YouTube duration: ${duration}`);
  }

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  const paddedSeconds = seconds.toString().padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${paddedSeconds}`;
  }

  return `${minutes}:${paddedSeconds}`;
}

function extractUrl(value: string) {
  return value.match(urlPattern)?.[0]?.replace(/[.,;]+$/, "");
}

function blogIdFromUrl(rawUrl: string) {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Companion post must use https://pranavb.xyz/blogs/<slug>");
  }

  const pathMatch = url.pathname.match(/^\/blogs\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/);
  if (url.protocol !== "https:" || url.hostname !== "pranavb.xyz" || !pathMatch) {
    throw new Error("Companion post must use https://pranavb.xyz/blogs/<slug>");
  }

  return pathMatch[1];
}

export function parseCompanionBlogId(description: string) {
  const lines = description.split(/\r?\n/);
  let pairedBlogId: string | undefined;

  for (let index = 0; index < lines.length; index += 1) {
    const markerMatch = lines[index]?.match(companionMarker);
    if (!markerMatch) {
      continue;
    }

    const rawUrl = extractUrl(markerMatch[2]) ?? extractUrl(lines[index + 1] ?? "");
    if (!rawUrl) {
      throw new Error("Companion post marker is missing its URL");
    }

    const blogId = blogIdFromUrl(rawUrl);
    if (pairedBlogId && pairedBlogId !== blogId) {
      throw new Error("YouTube description contains conflicting companion-post markers");
    }
    pairedBlogId = blogId;
  }

  return pairedBlogId;
}

function parseFrontmatter(markdown: string) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    return new Map<string, string>();
  }

  return new Map(
    match[1]
      .split(/\r?\n/)
      .map((line) => {
        const separator = line.indexOf(":");
        return separator === -1
          ? undefined
          : ([line.slice(0, separator).trim(), line.slice(separator + 1).trim()] as const);
      })
      .filter((entry): entry is readonly [string, string] => Boolean(entry)),
  );
}

function hasNonEmptyFrontmatter(metadata: Map<string, string>, key: string) {
  const fallbackKey =
    key === "readingTime" ? "readTime" : key === "summary" ? "description" : undefined;
  const value = metadata.get(key) ?? (fallbackKey ? metadata.get(fallbackKey) : undefined);
  if (!value) {
    return false;
  }
  if (key === "tags") {
    return value !== "[]";
  }
  return true;
}

export async function validateCompanionBlog(blogId: string, blogDirectory: string) {
  let markdown: string;
  try {
    markdown = await readFile(join(blogDirectory, `${blogId}.md`), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`Companion blog "${blogId}" does not exist locally`);
    }
    throw error;
  }

  const metadata = parseFrontmatter(markdown);
  const missingFields = requiredBlogFrontmatter.filter(
    (key) => !hasNonEmptyFrontmatter(metadata, key),
  );
  if (missingFields.length > 0) {
    throw new Error(
      `Companion blog "${blogId}" is missing frontmatter: ${missingFields.join(", ")}`,
    );
  }
}

function markerLineIndexes(lines: string[]) {
  const indexes = new Set<number>();
  for (let index = 0; index < lines.length; index += 1) {
    const markerMatch = lines[index]?.match(companionMarker);
    if (!markerMatch) {
      continue;
    }
    indexes.add(index);
    if (!extractUrl(markerMatch[2]) && extractUrl(lines[index + 1] ?? "")) {
      indexes.add(index + 1);
    }
  }
  return indexes;
}

export function descriptionToSummary(description: string) {
  const lines = description.split(/\r?\n/);
  const ignoredIndexes = markerLineIndexes(lines);
  const paragraphs: string[] = [];
  let paragraph: string[] = [];

  const finishParagraph = () => {
    const text = paragraph
      .join(" ")
      .replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/gi, "$1")
      .replace(allUrlsPattern, "")
      .replace(/\s+/g, " ")
      .trim();
    const isSectionLabel = /^(?:#+\s*)?[\w\s/&-]+:\s*$/i.test(text);
    if (text && !isSectionLabel) {
      paragraphs.push(text);
    }
    paragraph = [];
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]?.trim() ?? "";
    if (ignoredIndexes.has(index) || line === "") {
      finishParagraph();
      continue;
    }
    paragraph.push(line);
  }
  finishParagraph();

  return paragraphs[0] ?? "";
}

function requireSummary(videoId: string, description: string) {
  const summary = descriptionToSummary(description);
  if (!summary) {
    throw new Error(`Published YouTube video "${videoId}" has no usable summary`);
  }
  return summary;
}

function youtubeUrl(endpoint: string, parameters: Record<string, string>) {
  const url = new URL(`${youtubeApiBaseUrl}/${endpoint}`);
  for (const [key, value] of Object.entries(parameters)) {
    url.searchParams.set(key, value);
  }
  return url;
}

async function fetchJson(fetchImpl: typeof fetch, url: URL) {
  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new Error(`YouTube API request failed (${response.status}): ${await response.text()}`);
  }
  return (await response.json()) as Record<string, unknown>;
}

function validateApiResponse<T>(endpoint: string, schema: z.ZodType<T>, data: unknown) {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(
      `Invalid YouTube API response for ${endpoint}: ${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}

async function fetchUploadsPlaylistId(fetchImpl: typeof fetch, apiKey: string, channelId: string) {
  const data = validateApiResponse(
    "channels",
    channelsResponseSchema,
    await fetchJson(
      fetchImpl,
      youtubeUrl("channels", { part: "contentDetails", id: channelId, key: apiKey }),
    ),
  );
  return data.items[0].contentDetails.relatedPlaylists.uploads;
}

async function fetchUploadIds(fetchImpl: typeof fetch, apiKey: string, playlistId: string) {
  const ids: string[] = [];
  let pageToken: string | undefined;

  do {
    const parameters: Record<string, string> = {
      part: "contentDetails",
      maxResults: "50",
      playlistId,
      key: apiKey,
    };
    if (pageToken) {
      parameters.pageToken = pageToken;
    }
    const data = validateApiResponse(
      "playlistItems",
      playlistItemsResponseSchema,
      await fetchJson(fetchImpl, youtubeUrl("playlistItems", parameters)),
    );
    for (const item of data.items) {
      ids.push(item.contentDetails.videoId);
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  return ids;
}

function batches<T>(items: T[], size: number) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  );
}

function validateReturnedVideoIds(requestedIds: string[], resources: YouTubeVideoResource[]) {
  if (resources.length === 0) {
    throw new Error(`YouTube API resolved ${requestedIds.length} uploads to zero video resources`);
  }
  const requested = JSON.stringify([...requestedIds].sort());
  const returned = JSON.stringify(resources.map((resource) => resource.id).sort());
  if (requested !== returned) {
    throw new Error("YouTube API videos response IDs did not match requested batch");
  }
}

async function fetchVideoResources(fetchImpl: typeof fetch, apiKey: string, ids: string[]) {
  const resources: YouTubeVideoResource[] = [];
  for (const batch of batches(ids, videoBatchSize)) {
    const data = validateApiResponse(
      "videos",
      videosResponseSchema,
      await fetchJson(
        fetchImpl,
        youtubeUrl("videos", {
          part: "snippet,contentDetails,status",
          id: batch.join(","),
          maxResults: "50",
          key: apiKey,
        }),
      ),
    );
    validateReturnedVideoIds(batch, data.items);
    resources.push(...data.items);
  }
  return resources;
}

function chooseThumbnail(thumbnails: Record<string, YouTubeThumbnail | undefined> | undefined) {
  const thumbnail = ["maxres", "standard", "high", "medium", "default"]
    .map((name) => thumbnails?.[name])
    .find((candidate) => candidate?.url);
  if (!thumbnail?.url) {
    throw new Error("Published YouTube video has no thumbnail");
  }
  return thumbnail.url;
}

async function fetchThumbnailAsset(fetchImpl: typeof fetch, videoId: string, thumbnailUrl: string) {
  const response = await fetchImpl(thumbnailUrl);
  if (!response.ok) {
    throw new Error(`YouTube thumbnail request failed (${response.status}): ${thumbnailUrl}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
    throw new Error(`YouTube thumbnail response was not a JPEG: ${thumbnailUrl}`);
  }
  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 12);
  return {
    bytes,
    filename: `${videoId}-${hash}.jpg`,
  };
}

async function validatedCompanionBlogId(description: string, blogDirectory: string) {
  const companionBlogId = parseCompanionBlogId(description);
  if (!companionBlogId) {
    return undefined;
  }
  await validateCompanionBlog(companionBlogId, blogDirectory);
  return companionBlogId;
}

async function toGeneratedVideo(
  video: YouTubeVideoResource,
  blogDirectory: string,
  fetchImpl: typeof fetch,
): Promise<GeneratedVideoWithAsset> {
  const metadata = videoResourceSchema.parse(video);
  const companionBlogId = await validatedCompanionBlogId(
    metadata.snippet.description,
    blogDirectory,
  );
  const summary = requireSummary(metadata.id, metadata.snippet.description);
  const thumbnailUrl = chooseThumbnail(metadata.snippet.thumbnails);
  const thumbnailAsset = await fetchThumbnailAsset(fetchImpl, metadata.id, thumbnailUrl);
  return {
    video: {
      id: metadata.id,
      title: metadata.snippet.title,
      summary,
      publishedAt: new Date(metadata.snippet.publishedAt).toISOString(),
      duration: formatDuration(metadata.contentDetails.duration),
      thumbnail: `${thumbnailPublicDirectory}/${thumbnailAsset.filename}`,
      ...(companionBlogId ? { companionBlogId } : {}),
    },
    thumbnailAsset,
  };
}

async function fetchYouTubeSyncData(options: FetchOptions) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const uploadsPlaylistId = await fetchUploadsPlaylistId(
    fetchImpl,
    options.apiKey,
    options.channelId,
  );
  const uploadIds = await fetchUploadIds(fetchImpl, options.apiKey, uploadsPlaylistId);
  const resources = await fetchVideoResources(fetchImpl, options.apiKey, uploadIds);
  const publishedResources = resources.filter(
    (video) =>
      video.status?.privacyStatus === "public" &&
      video.snippet?.liveBroadcastContent !== "upcoming",
  );
  const generated = await Promise.all(
    publishedResources.map((video) => toGeneratedVideo(video, options.blogDirectory, fetchImpl)),
  );

  return generated.sort((left, right) => {
    const byDate = right.video.publishedAt.localeCompare(left.video.publishedAt);
    return byDate === 0 ? left.video.id.localeCompare(right.video.id) : byDate;
  });
}

export async function fetchYouTubeVideos(options: FetchOptions) {
  return (await fetchYouTubeSyncData(options)).map(({ video }) => video);
}

export async function writeIfChanged(outputPath: string, content: string) {
  let existing: string | undefined;
  try {
    existing = await readFile(outputPath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
  if (existing === content) {
    return false;
  }
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, content);
  return true;
}

async function writeBytesIfChanged(outputPath: string, bytes: Uint8Array) {
  try {
    const existing = await readFile(outputPath);
    if (existing.equals(bytes)) {
      return false;
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, bytes);
  return true;
}

async function writeThumbnailAssets(thumbnailDirectory: string, assets: ThumbnailAsset[]) {
  await mkdir(thumbnailDirectory, { recursive: true });
  let changed = false;
  for (const asset of assets) {
    changed =
      (await writeBytesIfChanged(join(thumbnailDirectory, asset.filename), asset.bytes)) || changed;
  }
  return changed;
}

async function removeObsoleteThumbnailAssets(
  thumbnailDirectory: string,
  currentAssets: ThumbnailAsset[],
) {
  const currentFilenames = new Set(currentAssets.map(({ filename }) => filename));
  const filenames = await readdir(thumbnailDirectory);
  const obsoleteFilenames = filenames.filter(
    (filename) =>
      /^[A-Za-z0-9_-]+-[a-f0-9]{12}\.jpg$/.test(filename) && !currentFilenames.has(filename),
  );
  await Promise.all(
    obsoleteFilenames.map((filename) => unlink(join(thumbnailDirectory, filename))),
  );
  return obsoleteFilenames.length > 0;
}

async function hasExistingGeneratedVideos(outputPath: string) {
  try {
    const parsed = JSON.parse(await readFile(outputPath, "utf8"));
    if (!Array.isArray(parsed)) {
      throw new Error(`Existing generated YouTube data is not an array: ${outputPath}`);
    }
    return parsed.length > 0;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

async function hasExistingManagedThumbnails(thumbnailDirectory: string) {
  try {
    return (await readdir(thumbnailDirectory)).some((filename) =>
      /^[A-Za-z0-9_-]+-[a-f0-9]{12}\.jpg$/.test(filename),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

async function rejectSuspiciousEmptyFeed(options: SyncOptions, videos: GeneratedYouTubeVideo[]) {
  if (videos.length > 0) {
    return;
  }
  const [hasVideos, hasThumbnails] = await Promise.all([
    hasExistingGeneratedVideos(options.outputPath),
    hasExistingManagedThumbnails(options.thumbnailDirectory),
  ]);
  if (hasVideos || hasThumbnails) {
    throw new Error("Refusing to replace nonempty generated YouTube data with an empty feed");
  }
}

export async function syncYouTubeVideos(options: SyncOptions) {
  const generated = await fetchYouTubeSyncData(options);
  const videos = generated.map(({ video }) => video);
  const thumbnailAssets = generated.map(({ thumbnailAsset }) => thumbnailAsset);
  await rejectSuspiciousEmptyFeed(options, videos);
  const thumbnailChanged = await writeThumbnailAssets(options.thumbnailDirectory, thumbnailAssets);
  const jsonChanged = await writeIfChanged(
    options.outputPath,
    `${JSON.stringify(videos, null, 2)}\n`,
  );
  const removedObsoleteAsset = await removeObsoleteThumbnailAssets(
    options.thumbnailDirectory,
    thumbnailAssets,
  );
  return thumbnailChanged || jsonChanged || removedObsoleteAsset;
}

async function main() {
  const environment = parseEnvironment(process.env);
  const outputPath = join(webDirectory, "src/generated/youtube-videos.json");
  const changed = await syncYouTubeVideos({
    apiKey: environment.YOUTUBE_API_KEY,
    channelId: environment.YOUTUBE_CHANNEL_ID,
    outputPath,
    thumbnailDirectory: join(webDirectory, "public/video-previews/youtube"),
    blogDirectory: resolve(webDirectory, "../../content/blogs"),
  });
  process.stdout.write(changed ? `Updated ${outputPath}\n` : `No YouTube video changes\n`);
}

if (import.meta.main) {
  await main();
}
