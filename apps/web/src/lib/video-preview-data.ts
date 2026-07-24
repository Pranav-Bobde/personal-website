/**
 * Video data shared by the review previews and shipped homepage. Preview routes can
 * show candidate topics, but the homepage must filter this list to published uploads.
 */

export type VideoStage = "published" | "editing" | "scripted";

export interface PreviewVideoNote {
  date: string;
  label: string;
  body: string;
}

export interface PreviewVideo {
  id: string;
  /** Full YouTube title. */
  title: string;
  /** Short label for dense, column-aligned layouts. */
  shortTitle: string;
  stage: VideoStage;
  /** Display date for previews. Uses the paired post date until a YouTube date exists. */
  date: string;
  duration: string;
  thumbnail: string;
  /** Alt text describing the thumbnail artwork, not the video topic. */
  thumbnailAlt: string;
  /** Published YouTube watch URL. Candidate preview entries leave this empty. */
  youtubeUrl?: string;
  summary: string;
  chapters: string[];
  blog: {
    id: string;
    title: string;
    readingTime: string;
  };
  /** Publishing history for the topic, oldest first. */
  notes: PreviewVideoNote[];
}

export function getVideoThumbnailSrcSet(thumbnail: string) {
  const extensionIndex = thumbnail.lastIndexOf(".");
  const base = thumbnail.slice(0, extensionIndex);
  const extension = thumbnail.slice(extensionIndex);

  return `${base}-640${extension} 640w, ${base}-960${extension} 960w, ${thumbnail} 1280w`;
}

export const stageLabels: Record<VideoStage, string> = {
  published: "live",
  editing: "editing",
  scripted: "scripted",
};

export const previewVideos: PreviewVideo[] = [
  {
    id: "merging-in-parallel",
    title: "How Are People Merging So Many AI-Agent PRs?",
    shortTitle: "How are people merging so many AI-agent PRs?",
    stage: "published",
    date: "2026-07-23",
    duration: "10:49",
    thumbnail: "/video-previews/merging-ai-agent-prs.jpg",
    thumbnailAlt:
      'Thumbnail: "Wait... How?" beside a mock post saying "Shipped 20 PRs today"',
    youtubeUrl: "https://www.youtube.com/watch?v=F-3bpi4f0U8",
    summary:
      "How parallel coding-agent workflows avoid breaking the codebase: worktrees, branch drift, semantic conflicts, merge queues, stacked PRs, feature flags, and choosing the right workflow.",
    chapters: [
      "Worktrees vs integration",
      "Branch drift and semantic conflicts",
      "Merge queues and stacked PRs",
      "Picking the right tool",
      "My practical agent workflow",
    ],
    blog: {
      id: "merging-in-parallel",
      title: "Multiple AI Agents, Multiple PRs—How Does This Not Break?",
      readingTime: "16 min read",
    },
    notes: [
      {
        date: "2026-07-23",
        label: "video",
        body: "Published the practical walkthrough with the interactive article linked in the description.",
      },
    ],
  },
  {
    id: "token-cost-minimization",
    title: 'Why "Cheap" AI Models Cost More',
    shortTitle: "Why cheap AI models cost more",
    stage: "published",
    date: "2026-07-16",
    duration: "15:53",
    thumbnail: "/video-previews/cheap-ai-costs-more.jpg",
    thumbnailAlt: 'Thumbnail: "Cheap AI? Costs more" with pricing gauges and Pranav on the right',
    youtubeUrl: "https://www.youtube.com/watch?v=_PHYH45Gl1E",
    summary:
      "Cheaper per-token pricing keeps landing teams with bigger bills. The unit that actually matters is cost per finished task — this walks through where the money leaks and how to stop it.",
    chapters: [
      "The subsidy nobody tells you about",
      "Cost per task, not cost per token",
      "Why a cheaper model retries more",
      "Five leaks worth plugging",
    ],
    blog: {
      id: "token-cost-minimization",
      title: "Why Lower Token Prices Don't Lower AI Bills, and What Enterprises Should Do Instead",
      readingTime: "11 min read",
    },
    notes: [
      {
        date: "2026-07-15",
        label: "post",
        body: "Wrote the long version with the SemiAnalysis subsidy math and the DeepSWE cost charts.",
      },
      {
        date: "2026-07-15",
        label: "video",
        body: "Cut the post down to the four leaks that cost the most. Charts got read out loud instead of shown.",
      },
      {
        date: "2026-07-16",
        label: "site",
        body: "Used as the first video topic while comparing possible website layouts.",
      },
    ],
  },
  {
    id: "durable-objects-rabbit-hole",
    title: "I Asked What Durable Objects Are. Ended Up in a Distributed Systems Rabbit Hole.",
    shortTitle: "The durable objects rabbit hole",
    stage: "scripted",
    date: "2026-07-02",
    duration: "~18 min",
    thumbnail: "/video-previews/token-cost-ai-bill-cooked.jpg",
    thumbnailAlt: "Placeholder thumbnail borrowed from the token cost set",
    summary:
      "A rate-limiting question turned into an argument about actors, workflows, and a Redis bug I'd already fixed. The lesson was refusing the answer until it mapped to my problem.",
    chapters: [
      "The question that started it",
      "Actors, and why the model clicked",
      "The Redis bug I'd already fixed",
      "When to stop trusting a clean answer",
    ],
    blog: {
      id: "durable-objects-rabbit-hole",
      title: "I Asked What Durable Objects Are. Ended Up in a Distributed Systems Rabbit Hole.",
      readingTime: "12 min read",
    },
    notes: [
      {
        date: "2026-07-02",
        label: "post",
        body: "Published as a transcript-shaped piece — the argument matters more than the conclusion.",
      },
      {
        date: "2026-07-02",
        label: "candidate",
        body: "Used here as a possible future video topic so the preview has more than one row.",
      },
    ],
  },
  {
    id: "getting-started-with-hatchet",
    title: "Getting Started with Hatchet: Notes From My Own Learning",
    shortTitle: "Hatchet from scratch",
    stage: "scripted",
    date: "2026-05-21",
    duration: "~22 min",
    thumbnail: "/video-previews/token-cost-14k-bill.jpg",
    thumbnailAlt: "Placeholder thumbnail borrowed from the token cost set",
    summary:
      "Durable execution without the vocabulary lesson: workflows, workers, retries, cancellation, and throughput controls, built up from a job that keeps failing.",
    chapters: [
      "The job that keeps dying",
      "Workflows and workers",
      "Retries and cancellation",
      "Throughput controls that matter",
    ],
    blog: {
      id: "getting-started-with-hatchet",
      title: "Getting Started with Hatchet: Notes From My Own Learning",
      readingTime: "18 min read",
    },
    notes: [
      {
        date: "2026-05-21",
        label: "post",
        body: "Long-form learning notes, written while working through the docs.",
      },
      {
        date: "2026-05-21",
        label: "candidate",
        body: "Used here as a possible future video topic so thumbnail-heavy layouts can be compared.",
      },
    ],
  },
];

export function getPublishedVideos() {
  return previewVideos.filter((video) => video.stage === "published");
}

export const previewVariants = [
  {
    to: "/preview/videos/log",
    name: "watch log",
    tagline: "One line per video, no images.",
    tradeoff:
      "Fastest to scan and cheapest to maintain. Matches the blog index exactly, so videos read as another publishing stream. Loses the thumbnail work entirely.",
  },
  {
    to: "/preview/videos/library",
    name: "library",
    tagline: "Thumbnail-first grid.",
    tradeoff:
      "The thumbnails do real work here — they carry the hook. Costs vertical space and image weight, and the artwork is louder than the rest of the site.",
  },
  {
    to: "/preview/videos/paired",
    name: "paired notes",
    tagline: "Each topic shows its post and its video together.",
    tradeoff:
      "Treats a topic as one thing published twice, and gives revisions somewhere to live. Densest of the three, and it needs every video to have a post.",
  },
] as const;

export const homeVideoPreviewVariants = [
  {
    to: "/preview/home-videos/after-hero",
    name: "after hero",
    tagline: "Highest reach, right after the intro.",
    tradeoff:
      "Best if the YouTube work should be impossible to miss. It makes the homepage more media-forward before values/resume context.",
  },
  {
    to: "/preview/home-videos/after-values",
    name: "after values",
    tagline: "Videos after the operating principles.",
    tradeoff:
      "Good middle ground: visitors get the person first, then the media library. The section still lands before resume-fit content.",
  },
  {
    to: "/preview/home-videos/before-links",
    name: "before links",
    tagline: "Smallest change near the existing links.",
    tradeoff:
      "Lowest risk and closest to the current page rhythm. Videos become another proof point instead of a headline section.",
  },
  {
    to: "/preview/home-videos/hire-me-split",
    name: "hire me split",
    tagline: "Home becomes intro, videos, links; hiring context moves to nav.",
    tradeoff:
      "Cleanest homepage. The tradeoff is one more top-level choice, but the hiring material gets a clearer home of its own.",
  },
] as const;
