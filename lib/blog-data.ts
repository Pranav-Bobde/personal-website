import fs from "fs"
import path from "path"

const BLOGS_DIRECTORY = path.join(process.cwd(), "content", "blogs")

export interface BlogPost {
  id: string
  title: string
  date: string
  readingTime: string
  summary: string
  tags: string[]
  content: string
}

interface BlogFrontmatter {
  title?: string
  date?: string
  readingTime?: string
  readTime?: string
  summary?: string
  description?: string
  tags?: string[]
}

function slugToTitle(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function parseFrontmatter(markdown: string): { metadata: BlogFrontmatter; content: string } {
  if (!markdown.startsWith("---")) {
    return { metadata: {}, content: markdown.trim() }
  }

  const endIndex = markdown.indexOf("\n---", 3)
  if (endIndex === -1) {
    return { metadata: {}, content: markdown.trim() }
  }

  const rawFrontmatter = markdown.slice(3, endIndex).trim()
  const content = markdown.slice(endIndex + 4).trim()
  const metadata: BlogFrontmatter = {}

  for (const line of rawFrontmatter.split("\n")) {
    const separatorIndex = line.indexOf(":")
    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    const rawValue = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "")

    if (key === "tags") {
      metadata.tags = rawValue
        .replace(/^\[|\]$/g, "")
        .split(",")
        .map((tag) => tag.trim().replace(/^['"]|['"]$/g, ""))
        .filter(Boolean)
      continue
    }

    if (key === "title" || key === "date" || key === "readingTime" || key === "readTime" || key === "summary" || key === "description") {
      metadata[key] = rawValue
    }
  }

  return { metadata, content }
}

function parsePost(fileName: string): BlogPost {
  const id = fileName.replace(/\.md$/, "")
  const filePath = path.join(BLOGS_DIRECTORY, fileName)
  const fileContent = fs.readFileSync(filePath, "utf8")
  const { metadata, content } = parseFrontmatter(fileContent)

  return {
    id,
    title: metadata.title ?? slugToTitle(id),
    date: metadata.date ?? "",
    readingTime: metadata.readingTime ?? metadata.readTime ?? "",
    summary: metadata.summary ?? metadata.description ?? "",
    tags: metadata.tags ?? [],
    content,
  }
}

export function getBlogPosts(): BlogPost[] {
  if (!fs.existsSync(BLOGS_DIRECTORY)) {
    return []
  }

  return fs
    .readdirSync(BLOGS_DIRECTORY)
    .filter((fileName) => fileName.endsWith(".md"))
    .map(parsePost)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getBlogPost(id: string): BlogPost | undefined {
  return getBlogPosts().find((post) => post.id === id)
}
