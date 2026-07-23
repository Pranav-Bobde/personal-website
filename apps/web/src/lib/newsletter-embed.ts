export function getNewsletterEmbedScriptUrl(publicFormUrl: string) {
  return `${publicFormUrl.replace(/\/$/, "")}/index.js`;
}
