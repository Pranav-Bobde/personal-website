import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";

import { getNewsletterEmbedScriptUrl } from "./newsletter-embed.ts";

const envSchemaPath = path.resolve(import.meta.dirname, "../../../../packages/env/src/web.ts");
const turboConfigPath = path.resolve(import.meta.dirname, "../../../../turbo.json");

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

  test("requires the newsletter URL at build time", () => {
    const envSchema = fs.readFileSync(envSchemaPath, "utf8");

    expect(envSchema).toContain("VITE_NEWSLETTER_URL: z.url(),");
    expect(envSchema).not.toContain("VITE_NEWSLETTER_URL: z.url().optional(),");
  });

  test("includes the newsletter URL in the build cache inputs", () => {
    const turboConfig = JSON.parse(fs.readFileSync(turboConfigPath, "utf8"));

    expect(turboConfig.tasks.build.env).toContain("VITE_NEWSLETTER_URL");
  });
});
