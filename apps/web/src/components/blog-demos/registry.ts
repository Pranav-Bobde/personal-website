import type { ComponentType } from "react";

import { BranchDriftDemo } from "./branch-drift-demo";
import { FeatureFlagDemo } from "./feature-flag-demo";
import { MergeQueueDemo } from "./merge-queue-demo";
import { StackedPrsDemo } from "./stacked-prs-demo";

/* Maps a `::demo[name]` directive in a blog post to its interactive widget. */
export const demoRegistry: Record<string, ComponentType> = {
  "branch-drift": BranchDriftDemo,
  "merge-queue": MergeQueueDemo,
  "stacked-prs": StackedPrsDemo,
  "feature-flag": FeatureFlagDemo,
};
