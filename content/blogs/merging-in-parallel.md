---
title: "Multiple AI Agents, Multiple PRs. How Does This Not Break?"
date: "2026-07-23"
readingTime: "7 min read"
summary: "People run ten agents and open ten PRs at once. I wanted to know why main survives that, so here is one developer, four agents and everything that breaks."
tags: ["git", "pull-requests", "merge-conflicts", "ai-agents", "trunk-based-development", "workflow"]
---

# Multiple AI Agents, Multiple PRs. How Does This Not Break?

People share workflows with ten agents opening ten PRs at an absurd speed, and my reaction was always the same: **how the hell does this not constantly break?**

My agents each get a worktree, a separate folder with its own branch, but at merge time all that work still lands in one place. So I had four questions:

1. Two agents edit the same file. Who sorts that out?
2. One task depends on another. How can both be open PRs at the same time?
3. The first PR merges. Aren't all the other branches out of date now?
4. Git says the merge is clean. Who checks that the combined code actually works?

The [AgenticFlict preprint](https://arxiv.org/abs/2604.03551) test-merged about 107,000 PRs written by AI agents and found merge conflicts in **27.67%** of them.

So picture this: you are one developer building a made-up mail app, and you hand four tasks to four AI agents. Julius, Maria, Ben and Kai are those agents. The names are only there to make them easy to follow, and subagents get temporary names anyway.

## Setup: four tasks, four agents

The official code lives on `main`. Each agent works on a **branch**, a private copy, and saves changes as **commits**, each with a short ID called a **hash**. A **pull request**, or PR, asks to add a branch to `main`. Machines build and test it. Passing checks make it **green**, and failing checks make it **red**.

All four start from the same commit:

- **Julius**: #1 renames `sendEmail` to `deliver`.
- **Maria**: #2 adds `sendReply`, which calls `sendEmail`.
- **Ben**: #3 adds a Reply button, which calls Maria's `sendReply`.
- **Kai**: #4 fixes a typo in the inbox title.

Press `Go` and watch all four work. When it stops, press any name to see that agent's code.

::demo[pr-cast]

## The problems

### Problem 1: a task needs code from a PR that isn't merged

Three PRs came back green and Ben's #3 came back red, because it calls `sendReply`, which exists only on Maria's branch. Until Maria's #2 lands, Ben's PR can't go green.

### Problem 2: your branch falls behind

A branch stays still while `main` moves.

Small PRs merge while these four wait. Maria's branch still starts from its first commit, its **base**, so it is now **2 behind main**.

Catching up is **syncing**. The base moves to the newest commit on `main`, and Maria's commit goes back on top. The command is `git rebase main`, so the move is a **rebase**.

Press `Go`. Two more PRs merge and widen the gap, then Maria syncs.

::demo[branch-drift]

Now say every agent has synced, so all branches start from `add drafts`.

### Problem 3: two PRs change the same line

Git compares lines of text, not meaning, so it catches this kind of clash and misses the next one.

You ask Ben to change the inbox title to "Mail", and it opens #5 on the line Kai's #4 fixes. Two edits to one line make Git stop with a **merge conflict**.

### Problem 4: Git passes but the build fails

Julius renames a function and Maria calls the old name, on different lines. Git merges both and the build breaks. That is a **semantic conflict**, a clash in what the code means.

Press `Go` on Problem 3, then `Go` on Problem 4.

::demo[conflict-kinds]

Problem 3 is annoying but safe. Problem 4 is dangerous, and you have to ask: "Both were green. Why is `main` broken?" Because each check ran against a `main` without the other PR.

## The solutions

### Merge queue, for Problem 4

Back to Problem 4: Git said fine and the build broke. The fix is a **merge queue**, which tests each PR against what `main` is about to become, before it lands.

Pressing merge puts your PR in a line. GitHub tests it with the latest `main` and every PR ahead of it. A pass lands it. A fail removes it.

Run the same three PRs again from the start, this time in a queue. Press `Go` on `no queue`, then switch to `merge queue` and press `Go` again.

::demo[merge-queue]

Ben's #3 stays out, because it is red alone and a PR must pass its checks to join the line.

GitHub's "Require branches to be up to date before merging" setting also blocks the Problem 4 accident, but each branch must sync and rerun the checks whenever another PR lands first. [GitHub's docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue) describe the queue as the same protection without that step.

**Is this a real thing?** Yes. It is a platform feature that GitHub runs, not a Git feature, and you install nothing.

- **Who can use it:** any public repo owned by an organization, or private repos of organizations on GitHub Enterprise Cloud. A repo on a personal account can't.
- **Turn it on:** Settings, Branches, Add classic branch protection rule, then tick "Require merge queue". Your CI must also run on the `merge_group` event.
- **Use it:** press "Merge when ready" on the PR, or run `gh pr merge`. [GitHub's docs](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/merging-a-pull-request-with-a-merge-queue)
- **Others:** [GitLab merge trains](https://docs.gitlab.com/ci/pipelines/merge_trains/) (Premium, Ultimate), [Graphite](https://graphite.com/docs/graphite-merge-queue) (Team, Enterprise) and [Mergify](https://mergify.com/pricing) (has a free tier).

### Stack, for Problem 1

Back to Problem 1: Ben's #3 needs code from Maria's #2, which isn't merged. The fix is a **stack**, which lets one PR build on another before the first merges. The bottom PR targets `main`, the next targets the bottom PR's branch, and each shows only its own changes.

A queue can't help here, because #3 can't build without #2.

Press `Go` to stack Ben's #3 on Maria's #2 and merge them.

::demo[stacked-prs]

Use a stack only for real dependencies. [GitHub](https://docs.github.com/en/pull-requests/get-started/about-stacked-prs) and [Graphite](https://graphite.com/docs/intro-to-graphite) handle the rebasing for you.

**Is this a real thing?** Yes, and you can use it three ways. Git itself has no stack command.

- **GitHub feature:** [generally available since 2026-10-06](https://github.blog/changelog/2026-10-06-stacked-pull-requests-generally-available) on all github.com plans.
- **Separate tool:** `gh extension install github/gh-stack`, then `gh stack init`, `gh stack add BRANCH-NAME` and `gh stack submit`. Graphite's version is `gt create --all --message "..."`, then `gt submit`.
- **Plain Git and a habit:** create the branch on top of the one below, then open the PR with [`gh pr create --base <branch below>`](https://cli.github.com/manual/gh_pr_create). Nothing enforces it, and you rebase by hand.

### Queue or stack?

I kept mixing these up, but one question separates them: **does this PR build on its own?** If yes, a queue fits. If no, stack it.

- **A queue is a line at a counter.** Nobody depends on anyone. They take turns.
- **A stack is floors of a building.** The second floor needs the first.

Try that question on these PRs. Pick a pair, press `Go` and read the checks.

::demo[queue-or-stack]

### Sync and resolve, for Problems 2 and 3

Back to Problem 2: a branch fell behind. Ask its agent to run `git rebase main`, and do it often.

Back to Problem 3: two PRs changed one line. Whichever merges second sorts it out. Ben syncs, keeps Kai's title and closes #5.

### Bonus: feature flag

A **feature flag** separates merging from releasing. It is an `if` that checks a setting while the app runs.

Ben's #3 is green now, but you aren't ready to show Reply to users, so you ask Ben to wrap the button:

```
if (flags.isOn("reply-button")) {
  showButton("Reply", onReply);
}
```

A flag also lets big features merge in small pieces while users see nothing.

Press `Go` to merge #3, then flip the flag.

::demo[feature-flag]

The flag hides behaviour, not code. The compiler still reads `onReply`, so #3 still needs #2 on `main` first.

## Back to my four questions

**Two agents edit the same file.** On the same lines, Git stops and whichever merges second sorts it out. See sync and resolve. On different lines, see the last answer.

**One task depends on another.** Stack them, so both can be open at once. See stack.

**The first PR merges.** Every other branch is now behind. Each syncs onto the new `main`, or a merge queue tests them against it. See sync and resolve.

**Git says the merge is clean.** Git only checked the text. A queue checks the combined code, by testing each PR against the latest `main`. See merge queue.

For ten agents tomorrow, I would:

1. Give each agent one small task, on its own short-lived branch, in its own worktree.
2. Start them all from the same commit.
3. Merge one PR at a time.
4. After each merge, sync the remaining branches and run the build and tests.
5. Let an agent resolve small conflicts, then check its work.
6. Add a merge queue once ready PRs keep breaking each other.

**Don't merge ten things at once. Merge one thing ten times, each against the real current `main`.**

---

Further reading: [Trunk-based development](https://trunkbaseddevelopment.com/short-lived-feature-branches/), [GitHub merge queue docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue), [GitHub stacked PRs docs](https://docs.github.com/en/pull-requests/get-started/about-stacked-prs), and [Martin Fowler on feature toggles](https://martinfowler.com/articles/feature-toggles.html).
