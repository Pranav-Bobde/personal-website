---
title: "Multiple AI Agents, Multiple PRs—How Does This Not Break?"
date: "2026-07-23"
readingTime: "4 min read"
summary: "Multiple agents can raise multiple PRs without wrecking main—but only if you control drift, dependencies, merge order, and verification."
tags: ["git", "pull-requests", "merge-conflicts", "ai-agents", "trunk-based-development", "workflow"]
---

# Multiple AI Agents, Multiple PRs—How Does This Not Break?

People share AI workflows with **10 agents**, **10 PRs**, and absurd shipping speed.

My reaction was always: **how the hell does this not constantly break?**

My own parallel-agent workflow looked different:

- **Different projects:** no shared code, so no conflicts.
- **Same project + worktrees:** isolated while coding.
- **Merge time:** every parallel change finally collides.

The questions I couldn't shake:

- **Same file:** who resolves the conflict?
- **Dependent tasks:** how can PR #2 exist before PR #1 merges?
- **First PR merges:** aren't the remaining branches now stale?
- **Git says “clean”:** who checks that the combined code actually works?

That confusion led to this deep dive. A recent [AgenticFlict preprint](https://arxiv.org/abs/2604.03551) collected **142,000+ agent-authored PRs**. Of the **107,000+** it could process, **27.67%** contained textual merge conflicts. The problem is real; teams just have tools for containing it.

**The whole playbook:** keep changes small, integrate one at a time, and test every PR against the latest `main`.

Every tool below does one of two things: **shrinks the overlap** or **shrinks the time apart**. Poke the demos.

## Problem 1: branches drift

Your branch is a diff against **one frozen commit**. Every new commit on `main` makes that base older—and the eventual reconciliation harder.

::demo[branch-drift]

**Rule:** sync often. Keep reconciliation a two-minute chore, not a two-day dig.

## Problem 2: Git can merge broken code

| Conflict | Changes | Git does | Real risk |
| --- | --- | --- | --- |
| **Textual** | Same lines | Stops the merge | Loud, visible |
| **Semantic** | Different but dependent files | Merges cleanly | Silent, dangerous |

Tiny semantic-conflict example:

- Agent A renames `sendReply()`.
- Agent B adds a call to `sendReply()`.
- Git sees no overlapping lines. **Runtime sees a missing function.**

## Solution 1: merge queue

Several PRs can be “green” against a base that no longer exists. A **merge queue** processes each one against reality:

1. Rebase the next PR onto the latest `main`.
2. Include everything already ahead of it.
3. Run the tests again.
4. **Merge or eject.**

::demo[merge-queue]

**Result:** a stale-green PR cannot silently poison `main`.

## Solution 2: stack dependent work

Some work is naturally a chain:

1. Snooze API
2. Toolbar button using that API
3. “Snoozed” results view

Your options:

- **Wait:** safe, but everyone sits idle.
- **Pile:** one giant branch; hard to review and easy to drift.
- **Stack:** branch each step from the one below; open all three as small PRs.

::demo[stacked-prs]

**Use stacks only for real dependencies.** Unrelated tasks stay on separate short branches.

## Solution 3: feature flags

A large feature creates a bad choice: **long-lived branch** or **half-finished release**.

A feature flag removes that choice:

- Merge unfinished code continuously.
- Keep the flag **OFF** while building.
- Turn it **ON** when ready.
- Turn it **OFF** for instant rollback.

::demo[feature-flag]

**Merged ≠ released.** Integration and rollout become separate decisions.

## The practical playbook

1. **One task → one short-lived branch → one worktree.**
2. **Fork every agent from one pinned base commit.**
3. **Merge one PR at a time.**
4. **Rebase the remaining branches onto the new `main`.**
5. **Run the app or tests after every rebase.**
6. **Let an agent resolve bounded conflicts.**
7. **Add a merge queue** when ready PRs keep invalidating each other.

**Don't merge N things at once. Merge one thing N times—against the real current base.**

---

Further reading: [Trunk-based development](https://trunkbaseddevelopment.com/short-lived-feature-branches/), [GitHub merge queue docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue), [Graphite on stacked PRs](https://graphite.com/blog/stacked-prs), and [Martin Fowler on feature toggles](https://martinfowler.com/articles/feature-toggles.html).
