---
title: "Getting Started with Hatchet: Notes From My Own Learning"
date: "2026-05-21"
readingTime: "18 min read"
summary: "A practical walkthrough of Hatchet's durable execution model, workflows, workers, retries, cancellation, and throughput controls from my own learning notes."
tags: ["hatchet", "durable execution", "backend"]
---

# Getting Started with Hatchet: Notes From My Own Learning

A walk-through of the concepts I picked up while exploring Hatchet, in roughly the order they made sense to me.

---

## 1. Foundational Concepts: What Hatchet Is

I recently started learning **Hatchet**, and figured I'd write up what I found while it was still fresh. This isn't a deep architecture review — it's the version of the docs I wish I'd had when I was clicking around the dashboard for the first time wondering what the moving parts were.

So, plainly: Hatchet is a tool for **durable execution**. The phrase sounds heavier than it is. All it really means is that the work your backend does — fetching a thing, parsing it, saving it, retrying it when it breaks — is tracked in a database instead of held in memory. If a process dies halfway through, the system knows where it was and can continue. That's the whole pitch behind "durable."

### Why You'd Reach For This

Here's how I like to think about durable execution, at least with my current understanding:

If you've ever written a database transaction — `BEGIN; UPDATE ...; INSERT ...; COMMIT;` — you've already met half of the problem Hatchet solves. Transactions exist because multiple operations need to either all succeed or be cleaned up; otherwise you're left with a half-updated system. The catch: DB transactions only work _inside one database_. The moment your "operation" is fetch from storage, then call a parser, then save to a DB, then notify a user — four different services — the database can't help you anymore.

Hatchet fills that gap. It won't _roll back_ a half-finished cross-service operation the way a DB transaction would (once you've called the parser, you've called it). What it does give you is the next-best thing: **every step is recorded, every failure is visible, and the work resumes from where it left off instead of silently dying.** If a step needs to undo earlier work on failure, you write that explicitly (`onFailure`, retries, compensating tasks). Hatchet guarantees those hooks actually run.

So: think of it less as "transactions across services" and more as "the durable scaffolding you'd need to build something transaction-shaped across services."

### The Architecture (In Plain English)

There are three pieces to keep straight:

1. **Control Plane (Server)** — The brain. An API server you can run locally in Docker or use as a hosted service. It schedules work, tracks state, and powers a dashboard.

2. **Workers** — Your code. Long-running processes (running in Docker, Kubernetes, or just on your laptop) that connect to the control plane and tell it which tasks they can run.

3. **PostgreSQL Database** — The memory. State for every run lives here. If a worker crashes mid-task, the database still has the run's progress, and the task can pick up again.

The coordination happens between the server and your workers — your code never has to think about queues, locks, or where state lives.

### What is a Task?

A **task** is a unit of work. It's just a function with a name. Fetch a document. Parse it. Save it. Each of those could be considered a task.

```typescript
const fetchDocument = pipeline.task({
  name: "fetch-document",
  fn: async (input) => {
    const res = await fetch(`https://storage.api/docs/${input.documentId}`);
    return await res.json();
  },
});
```

That's the whole shape of it — a function, a name, and some optional configuration like retries or timeouts.

### What is a Workflow?

A **workflow** is a group of tasks with dependencies between them. You're essentially saying: "Run task A. When A finishes, run task B. When B finishes, run task C."

```typescript
export const documentPipeline = hatchet.workflow({
  name: 'document-pipeline',
});

const fetchDoc = documentPipeline.task({ name: 'fetch-document', fn: async (input) => { ... } });
const parseDoc = documentPipeline.task({ name: 'parse-document', parents: [fetchDoc], fn: async (input, ctx) => { ... } });
const saveState = documentPipeline.task({ name: 'save-state', parents: [parseDoc], fn: async (input, ctx) => { ... } });
```

Define it once, trigger it whenever you need it. The dependency graph (`parents: [...]`) is how Hatchet knows which order to run things in.

---

## 2. Local Setup / Connecting to Hatchet

The sections below cover the plumbing you need to actually run Hatchet locally. If you just want to understand the concepts, you can skip these and come back when you're ready to set things up. Click to expand:

<details>
<summary><strong>What is a Tenant?</strong></summary>

A **tenant** is logical isolation on the server. Think of it as a workspace. One tenant = one isolated set of workflows, workers, and data.

In practice:

- One Hatchet server might have `dev`, `staging`, `prod` tenants
- Each tenant has its own API tokens, workers, workflows
- A token from the `dev` tenant can't access `prod` data

For learning, you'll have one default tenant. For production, you might split by environment.

</details>

<details>
<summary><strong>What is a Profile?</strong></summary>

**This is the source of confusion.** A profile is a **local CLI bookmark**. It's saved on YOUR machine, not the server.

When you run:

```bash
hatchet profile add --name my-local --token <token>
```

You're creating a file locally that says: "When I use this profile, use this token and this server URL." It's just a convenience so you don't type `--token xxx` every time.

**Profiles are NOT server-side.** The dashboard doesn't see them. Two profiles can point to the same tenant.

</details>

<details>
<summary><strong>Auth, Env Vars, and Getting Connected</strong></summary>

To connect your worker to Hatchet, you need two things:

1. **`HATCHET_CLIENT_TOKEN`** — Your API key. You get it from the dashboard under Settings → API Tokens. It proves your worker is allowed to talk to the server.

2. **`HATCHET_CLIENT_TLS_STRATEGY=none`** — Only for local Docker. Tells the SDK: "This server doesn't have TLS certificates set up, so don't try HTTPS."

If you're using the CLI (`hatchet worker dev`), it handles these for you via your profile. If you're running a script directly, you export them:

```bash
export HATCHET_CLIENT_TOKEN=<your-token>
export HATCHET_CLIENT_TLS_STRATEGY=none
bun start
```

That's the whole setup. Everything else is handled.

</details>

<details>
<summary><strong>hatchet.yaml</strong></summary>

This file tells the CLI how to develop your app locally. It's a dev convenience file, not something your code reads:

```yaml
version: "1"
namespace: my-project
workflows:
  - name: simple
    description: "My simple workflow"
    tasks:
      - name: "fetch-document"
commands:
  - name: "run:simple"
    description: "Trigger the workflow"
    command: "bun run run:simple"
on:
  event:
    type: "workflow_run_complete"
```

It tells the CLI:

- What commands to expose (`hatchet trigger simple`)
- How to start your app (`hatchet worker dev`)
- What files to watch for hot-reload

You don't need it to run your code. It's just nice to have for development.

</details>

---

## 3. Workers vs Tasks: The Mental Model

This was the part I had to sit with for a bit before it clicked. "Worker" and "task" are two words that get used a lot in backend land, and Hatchet uses them in a specific way.

### How I think about it now

A **task** is a function — a single unit of work, like "fetch this document" or "save this row." That's it. It doesn't run on its own; it just sits there as a definition until something asks for it.

A **worker** is the process that actually runs tasks. It's a long-lived program — running on your laptop, in Docker, in Kubernetes, wherever — that boots up, opens a connection to the Hatchet server, and registers what it can do. Once registered, it sits idle and waits for the server to hand it work.

The flow looks roughly like this:

```
Workflow: "document-pipeline"
   ├── Task: "fetch-document"
   ├── Task: "parse-document"
   └── Task: "save-state"

Worker registers capabilities  →  server routes work
```

What I found neat about this is that you never tell the server "put this job on queue X." The worker says "I can run these tasks," the server keeps track of who can do what, and when a workflow is triggered the server figures out where to send each task. The dependency graph between tasks (`parents: [fetchDoc]`) is part of the workflow definition, so the order is enforced for you.

### What Hatchet provides

Putting it together, here's what I noticed Hatchet gives you out of the box:

| Thing                        | How it works in Hatchet                                                    |
| ---------------------------- | -------------------------------------------------------------------------- |
| **Routing work to a worker** | The worker registers the tasks it can run; the server routes work to it.   |
| **Inspecting a stuck run**   | The dashboard shows the live state of every run — task by task.            |
| **Chaining steps**           | `parents: [taskA]` declares the dependency; Hatchet enforces ordering.     |
| **Retries with backoff**     | Configured per task (`retries: 3, backoffFactor: 2.0`), visible in the UI. |
| **State after a crash**      | Persisted in Postgres; runs resume from the last checkpoint.               |
| **Adding worker capacity**   | Start another worker process — it registers itself automatically.          |

None of this needs a glue layer in your code. You define tasks, declare dependencies, start a worker, and the orchestration is handled.

### How Workers Actually Work

A worker is just a long-running process. When it starts, it looks roughly like this:

```typescript
const worker = await hatchet.worker("doc-worker", {
  workflows: [documentPipeline],
});

await worker.start();
```

That call connects to the Hatchet server and registers: "I'm here, and I can run tasks from the `documentPipeline` workflow." The server records that, and from then on the worker sits idle, listening. When a workflow is triggered, Hatchet picks a worker that's registered the relevant tasks and dispatches work to it.

A few things that came up while I was poking around:

- **Can you dedicate workers to specific tasks?** Not at the task level directly — a worker handles whichever workflows you pass to it. If you want a worker to only handle a subset of tasks, the way to do it is to put those tasks in a separate workflow and only register that workflow on that worker.
- **Are workers always-on or on-demand?** They're long-running processes. They sit idle when there's no work. Hatchet doesn't auto-scale them for you, but running multiple instances of the same worker image is the standard way to add capacity — they'll all register and the server distributes work among them.

---

## 4. Let's cut to the chase — and get into the code already

Now let's make this concrete. Your use case:

1. API receives a request to process a document
2. Fetch the document from storage
3. Send it to a parsing service
4. Save the parsed content to the database
5. Return the result to the user

This is perfect for Hatchet. Here's how you'd model it:

```typescript
import { hatchet } from "./hatchet-client";

type Input = { documentId: string; userId: string };
type Output = { status: string; parsedContent: string };

export const documentPipeline = hatchet.workflow<Input, Output>({
  name: "document-pipeline",
});

// Step 1: Fetch from storage
const fetchDoc = documentPipeline.task({
  name: "fetch-document",
  retries: 3,
  executionTimeout: "10s",
  fn: async (input) => {
    const res = await fetch(`https://storage.api/docs/${input.documentId}`);
    if (!res.ok) throw new Error("Failed to fetch document");
    const doc = await res.json();
    return { content: doc.content, metadata: doc.metadata };
  },
});

// Step 2: Parse (depends on step 1)
const parseDoc = documentPipeline.task({
  name: "parse-document",
  parents: [fetchDoc],
  retries: 2,
  executionTimeout: "20s",
  fn: async (input, ctx) => {
    const doc = ctx.taskOutput(fetchDoc); // Get output from parent
    const res = await fetch("https://parser.api/parse", {
      method: "POST",
      body: JSON.stringify(doc),
    });
    if (!res.ok) throw new Error("Parsing failed");
    const parsed = await res.json();
    return { parsedContent: parsed.content };
  },
});

// Step 3: Save to DB (depends on step 2)
const saveState = documentPipeline.task({
  name: "save-state",
  parents: [parseDoc],
  retries: 3,
  executionTimeout: "5s",
  fn: async (input, ctx) => {
    const parsed = ctx.taskOutput(parseDoc); // Get output from parent
    const res = await fetch("https://db.api/save", {
      method: "POST",
      body: JSON.stringify({
        content: parsed.parsedContent,
        userId: input.userId,
      }),
    });
    if (!res.ok) throw new Error("DB save failed");
    return { saved: true };
  },
});

// Step 4: Build response (depends on step 3)
const respond = documentPipeline.task({
  name: "build-response",
  parents: [saveState],
  fn: async (input, ctx) => {
    const parsed = ctx.taskOutput(parseDoc);
    return { status: "success", parsedContent: parsed.parsedContent };
  },
});
```

Now, in your API:

```typescript
// Express/Fastify route
app.post("/process-document", async (req, res) => {
  const { documentId, userId } = req.body;

  // Trigger the workflow
  const result = await documentPipeline.run({
    documentId,
    userId,
  });

  // result contains the output from the final task
  res.json(result);
});
```

Hit the endpoint. The workflow runs. Hatchet handles all the orchestration, retries, state tracking. You get the result back.

That's it. That's the whole pattern.

### Fire-and-Wait vs Fire-and-Forget

In the example above, we used `run()` which **waits** for the workflow to complete and returns the result. This is "fire-and-wait."

```typescript
const result = await documentPipeline.run({ documentId, userId });
// result is ready, return it
res.json(result);
```

If your workflow takes a long time (seconds to minutes), you might want "fire-and-forget":

```typescript
await documentPipeline.runNoWait({ documentId, userId });
// Don't wait for completion, return immediately
res.json({ status: "processing", id: workflowId });
```

Then the client polls for the result later, or you webhook them when done.

Rule of thumb that's served me well: start with `run()`. Move to `runNoWait()` only when you have a concrete reason. For typical workflows in the 10–40 second range, fire-and-wait is usually sufficient and keeps things simple.

---

## 5. Workflow Strategies: DAG vs Durable Tasks vs Fan-Out

You now know how to model a linear pipeline. But Hatchet gives you multiple ways to organize your work depending on your situation.

### Strategy 1: DAG (Directed Acyclic Graph)

A DAG is a **fixed pipeline** you know upfront. Nodes are tasks, edges are dependencies.

**When to use:** You know all the steps before execution. The shape is always the same.

```
fetch-document → parse-document → save-state → build-response
```

This is what we did above.

**Pros:**

- Visible in the dashboard — you can see the entire pipeline structure
- Per-step retries and timeouts
- Per-step error handling
- Easy to parallelize later

**Cons:**

- Can't make runtime decisions about what to do next
- Can't spawn unknown numbers of children

### Strategy 2: Durable Tasks

A **durable task** is an orchestrator function whose control flow is checkpointed by Hatchet. It can spawn other tasks at runtime, wait for them, get evicted while waiting, and later resume from the saved checkpoint.

That's the important nuance: the child tasks are not the special part by themselves. You can call another task from a normal task too. The special part is that a durable task makes the **parent's orchestration logic** durable.

**When to use:** You don't know the shape of work until runtime, or you need to spawn child tasks and safely wait for them without rerunning the whole parent from scratch.

Example: Your document has multiple pages, and you need to parse each one. You don't know how many pages until you inspect the document.

```typescript
const orchestrator = documentPipeline.durableTask({
  name: "smart-orchestrator",
  retries: 1,
  fn: async (input, ctx) => {
    // Step 1: Fetch and inspect
    const docRes = await fetch(`https://storage.api/docs/${input.documentId}`);
    const doc = await docRes.json();

    // Step 2: Decide what to do at runtime
    const parseTasks = [];
    for (const page of doc.pages) {
      // Spawn a child task for each page
      const parsePromise = parsePageTask.run({ page, userId: input.userId });
      parseTasks.push(parsePromise);
    }

    // Step 3: Wait for all children
    const parseResults = await Promise.all(parseTasks);

    // Step 4: Save combined result
    const saveRes = await fetch("https://db.api/save", {
      method: "POST",
      body: JSON.stringify({
        content: parseResults,
        userId: input.userId,
      }),
    });

    return { status: "success", parsedPages: parseResults.length };
  },
});
```

You might look at that and think: "Can't I put the same `Promise.all(parseTasks)` inside a normal `.task`?"

Yes, you can. But Hatchet treats the parent differently.

**Inside a normal `.task`:**

- The parent task is just a black box function
- It spawns child tasks and waits
- The parent worker slot stays occupied while waiting
- If the parent crashes while waiting, the parent may retry from the start
- That means it may spawn the same children again unless you handle deduping yourself

**Inside a `.durableTask`:**

- Hatchet checkpoints the parent orchestration
- The child task runs are remembered
- The parent can be evicted while children run, freeing its worker slot
- When children finish, the parent resumes from the checkpoint
- If the parent crashes, Hatchet can continue around the existing child runs instead of blindly rerunning everything

So the difference is not "can I use `Promise.all`?" You can use it in both. The difference is whether the waiting/spawning parent is durable and child-state-aware.

**Pros:**

- Dynamic child spawning
- Runtime decisions
- Can handle variable-sized workloads
- Parent resumes from checkpoints instead of rerunning orchestration from scratch
- Slot efficiency (the parent's slot is freed while children run — we'll explain this later)

**Cons:**

- Less visible in dashboard (you see the orchestrator, but not the children until they're spawned)
- Harder to debug
- More moving parts than a simple DAG

### Strategy 3: Fan-Out (Parallel Tasks)

Sometimes you want to run multiple tasks in parallel, then wait for all of them before proceeding.

In a DAG, you do this by having multiple tasks depend on the same parent:

```
         fetch-document
             ↙        ↘
       parse         save-metadata
             ↘        ↙
          build-response
```

```typescript
const fetchDoc = documentPipeline.task({
  name: 'fetch-document',
  fn: async (input) => { ... },
});

const parseDoc = documentPipeline.task({
  name: 'parse-document',
  parents: [fetchDoc],  // depends on fetch
  fn: async (input, ctx) => { ... },
});

const saveMetadata = documentPipeline.task({
  name: 'save-metadata',
  parents: [fetchDoc],  // also depends on fetch
  fn: async (input, ctx) => { ... },
});

const respond = documentPipeline.task({
  name: 'build-response',
  parents: [parseDoc, saveMetadata],  // depends on BOTH
  fn: async (input, ctx) => {
    const parsed = ctx.taskOutput(parseDoc);
    const saved = ctx.taskOutput(saveMetadata);
    return { status: 'success', parsed, saved };
  },
});
```

Hatchet automatically waits for both `parseDoc` and `saveMetadata` to finish before starting `respond`. No polling. No manual coordination. You just declare the dependencies.

**When to use:** Multiple independent operations that can run in parallel, but you need their results before proceeding.

### Which Strategy to Use?

**Use DAG if:**

- You know all the steps upfront
- The pipeline structure is fixed
- You want visibility and per-step control

**Use Durable Task if:**

- The number of steps is unknown until runtime
- You need dynamic branching or looping
- You're spawning many children
- You want the parent orchestration to remember spawned children and resume after waits/crashes

**Use Fan-Out if:**

- Multiple steps can run in parallel
- You need their results before the next step
- The number of parallel branches is fixed

---

## 6. Retries: Making Your Workflows Resilient

In BullMQ I'd set `attempts: 3` and call it a day — then realize a year later I'd never configured `backoff`, so every retry hammered the same dead service in the same second. Hatchet makes this visible: retries, backoff, and which attempt you're on are right there in the UI.

### Throw an Error → Retry

If you throw a normal `Error`, Hatchet will retry:

```typescript
const parseDoc = documentPipeline.task({
  name: "parse-document",
  retries: 3,
  fn: async (input, ctx) => {
    const res = await fetch("https://parser.api/parse", {
      method: "POST",
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      throw new Error("Parser API failed"); // ← Hatchet will retry
    }

    return await res.json();
  },
});
```

With `retries: 3`, it will:

1. Try once
2. Fail, wait, try again
3. Fail, wait, try again
4. Fail, wait, try again
5. Give up and call `onFailure`

### Throw NonRetryableError → Skip Retries

Some errors are permanent. Bad input. Invalid token. No point retrying.

```typescript
import { NonRetryableError } from "@hatchet-dev/sdk";

const parseDoc = documentPipeline.task({
  name: "parse-document",
  retries: 3,
  fn: async (input, ctx) => {
    if (!input.documentId) {
      throw new NonRetryableError("Missing documentId"); // ← No retry
    }

    const res = await fetch("https://parser.api/parse");
    if (res.status === 400) {
      throw new NonRetryableError("Invalid document format"); // ← No retry
    }
    if (res.status === 500) {
      throw new Error("Server error"); // ← Will retry
    }

    return await res.json();
  },
});
```

### Try/Catch Inside the Task → No Retry

If you handle the error yourself, Hatchet sees success:

```typescript
const parseDoc = documentPipeline.task({
  name: "parse-document",
  fn: async (input, ctx) => {
    try {
      const res = await fetch("https://parser.api/parse");
      return await res.json();
    } catch (err) {
      console.log("Parse failed, using fallback");
      return { parsedContent: "fallback", parseFailed: true };
    }
    // No error thrown, so Hatchet sees success
    // Even though parsing actually failed
  },
});
```

This is **graceful degradation**. You don't want to retry, you want to continue with a fallback.

### Summary: The Three Cases

| Situation                                  | Code                            | Behavior                                   |
| ------------------------------------------ | ------------------------------- | ------------------------------------------ |
| Want to retry                              | `throw new Error()`             | Hatchet retries up to `retries` times      |
| Don't want to retry (permanent error)      | `throw new NonRetryableError()` | Hatchet skips retries, goes to `onFailure` |
| Handle gracefully (continue with fallback) | `try/catch` and return          | Hatchet sees success, continues            |

### Backoff Factor: The Exponential Wait

When retrying, you don't want to hammer the failing service. Exponential backoff means the wait between retries grows:

```typescript
const parseDoc = documentPipeline.task({
  name: "parse-document",
  retries: 4,
  backoffFactor: 2.0,
  backoffMaxSeconds: 60,
  fn: async (input, ctx) => {
    // ...
  },
});
```

With `backoffFactor: 2.0`:

- Retry 1: wait 1 second, try again
- Retry 2: wait 2 seconds, try again
- Retry 3: wait 4 seconds, try again
- Retry 4: wait 8 seconds, try again
- Give up

With `backoffMaxSeconds: 60`, it caps at 60:

- Retry 1: 1s
- Retry 2: 2s
- Retry 3: 4s
- Retry 4: 8s
- Retry 5: 16s
- Retry 6: 32s
- Retry 7: 60s (capped)
- Retry 8: 60s (capped)

This prevents hammering a struggling service while still giving it time to recover.

---

## 7. Error Handling and Task Cancellation

Hatchet gives you multiple ways to handle failures, from workflow-level to per-task.

### Workflow-Level onFailure

If any task fails (after retries), Hatchet calls your `onFailure` handler:

```typescript
documentPipeline.onFailure({
  name: "handle-pipeline-failure",
  fn: async (input, ctx) => {
    const errors = ctx.errors();
    // errors = { 'parse-document': 'Error message', ... }

    console.log("Pipeline failed:", errors);

    // Send alert, cleanup, rollback, etc.
    await fetch("https://alerts.api/notify", {
      method: "POST",
      body: JSON.stringify({
        userId: input.userId,
        reason: Object.keys(errors)[0],
      }),
    });

    return { status: "failed", reason: Object.keys(errors)[0] };
  },
});
```

`ctx.errors()` returns a map of which tasks failed and why. You can branch on this:

```typescript
documentPipeline.onFailure({
  name: "smart-failure-handler",
  fn: async (input, ctx) => {
    const errors = ctx.errors();

    if (errors["parse-document"]) {
      // Parsing failed — maybe the document is corrupted
      await logToStorage({ error: "parse", docId: input.documentId });
    }

    if (errors["save-state"]) {
      // Database failed — maybe we need to retry save later
      await queue.push({ type: "save-later", docId: input.documentId });
    }

    return { status: "failed", handled: true };
  },
});
```

### Per-Task Error Handling (try/catch)

For finer control, catch inside the task:

```typescript
const parseDoc = documentPipeline.task({
  name: "parse-document",
  retries: 2,
  fn: async (input, ctx) => {
    try {
      const res = await fetch("https://parser.api/parse", {
        method: "POST",
        body: JSON.stringify(input),
      });

      if (res.status === 500) {
        throw new Error("Parser service is down"); // Retry this
      }

      if (res.status === 400) {
        throw new NonRetryableError("Invalid document"); // Don't retry
      }

      return await res.json();
    } catch (err) {
      // Final fallback — don't retry
      console.log("Parse failed, but continuing", err);
      return { parsedContent: null, error: err.message };
    }
  },
});
```

The task returns successfully (no error thrown), so the next task continues. But the downstream task knows parsing failed because `ctx.taskOutput(parseDoc)` contains `{ error: ... }`.

### Canceling Tasks: The Tricky Part

Here's where DAG has limitations. In a DAG with parallel tasks, if one branch finishes quickly and determines you don't need the other branch, you might want to cancel it.

**The problem:** Tasks can't directly cancel siblings in a DAG.

**What you CAN do — external cancellation:**

From outside the workflow (in your API code), you can cancel a task run:

```typescript
// In your API code, not inside a task
import { hatchet } from "./hatchet-client";

const workflowRun = await documentPipeline.run({
  documentId: "doc-123",
  userId: "user-456",
});

// Check status of a specific task
const taskRuns = await hatchet.listTaskRuns({ workflowRunId: workflowRun.id });
const parseRun = taskRuns.find((t) => t.taskName === "parse-document");

if (parseRun.status === "RUNNING") {
  // Cancel it
  await hatchet.cancelTaskRun({ taskRunId: parseRun.id });
}
```

This is external API usage, not inside a task.

**What you CAN do — durable orchestrator:**

If you use a durable task, you have direct control over children:

```typescript
const orchestrator = documentPipeline.durableTask({
  name: 'smart-orchestrator',
  fn: async (input, ctx) => {
    // Spawn two operations in race
    const parsePromise = parseTask.run({ ... });
    const savePromise = saveTask.run({ ... });

    // Whichever finishes first
    const result = await Promise.race([parsePromise, savePromise]);

    // The loser is still running, but you don't wait for it
    return result;
  },
});
```

The loser still runs (Hatchet doesn't auto-kill), but you don't wait. This is useful for timeouts — let multiple approaches race, use the first one that succeeds.

**What you CAN do — self-cancel:**

A task can cancel itself (not another task):

```typescript
const parseDoc = documentPipeline.task({
  name: "parse-document",
  fn: async (input, ctx) => {
    // ... do some work ...

    if (someCondition) {
      // Cancel this task itself
      await ctx.aio_cancel();
      // Execution never reaches the return
    }

    return { parsed: true };
  },
});
```

Use case: "I realized I don't need to finish, cancel myself and free up the slot."

### AbortController for HTTP Calls

When you make HTTP requests in a task, pass the abort signal:

```typescript
const parseDoc = documentPipeline.task({
  name: "parse-document",
  executionTimeout: "10s", // Kill if it takes >10s
  fn: async (input, { abortController }) => {
    const res = await fetch("https://parser.api/parse", {
      method: "POST",
      body: JSON.stringify(input),
      signal: abortController.signal, // Pass the signal
    });

    return await res.json();
  },
});
```

When the task times out or is externally canceled, the fetch request gets aborted too. Clean cancellation.

---

## 8. Flow Control: Taming Concurrency and Throughput

Now you know how to build workflows. Time to talk about controlling how many workflows run at once, how fast they run, and how your workers stay healthy.

### Slots: Worker Capacity

`slots` is how many tasks a single worker process can execute simultaneously.

```typescript
const worker = await hatchet.worker("doc-worker", {
  workflows: [documentPipeline],
  slots: 10, // This worker can handle 10 tasks at once
});
```

If you trigger 12 tasks and `slots: 10`:

- 10 start immediately
- 2 wait in queue
- As tasks finish, queued tasks start

Slots protect your worker from doing too much at once. Keep slots low if tasks are CPU-heavy, memory-heavy, or talk to a downstream service that cannot handle many concurrent requests. Higher slots are fine when tasks mostly wait on lightweight I/O and your dependencies can handle the concurrency.

**How it interacts with DAG dependencies:**

If your workflow has 4 sequential tasks, then:

- Only 1 slot is used per workflow run (tasks run one at a time)
- If you trigger 3 workflows, 3 slots are used

But if your workflow has parallel tasks:

- fetchDoc, parseDoc, and saveMetadata all run in parallel
- That's 3 slots per workflow run
- If you trigger 3 workflows, 9 slots are used

Slots is **per-worker**, not per-workflow.

### concurrency.maxRuns: Fairness Policy

`concurrency.maxRuns` is a **server-side limit** on how many instances of a workflow/task can run simultaneously **for a given key**.

```typescript
export const documentPipeline = hatchet.workflow<Input, Output>({
  name: "document-pipeline",
  concurrency: {
    maxRuns: 5,
    expression: "input.userId", // Group by userId
    limitStrategy: "GROUP_ROUND_ROBIN",
  },
});
```

Now:

- User "alice" triggers 10 workflows
- Only 5 of alice's workflows run at once
- The other 5 wait in queue
- User "bob" also triggers 5 workflows
- All 5 of bob's run (separate bucket)

**Why?** Fairness. One user doesn't monopolize your workers.

**`expression` is the grouping key.** Common patterns:

- `'input.userId'` — limit per user
- `'input.tenantId'` — limit per customer
- `'input.projectId'` — limit per project

**`limitStrategy` controls what happens when the limit is hit:**

| Strategy             | Behavior                                                                       |
| -------------------- | ------------------------------------------------------------------------------ |
| `GROUP_ROUND_ROBIN`  | New runs wait in queue, processed fairly                                       |
| `CANCEL_IN_PROGRESS` | Kill the running one, start the new one (useful for "only the latest matters") |
| `CANCEL_NEWEST`      | Keep the running one, reject the new one                                       |

Example of `CANCEL_IN_PROGRESS`:

```typescript
export const userDataSyncWorkflow = hatchet.workflow({
  name: "sync-user-data",
  concurrency: {
    maxRuns: 1,
    expression: "input.userId",
    limitStrategy: "CANCEL_IN_PROGRESS",
  },
});
```

If user "alice" triggers sync 3 times in a row:

- Sync 1 starts
- Sync 2 is triggered → Sync 1 is killed, Sync 2 starts
- Sync 3 is triggered → Sync 2 is killed, Sync 3 starts
- Only Sync 3 runs to completion

This is useful for "refresh" operations — you only care about the latest.

### rateLimits: Time-Based Throttling

If you need to limit throughput over time (not just simultaneity), use rate limits.

```typescript
// Static rate limit — global cap
await hatchet.admin.putRateLimit({
  key: 'parser-api',
  limit: 100,
  duration: 'MINUTE',
});

const parseDoc = documentPipeline.task({
  name: 'parse-document',
  rateLimits: [
    {
      key: 'parser-api',
      units: 1,  // Each parse consumes 1 unit
    },
  ],
  fn: async (input) => { ... },
});
```

Result: Across ALL workers, `parse-document` can start at most 100 times per minute. If you try more, Hatchet re-queues the task until the window resets.

**Dynamic rate limits** — per-key:

```typescript
const parseDoc = documentPipeline.task({
  name: 'parse-document',
  rateLimits: [
    {
      dynamicKey: 'input.userId',  // Per-user limit
      units: 1,
      limit: 10,
      duration: 'MINUTE',
    },
  ],
  fn: async (input) => { ... },
});
```

Each user gets 10 parses per minute. User "alice" hitting 15 times doesn't affect user "bob".

### scheduleTimeout: The Queue Escape Hatch

This is the timeout for how long a task can **wait in queue** before being canceled.

```typescript
const parseDoc = documentPipeline.task({
  name: 'parse-document',
  scheduleTimeout: '5m',      // Can't wait longer than 5 minutes
  executionTimeout: '30s',    // Can't run longer than 30 seconds
  fn: async (input) => { ... },
});
```

- `scheduleTimeout: '5m'` — If the task doesn't start within 5 minutes, cancel it
- `executionTimeout: '30s'` — If the task runs longer than 30 seconds, kill it

Use `scheduleTimeout` if you have an unbounded queue and don't want tasks piling up forever.

### The Complete Comparison Table

Now, the thing everyone gets confused about:

| Concept                 | What it limits                            | Level       | Config                                                    |
| ----------------------- | ----------------------------------------- | ----------- | --------------------------------------------------------- |
| **slots**               | Max tasks a worker handles simultaneously | Per worker  | `slots: 10`                                               |
| **concurrency.maxRuns** | Max runs for a key simultaneously         | Server-wide | `concurrency: { maxRuns: 5, expression: 'input.userId' }` |
| **rateLimits**          | Max runs over a time window               | Server-wide | `rateLimits: [{ limit: 100, duration: 'MINUTE' }]`        |
| **scheduleTimeout**     | Max wait time in queue                    | Per task    | `scheduleTimeout: '5m'`                                   |
| **executionTimeout**    | Max execution time                        | Per task    | `executionTimeout: '30s'`                                 |

**How they work together:**

1. You trigger a workflow
2. Hatchet checks: is this user over their `concurrency.maxRuns` limit? If yes, wait
3. Hatchet checks: is the rate limit hit? If yes, re-queue
4. Task waits in queue
5. Worker has a free slot? If yes, start the task
6. Task runs
7. Exceeded `executionTimeout`? If yes, kill it
8. Task waited too long in queue? If yes, cancel it before even starting

---

## 9. Cheat Sheet and Common Gotchas

### Common Pitfalls

**Pitfall 1: Profile vs Tenant Confusion**

- **Profile** = local bookmark (on your machine)
- **Tenant** = workspace on the server
- A profile just stores a token. It doesn't create a tenant.

**Pitfall 2: CLI works but script doesn't**

- You're missing env vars (`HATCHET_CLIENT_TOKEN`, `HATCHET_CLIENT_TLS_STRATEGY`)
- Export them before running your script

**Pitfall 3: Forgetting that `slots` is per-worker, not per-task**

- If you have 1 worker with `slots: 10` and trigger 100 workflows, only 10 start at a time

**Pitfall 4: Tasks can't cancel siblings in a DAG**

- If two tasks run in parallel, one can't directly cancel the other
- Use external API cancellation or model it as a durable orchestrator

**Pitfall 5: Confusing concurrency limits**

- `slots` = hardware limit (worker capacity)
- `concurrency.maxRuns` = fairness limit (per-key cap)
- `rateLimits` = time-based throttle
- They're different, and all three apply

**Pitfall 6: Throwing an error inside try/catch doesn't trigger retry**

- If you catch the error, Hatchet sees success (no error thrown)
- To retry, throw the error outside the catch or re-throw

```typescript
// Won't retry (error caught)
try {
  await fetch(...);
} catch (err) {
  console.log('Failed'); // Error is swallowed
}

// Will retry (error thrown)
try {
  await fetch(...);
} catch (err) {
  throw new Error('Fetch failed');  // Error thrown → Hatchet retries
}
```

**Pitfall 7: Forgetting `parents` array means tasks run in any order**

- No `parents` = task has no dependencies, can start immediately
- Include `parents: [otherTask]` to enforce order

```typescript
// This runs in parallel (no deps)
const task1 = workflow.task({ name: 'task1', fn: async () => { ... } });
const task2 = workflow.task({ name: 'task2', fn: async () => { ... } });

// This runs task2 after task1
const task2 = workflow.task({ name: 'task2', parents: [task1], fn: async () => { ... } });
```

### Quick Decisions

**When to use fire-and-wait?**

- User is waiting for a response
- Workflow finishes in seconds

**When to use fire-and-forget?**

- Workflow is long (minutes)
- Client will poll or you'll webhook back

**When to use DAG vs Durable?**

- DAG: Fixed pipeline, all steps known upfront
- Durable: Runtime decisions, dynamic fan-out

---

## Final Thoughts

For products with critical pipelines that touch multiple services, which most production apps eventually do, tools like Hatchet are a must-have. If you are not using any durable workflow tool for this kind of work, you are probably shipping more irresponsibly than you think.

But it's never too late. Hopefully this blog helps you get started with Hatchet quickly.

Why I chose Hatchet: I knew I had to introduce some tool for building pipelines more responsibly. Temporal was the one I already knew about, but being a startup / modern-tech person, I generally dislike old, legacy-feeling, enterprise-heavy, bloated tools. When I researched alternatives, I found Hatchet. It felt modern, fairly battle-tested, and had good DX, especially with TypeScript.

Other tools you can look into:

- [Trigger.dev](https://trigger.dev)
- [Inngest](https://inngest.com)
- [Windmill](https://windmill.dev)
- [Restate](https://restate.dev)

Let me know what you thought of this blog: what clicked, what felt confusing, or what you'd want explained better. I'd genuinely love to hear what was useful and what could be clearer.
