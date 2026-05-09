function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function markdownToHtml(markdown: string) {
  const codeBlockPattern = /```([\s\S]*?)```/g;
  const codeBlocks: string[] = [];

  const withCodePlaceholders = markdown.replace(codeBlockPattern, (_, codeContent: string) => {
    const index = codeBlocks.length;
    const escapedCode = escapeHtml(codeContent.trim());
    codeBlocks.push(
      `<pre class="bg-secondary/40 border border-border p-6 rounded-md my-10 overflow-x-auto text-muted-foreground"><code class="text-sm">${escapedCode}</code></pre>`,
    );
    return `__CODE_BLOCK_${index}__`;
  });

  const paragraphs = withCodePlaceholders
    .split("\n\n")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      if (chunk.startsWith("__CODE_BLOCK_")) {
        return chunk;
      }

      const headingTwo = chunk.match(/^##\s+(.+)$/);
      if (headingTwo) {
        return `<h2>${escapeHtml(headingTwo[1])}</h2>`;
      }

      const headingThree = chunk.match(/^###\s+(.+)$/);
      if (headingThree) {
        return `<h3>${escapeHtml(headingThree[1])}</h3>`;
      }

      const listItems = chunk
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("* "));

      if (listItems.length > 0 && listItems.length === chunk.split("\n").filter(Boolean).length) {
        const listHtml = listItems.map((line) => `<li>${escapeHtml(line.slice(2))}</li>`).join("");
        return `<ul>${listHtml}</ul>`;
      }

      const formatted = escapeHtml(chunk)
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/`(.*?)`/g, '<code class="bg-secondary px-1 py-0.5 rounded text-sm">$1</code>')
        .replace(
          /\[(.*?)\]\((.*?)\)/g,
          '<a href="$2" class="text-accent hover:underline" target="_blank" rel="noopener noreferrer">$1</a>',
        )
        .replace(/\n/g, "<br />");

      return `<p>${formatted}</p>`;
    })
    .join("");

  return codeBlocks.reduce((html, block, index) => {
    return html.replace(`__CODE_BLOCK_${index}__`, block);
  }, paragraphs);
}
