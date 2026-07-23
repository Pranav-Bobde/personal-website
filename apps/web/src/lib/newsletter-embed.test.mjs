import { describe, expect, test } from "bun:test";

import { getNewsletterEmbedScriptUrl } from "./newsletter-embed.ts";

describe("newsletter embed", () => {
  test("builds the official Kit embed script URL from the public form URL", () => {
    expect(getNewsletterEmbedScriptUrl("https://pranav-bobde.kit.com/58ca1bcb46")).toBe(
      "https://pranav-bobde.kit.com/58ca1bcb46/index.js",
    );
  });

  test("normalizes a trailing slash", () => {
    expect(getNewsletterEmbedScriptUrl("https://pranav-bobde.kit.com/58ca1bcb46/")).toBe(
      "https://pranav-bobde.kit.com/58ca1bcb46/index.js",
    );
  });

  test("keeps the form disabled when no public URL is configured", () => {
    expect(getNewsletterEmbedScriptUrl(undefined)).toBeUndefined();
  });
});
