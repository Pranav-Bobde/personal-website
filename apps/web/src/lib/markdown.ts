function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export interface TocLink {
  id: string;
  text: string;
}

interface MarkdownRenderState {
  slugs: Map<string, number>;
  toc: TocLink[];
}

function stripInlineMarkdown(input: string) {
  return input
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/[*`_]/g, "")
    .trim();
}

function slugify(input: string) {
  return stripInlineMarkdown(input)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function createHeadingId(text: string, state: MarkdownRenderState) {
  const baseSlug = slugify(text) || "section";
  const currentCount = state.slugs.get(baseSlug) ?? 0;
  state.slugs.set(baseSlug, currentCount + 1);

  return currentCount === 0 ? baseSlug : `${baseSlug}-${currentCount + 1}`;
}

function addTocLink(text: string, id: string, state: MarkdownRenderState) {
  state.toc.push({
    id,
    text: stripInlineMarkdown(text),
  });
}

function formatInline(input: string) {
  return escapeHtml(input)
    .replace(
      /!\[(.*?)\]\((.*?)\)/g,
      '<img src="$2" alt="$1" class="markdown-image" loading="lazy" />',
    )
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, '<code class="bg-secondary px-1 py-0.5 rounded text-sm">$1</code>')
    .replace(
      /\[(.*?)\]\((.*?)\)/g,
      '<a href="$2" class="text-accent hover:underline" target="_blank" rel="noopener noreferrer">$1</a>',
    );
}

interface TweetEmbedParts {
  canonicalUrl: string;
  embedUrl: string;
}

const tweetHosts = new Set(["x.com", "twitter.com"]);

function getUrl(rawUrl: string) {
  return URL.canParse(rawUrl) ? new URL(rawUrl) : undefined;
}

function getTweetStatusId(pathname: string) {
  return pathname.match(/\/status\/(\d+)/)?.[1];
}

function getTweetEmbedParts(rawUrl: string): TweetEmbedParts | undefined {
  const tweetUrl = getUrl(rawUrl);
  if (!tweetUrl) {
    return undefined;
  }

  const statusId = getTweetStatusId(tweetUrl.pathname);
  if (!tweetHosts.has(tweetUrl.hostname)) {
    return undefined;
  }

  if (!statusId) {
    return undefined;
  }

  return {
    canonicalUrl: `https://x.com${tweetUrl.pathname}`,
    embedUrl: `https://platform.twitter.com/embed/Tweet.html?id=${statusId}&theme=dark&dnt=true`,
  };
}

function renderTweetFallback(label: string, rawUrl: string) {
  return `<p>${formatInline(`[${label}](${rawUrl})`)}</p>`;
}

function renderTweetEmbed(label: string, rawUrl: string) {
  const tweet = getTweetEmbedParts(rawUrl);
  if (!tweet) {
    return renderTweetFallback(label, rawUrl);
  }

  const title = label || "Embedded tweet";

  return `<div class="markdown-tweet-embed"><iframe src="${escapeHtml(
    tweet.embedUrl,
  )}" title="${escapeHtml(
    title,
  )}" loading="lazy" allowfullscreen></iframe><p><a href="${escapeHtml(
    tweet.canonicalUrl,
  )}" target="_blank" rel="noopener noreferrer">${formatInline(
    label || "Open tweet on X",
  )}</a></p></div>`;
}

function renderTable(lines: string[]) {
  const isMediaTable = lines.some((line) => line.includes("!["));
  const rows = lines
    .filter((line) => !/^\|\s*-/.test(line))
    .map((line) =>
      line
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((cell) => cell.trim()),
    );

  const [headings, ...bodyRows] = rows;
  if (!headings) {
    return "";
  }

  return `<div class="markdown-table-wrap${isMediaTable ? " markdown-media-grid" : ""}"><table><thead><tr>${headings
    .map((heading) => `<th>${formatInline(heading)}</th>`)
    .join("")}</tr></thead><tbody>${bodyRows
    .map((row) => `<tr>${row.map((cell) => `<td>${formatInline(cell)}</td>`).join("")}</tr>`)
    .join("")}</tbody></table></div>`;
}

function renderList(lines: string[], ordered: boolean) {
  const items = lines
    .map((line) => line.replace(ordered ? /^\d+\.\s+/ : /^[-*]\s+/, ""))
    .map((line) => `<li>${formatInline(line)}</li>`)
    .join("");

  return ordered ? `<ol>${items}</ol>` : `<ul>${items}</ul>`;
}

function isPassthroughChunk(chunk: string) {
  return chunk.startsWith("__CODE_BLOCK_") || chunk.startsWith("<details>");
}

function renderDirective(chunk: string) {
  const tweetEmbed = chunk.match(/^::tweet\[(.*?)\]\((.*?)\)$/);
  if (tweetEmbed) {
    return renderTweetEmbed(tweetEmbed[1], tweetEmbed[2]);
  }

  const demoEmbed = chunk.match(/^::demo\[([a-z0-9-]+)\]$/);
  if (demoEmbed) {
    return `<div class="blog-demo" data-demo="${demoEmbed[1]}"></div>`;
  }

  return undefined;
}

function renderSpecialChunk(chunk: string) {
  if (isPassthroughChunk(chunk)) {
    return chunk;
  }

  if (chunk === "---") {
    return "<hr />";
  }

  return renderDirective(chunk);
}

function renderHeadingChunk(chunk: string, state: MarkdownRenderState) {
  const heading = chunk.match(/^(#{1,3})\s+(.+)$/);
  if (!heading) {
    return undefined;
  }

  const level = heading[1].length;
  const text = heading[2];
  const id = createHeadingId(text, state);
  if (level === 2) {
    addTocLink(text, id, state);
  }

  return `<h${level} id="${id}">${formatInline(text)}</h${level}>`;
}

function chunkLines(chunk: string) {
  return chunk
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function getListMode(lines: string[]) {
  if (lines.every((line) => /^[-*]\s+/.test(line))) {
    return "unordered";
  }

  if (lines.every((line) => /^\d+\.\s+/.test(line))) {
    return "ordered";
  }

  return undefined;
}

function isTableChunk(lines: string[]) {
  return lines.length >= 2 && lines.every((line) => line.startsWith("|"));
}

function renderStructuredChunk(chunk: string) {
  const lines = chunkLines(chunk);
  const listMode = getListMode(lines);

  if (listMode) {
    return renderList(lines, listMode === "ordered");
  }

  if (isTableChunk(lines)) {
    return renderTable(lines);
  }

  return undefined;
}

function renderChunk(chunk: string, state: MarkdownRenderState) {
  const specialChunk = renderSpecialChunk(chunk);
  if (specialChunk) {
    return specialChunk;
  }

  const headingChunk = renderHeadingChunk(chunk, state);
  if (headingChunk) {
    return headingChunk;
  }

  const structuredChunk = renderStructuredChunk(chunk);
  if (structuredChunk) {
    return structuredChunk;
  }

  return `<p>${formatInline(chunk).replace(/\n/g, "<br />")}</p>`;
}

function renderBlocks(markdown: string, state: MarkdownRenderState) {
  return markdown
    .split("\n\n")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => renderChunk(chunk, state))
    .join("");
}

export function renderMarkdown(markdown: string): { html: string; toc: TocLink[] } {
  const codeBlockPattern = /```([\s\S]*?)```/g;
  const codeBlocks: string[] = [];
  const state: MarkdownRenderState = {
    slugs: new Map(),
    toc: [],
  };

  const withCodePlaceholders = markdown.replace(codeBlockPattern, (_, codeContent: string) => {
    const index = codeBlocks.length;
    const escapedCode = escapeHtml(codeContent.trim());
    codeBlocks.push(`<pre><code>${escapedCode}</code></pre>`);
    return `__CODE_BLOCK_${index}__`;
  });

  const withDetails = withCodePlaceholders.replace(
    /<details>\s*<summary><strong>(.*?)<\/strong><\/summary>([\s\S]*?)<\/details>/g,
    (_, summary: string, body: string) => {
      const nestedState: MarkdownRenderState = {
        slugs: state.slugs,
        toc: [],
      };

      return `<details><summary><strong>${formatInline(summary)}</strong></summary><div>${renderBlocks(
        body.trim(),
        nestedState,
      )}</div></details>`;
    },
  );

  const blocks = renderBlocks(withDetails, state);

  const html = codeBlocks.reduce((renderedHtml, block, index) => {
    return renderedHtml.replace(`__CODE_BLOCK_${index}__`, block);
  }, blocks);

  return { html, toc: state.toc };
}
