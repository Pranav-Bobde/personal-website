import type { ComponentType } from "react";

import { BranchDriftDemo } from "./branch-drift-demo";
import { CheckoutWindowDemo } from "./checkout-window-demo";
import { ConflictKindsDemo } from "./conflict-kinds-demo";
import { ConnectionPressureDemo } from "./connection-pressure-demo";
import { DomainPathDemo } from "./domain-path-demo";
import { FeatureFlagDemo } from "./feature-flag-demo";
import { MergeQueueDemo } from "./merge-queue-demo";
import { MvccVisibilityDemo } from "./mvcc-visibility-demo";
import { PrCastDemo } from "./pr-cast-demo";
import { PushbackDemo } from "./pushback-demo";
import { QueueOrStackDemo } from "./queue-or-stack-demo";
import { StackedPrsDemo } from "./stacked-prs-demo";
import { WriteSkewDemo } from "./write-skew-demo";

/* Maps a `::demo[name]` directive in a blog post to its interactive widget. */
export const demoRegistry: Record<string, ComponentType> = {
  "pr-cast": PrCastDemo,
  "branch-drift": BranchDriftDemo,
  "conflict-kinds": ConflictKindsDemo,
  "merge-queue": MergeQueueDemo,
  "stacked-prs": StackedPrsDemo,
  "queue-or-stack": QueueOrStackDemo,
  "feature-flag": FeatureFlagDemo,
  "connection-pressure": ConnectionPressureDemo,
  "mvcc-visibility": MvccVisibilityDemo,
  "write-skew": WriteSkewDemo,
  "checkout-window": CheckoutWindowDemo,
  pushback: PushbackDemo,
  "domain-path": DomainPathDemo,
};
