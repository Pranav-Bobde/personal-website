import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";

const routePath = path.resolve(import.meta.dirname, "../routes/newsletter.tsx");
describe("newsletter page value proposition", () => {
  test("uses the signal-first composition with an integrated signup", () => {
    const route = fs.readFileSync(routePath, "utf8");
    const valueProposition = route.indexOf(
      "Stay ahead of AI and tech without living on every feed.",
    );
    const signupForm = route.indexOf("<NewsletterSignupForm");

    expect(valueProposition).toBeGreaterThan(-1);
    expect(signupForm).toBeGreaterThan(valueProposition);
    expect(route).toContain("newsletter-signal-first");
    expect(route).toContain("what makes the cut");
    expect(route).toContain("technical deep-dives");
  });
});
