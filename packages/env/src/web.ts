import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_POSTHOG_HOST: z.url(),
    VITE_POSTHOG_TOKEN: z.string().min(1),
    VITE_POSTHOG_UI_HOST: z.url(),
    VITE_SITE_URL: z.url(),
  },
  runtimeEnv: (import.meta as any).env,
  emptyStringAsUndefined: true,
});
