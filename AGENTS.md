# AGENTS Playbook

This file captures project-specific expectations and feedback so future agent changes stay aligned.

## Non-negotiables

1. Do not silently change existing behavior while fixing a bug.
2. If a fix requires a tradeoff that alters current logic, stop and ask first.
3. Present the impact clearly before changing behavior (what breaks, what improves, proposed default).
4. Preserve existing keyboard workflows unless explicitly asked to remap them.

## Collaboration rules for this repo

1. Verify UI/UX behavior changes in-browser with `agent-browser` before reporting done.
2. Keep hotkey mappings explicit in UI hints whenever mappings are changed.
3. Prefer additive solutions over breaking substitutions when both can coexist.
4. For navigation/hotkey work, test both directions of flow (forward and back).

## Current hotkey intent snapshot

1. `h` should navigate to home from anywhere.
2. Blog pagination should use `Ctrl+H` and `Ctrl+L` (and arrow keys for page navigation).
3. Any future hotkey conflict resolution should prioritize preserving global navigation keys.

## Delivery expectations

1. For meaningful behavior changes, include a short impact note in the final response.
2. Keep commits focused and describe why the change exists, not only what changed.
3. If verification could not be run, explicitly call that out and include exact next verify steps.
