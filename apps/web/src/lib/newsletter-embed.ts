export function getNewsletterEmbedScriptUrl(publicFormUrl: string | undefined) {
  if (!publicFormUrl) {
    return undefined;
  }

  return `${publicFormUrl.replace(/\/$/, "")}/index.js`;
}
