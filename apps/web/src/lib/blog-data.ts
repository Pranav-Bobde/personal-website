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
}

function slugToTitle(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");

    if (key === "tags") {
      metadata.tags = rawValue
        .replace(/^\[|\]$/g, "")
        .split(",")
        .map((tag) => tag.trim().replace(/^['"]|['"]$/g, ""))
        .filter(Boolean);
      continue;
    }

    if (
      key === "title" ||
      key === "date" ||
      key === "readingTime" ||
      key === "readTime" ||
      key === "summary" ||
      key === "description"
    ) {
      metadata[key] = rawValue;
    }
  }

  return { metadata, content };
}

function buildPost(id: string, fileContent: string): BlogPost {
  const { metadata, content } = parseFrontmatter(fileContent);
  const title = metadata.title ?? slugToTitle(id);
  const contentWithoutDuplicateTitle = content.replace(/^#\s+(.+)\n+/, (match, heading: string) => {
    return heading.trim() === title ? "" : match;
  });

  return {
    id,
    title,
    date: metadata.date ?? "",
    readingTime: metadata.readingTime ?? metadata.readTime ?? "",
    summary: metadata.summary ?? metadata.description ?? "",
    tags: metadata.tags ?? [],
    content: contentWithoutDuplicateTitle.trim(),
  };
}

function filePathToPostId(filePath: string) {
  return filePath.split("/").pop()?.replace(/\.md$/, "") ?? filePath;
}

export function getBlogPosts(): BlogPost[] {
  return Object.entries(blogMarkdownByPath)
    .map(([filePath, fileContent]) => buildPost(filePathToPostId(filePath), fileContent))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getBlogPost(id: string): BlogPost | undefined {
  return getBlogPosts().find((post) => post.id === id);
}
