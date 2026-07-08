const blogMarkdownByPath = import.meta.glob("../../../../content/blogs/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export interface BlogPost {
  id: string;
  title: string;
  date: string;
  readingTime: string;
  summary: string;
  tags: string[];
  content: string;
}

interface BlogFrontmatter {
  title?: string;
  date?: string;
  readingTime?: string;
  readTime?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  hidden?: boolean;
}

type TextFrontmatterKey = Exclude<keyof BlogFrontmatter, "tags" | "hidden">;

const textFrontmatterKeys = new Set([
  "title",
  "date",
  "readingTime",
  "readTime",
  "summary",
  "description",
]);

const frontmatterHandlers = {
  tags: (rawValue: string, metadata: BlogFrontmatter) => {
    metadata.tags = parseTags(rawValue);
  },
  hidden: (rawValue: string, metadata: BlogFrontmatter) => {
    metadata.hidden = rawValue === "true";
  },
};

function parseTags(rawValue: string) {
  return rawValue
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((tag) => tag.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);
}

function parseFrontmatterLine(line: string, metadata: BlogFrontmatter) {
  const separatorIndex = line.indexOf(":");
  if (separatorIndex === -1) {
    return;
  }

  const key = line.slice(0, separatorIndex).trim();
  const rawValue = line
    .slice(separatorIndex + 1)
    .trim()
    .replace(/^['"]|['"]$/g, "");

  const handler = frontmatterHandlers[key as keyof typeof frontmatterHandlers];
  if (handler) {
    handler(rawValue, metadata);
    return;
  }

  if (textFrontmatterKeys.has(key)) {
    metadata[key as TextFrontmatterKey] = rawValue;
  }
}

function parseFrontmatter(markdown: string): { metadata: BlogFrontmatter; content: string } {
  if (!markdown.startsWith("---")) {
    return { metadata: {}, content: markdown.trim() };
  }

  const endIndex = markdown.indexOf("\n---", 3);
  if (endIndex === -1) {
    return { metadata: {}, content: markdown.trim() };
  }

  const rawFrontmatter = markdown.slice(3, endIndex).trim();
  const content = markdown.slice(endIndex + 4).trim();
  const metadata: BlogFrontmatter = {};

  for (const line of rawFrontmatter.split("\n")) {
    parseFrontmatterLine(line, metadata);
  }

  return { metadata, content };
}

function requireStringFrontmatter(value: string | undefined, fieldName: string, postId: string) {
  if (!value) {
    throw new Error(`Blog post "${postId}" is missing frontmatter: ${fieldName}`);
  }

  return value;
}

function requireTagsFrontmatter(tags: string[] | undefined, postId: string) {
  if (!tags?.length) {
    throw new Error(`Blog post "${postId}" is missing frontmatter: tags`);
  }

  return tags;
}

function requireBlogFrontmatter(id: string, metadata: BlogFrontmatter) {
  return {
    title: requireStringFrontmatter(metadata.title, "title", id),
    date: requireStringFrontmatter(metadata.date, "date", id),
    readingTime: requireStringFrontmatter(metadata.readingTime ?? metadata.readTime, "readingTime", id),
    summary: requireStringFrontmatter(metadata.summary ?? metadata.description, "summary", id),
    tags: requireTagsFrontmatter(metadata.tags, id),
  };
}

function buildPost(id: string, fileContent: string): BlogPost | undefined {
  const { metadata, content } = parseFrontmatter(fileContent);
  if (metadata.hidden) {
    return undefined;
  }

  const frontmatter = requireBlogFrontmatter(id, metadata);
  const contentWithoutDuplicateTitle = content.replace(/^#\s+(.+)\n+/, (match, heading: string) => {
    return heading.trim() === frontmatter.title ? "" : match;
  });

  return {
    id,
    ...frontmatter,
    content: contentWithoutDuplicateTitle.trim(),
  };
}

function filePathToPostId(filePath: string) {
  return filePath.split("/").pop()?.replace(/\.md$/, "") ?? filePath;
}

export function getBlogPosts(): BlogPost[] {
  return Object.entries(blogMarkdownByPath)
    .map(([filePath, fileContent]) => buildPost(filePathToPostId(filePath), fileContent))
    .filter((post): post is BlogPost => Boolean(post))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getBlogPost(id: string): BlogPost | undefined {
  return getBlogPosts().find((post) => post.id === id);
}
