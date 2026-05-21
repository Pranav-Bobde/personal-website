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
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, '<code class="bg-secondary px-1 py-0.5 rounded text-sm">$1</code>')
    .replace(
      /\[(.*?)\]\((.*?)\)/g,
      '<a href="$2" class="text-accent hover:underline" target="_blank" rel="noopener noreferrer">$1</a>',
    );
}

function renderTable(lines: string[]) {
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

  return `<div class="markdown-table-wrap"><table><thead><tr>${headings
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

function renderChunk(chunk: string, state: MarkdownRenderState) {
  if (chunk.startsWith("__CODE_BLOCK_")) {
    return chunk;
  }

  if (chunk.startsWith("<details>")) {
    return chunk;
  }

  if (chunk === "---") {
    return "<hr />";
  }

  const headingOne = chunk.match(/^#\s+(.+)$/);
  if (headingOne) {
    const id = createHeadingId(headingOne[1], state);
    return `<h1 id="${id}">${formatInline(headingOne[1])}</h1>`;
  }

  const headingTwo = chunk.match(/^##\s+(.+)$/);
  if (headingTwo) {
    const id = createHeadingId(headingTwo[1], state);
    addTocLink(headingTwo[1], id, state);
    return `<h2 id="${id}">${formatInline(headingTwo[1])}</h2>`;
  }

  const headingThree = chunk.match(/^###\s+(.+)$/);
  if (headingThree) {
    const id = createHeadingId(headingThree[1], state);
    return `<h3 id="${id}">${formatInline(headingThree[1])}</h3>`;
  }

  const lines = chunk
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const allUnordered = lines.every((line) => /^[-*]\s+/.test(line));
  const allOrdered = lines.every((line) => /^\d+\.\s+/.test(line));

  if (allUnordered || allOrdered) {
    return renderList(lines, allOrdered);
  }

  if (lines.length >= 2 && lines.every((line) => line.startsWith("|"))) {
    return renderTable(lines);
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
