# Blog Index: Durable Objects Rabbit Hole

Working title:

`I Asked What Durable Objects Are. Ended Up in a Distributed Systems Rabbit Hole.`

Alternative:

`I Asked About Durable Objects. The AI Sent Me Through Redis, Actors, and Workflows.`

## Core Idea

This blog is not a Durable Objects guide.

It is a log of a real AI conversation where a small side-project question became a long rabbit hole into Redis concurrency, Durable Objects, actor model, workflows, and distributed-systems thinking.

Main thesis:

> The useful part was not that AI gave me the answer. The useful part was that I kept pushing until the answer matched my actual mental model and my actual problem.

## Issue / Cause / Fix

Issue: if written like a guide, the post will feel fake and jumpy.

Cause: the real conversation was not linear teaching. It was confusion -> pushback -> correction -> narrower understanding.

Fix: write as a timestamp/log-style journey, with short chat excerpts at turning points.

## Main Characters

1. Durable Objects: the thing that triggered the rabbit hole.
2. Redis concurrency bug: the real-world problem I kept mapping everything back to.
3. Actor model: the concept AI introduced that felt useful, then over-applied, then finally clicked as ownership.
4. Workflow/business logic: the missing second half that actor model did not solve.
5. AI itself: useful, but only after being questioned hard.

## Narrative Rules

- Keep first-person journey.
- Do not write like docs/tutorial.
- Show why each next question happened.
- Preserve the back-and-forth friction.
- Use exact chat snippets only at main pivots, not as transcript dump.
- Let technical explanation serve the story.
- Keep the final message about AI usage: do not accept; interrogate.

## Proposed Structure

### 1. The Small Side Quest

Purpose: open with a casual weekend/side-project setup.

What happens:

- I was looking into Cloudflare stack / API rate limiting.
- The question was small: how should I rate limit APIs?
- KV came up, then its eventual-consistency limitations came up.
- That naturally led to Durable Objects.

Transition:

> The moment Durable Objects entered the chat, the conversation stopped being about rate limiting.

Quote slot:

- Use a short line from the original DO question.

### 2. Durable Objects Sounded Like a Fix for a Bug I Had Just Faced

Purpose: connect DOs to the recent Redis/Hono concurrency bug.

What happens:

- AI explained DO as one active object per key.
- That sounded similar to the user's recent "same user, two requests" race.
- The Redis bug: Hono backend, one Docker Compose Redis service, state read as `idle`, then set to `processing`.
- The real issue: `GET -> IF -> SET` was not atomic.
- The user had already fixed it with a single Redis command / `sendCommand` style refactor.

Transition:

> So I asked the obvious question: if Durable Objects solve this, was my Redis fix basically the same idea?

Quote slot:

- Use the exact "two requests same user_id" question or a shortened excerpt.

### 3. The AI Said "Actor Model" and I Did Not Have That Mental Model Yet

Purpose: show how actor model entered, without abrupt jump.

What happens:

- AI used "actor" language while explaining Durable Objects.
- User asked what actor model means because it was new.
- AI explained actor as "owner of state, receives messages, mutates own state."
- DO became framed as Cloudflare-hosted actor.

Transition:

> That sounded clean, but it also sounded suspiciously close to just queueing.

Quote slot:

- Short AI phrasing: actor owns state / outside code sends messages.

### 4. My First Pushback: Is This Just Queuing?

Purpose: show the user did not accept actor framing too quickly.

What happens:

- User noticed that if A runs and B waits, that is queueing.
- AI agreed: queue is mechanism, ownership is principle.
- Durable Object ~= object + state + mailbox + event loop.
- User then asked: if locks/queues/mutexes can emulate this, why actors?

Transition:

> This was the first point where the AI's explanation sounded correct, but still not useful enough.

Quote slot:

- Use short user question around "doesn't it automatically mean queuing?"

### 5. The Deadlock Detour

Purpose: show how actor model widened into distributed systems.

What happens:

- AI used User/Order/Team/Invoice lock examples.
- User asked for a concrete visualization.
- Example became moving a user between teams while another operation deletes a team.
- Shared-state model needs multiple locks.
- Different lock orders can deadlock.
- Actor/DO model reduces this by making state ownership explicit.

Transition:

> This was useful, but it still was not my Redis bug.

Quote slot:

- Keep only a tiny phrase from the lock/deadlock example.

### 6. The Conversation Starts Splitting Into Layers

Purpose: introduce workflow concepts as they actually appeared.

What happens:

- User asked about actor-system failures too.
- AI introduced message loops, timeouts, partial failures.
- User challenged the examples again.
- Durable workflows, Temporal, sagas, compensation, idempotency entered.
- User pushed on category confusion: idempotency is principle, compensation is operation, saga is pattern, workflow engine is tool.

Transition:

> The more I pushed, the more the conversation stopped being "actors solve concurrency" and started becoming "which layer owns which problem?"

Quote slot:

- Use short distinction: distributed system = machines; durable workflow = business process.

### 7. The Big Split: Part 1 vs Part 2

Purpose: central technical realization.

What happens:

- Actor gives part 1:
  - one owner
  - ordered state transitions
  - safe mutation point
- Actor does not give part 2:
  - latest wins?
  - first wins?
  - cancel beats upgrade?
  - refund?
  - stale async result?
- Workflow/business logic owns part 2.

Transition:

> This is where my Redis bug finally started making sense again.

Quote slot:

- Use user's "part one / part two" realization.

### 8. The Sharpest Counter-Question: Redis Commands vs Business Operations

Purpose: make the Redis/actor/workflow distinction unavoidable.

What happens:

- AI said Redis only sequenced commands, not business operation.
- User asked: doesn't actor model also mostly sequence commands/state transitions?
- If upgrade starts and returns `pending`, cancel can still arrive before the upgrade workflow is complete.
- AI agreed: actor serializes state transitions, not the whole workflow.
- Workflow sequences long-running business process.

Transition:

> That was the moment the actor model stopped pretending to solve my whole problem.

Quote slot:

- Use the exact Redis guarantee line from user's note.

### 9. The Disappointing But Honest Answer

Purpose: preserve the key honesty: actor was not direct solution to user's bug.

What happens:

- User said: maybe I was only missing part 2.
- User asked where actor model really helps.
- AI admitted: for this specific Redis bug, actor model likely gave little value.
- The bug was mostly a business invariant / atomic operation / workflow semantics issue.
- Redis, Lua, transaction, actor, mutex, lock could all solve it.

Transition:

> That was weirdly satisfying, because the model finally stopped overreaching.

Quote slot:

- Short AI admission: for this specific bug, actor likely added little value.

### 10. Where Actor Model Finally Clicked

Purpose: show final positive value, without overstating it.

What happens:

- Actor model shines when many services/workers/devs mutate same business entity.
- It is not mainly "better concurrency."
- It is ownership boundaries.
- It says: do not let everybody touch state; everybody asks the owner.
- The user's Redis wrapper/class idea was already actor-like.

Transition:

> So the actor model was not useless. I had just been trying to use it for the wrong problem.

Quote slot:

- Use "Don't let everybody touch state" because it is the emotional click.

### 11. What This Taught Me About Chatting With AI

Purpose: main non-technical point of the blog.

What happens:

- AI can sound confident and still be answering a nearby-but-wrong problem.
- The user kept asking:
  - does this solve my actual issue?
  - is this just a queue?
  - where does actor model really help?
  - what part is workflow?
- That pushback forced the final answer to become narrower and more useful.
- The real skill: keep questioning until the explanation aligns with your own concrete problem.

Transition:

> The rabbit hole was not wasted. The confusion was the mechanism.

Quote slot:

- Use final reflection: actor model felt underwhelming because it was being mapped onto Redis bug.

### 12. Final Takeaways

Purpose: close with simple mental model.

Takeaways:

- Durable Objects made me ask the right question.
- Redis bug made the question real.
- Actor model answered ownership, not entire workflow correctness.
- Workflow/business logic answered process semantics.
- AI was helpful only because I did not let it overrule my confusion.

Final model:

```txt
Actor owns state.
Workflow owns process.
Database stores facts.
Business rules decide meaning.
```

Closing line direction:

> I did not come out thinking "I need actors everywhere." I came out thinking "I should never let an AI answer feel correct until I can map it back to my own problem."

## Quote Strategy

Use quotes only at pivot points:

1. Initial DO curiosity.
2. Redis/Hono concurrency bug.
3. Queueing pushback.
4. Part 1 / part 2 realization.
5. Redis command vs business operation distinction.
6. AI admission that actor was not direct fix.
7. Final "do not let everybody touch state" click.

Do not paste full responses.

Use pattern:

```md
At one point I asked, roughly:

> short exact query

The AI replied with the line that changed the direction:

> short exact reply
```

Then explain in first person.

## What Not To Do

- Do not title sections like a tutorial.
- Do not jump from Durable Objects straight to actor model without Redis bridge.
- Do not make actor model the hero.
- Do not make AI look omniscient.
- Do not hide that the AI over-applied actor framing at first.
- Do not turn this into "learn Durable Objects in 10 minutes."
- Do not overuse exact transcript blocks; it should feel like a log, not a chat dump.

## Suggested Blog Shape

Style:

- first-person
- conversational
- log-like
- technical but grounded
- honest about confusion

Approx length:

- 1800-2600 words

Possible section labels:

- `Log 01: The side quest`
- `Log 02: Durable Objects sounded familiar`
- `Log 03: Wait, is this just my Redis bug?`
- `Log 04: The AI says "actor model"`
- `Log 05: I keep pushing back`
- `Log 06: Part 1 vs Part 2`
- `Log 07: The answer gets smaller, but better`
- `Log 08: The actual takeaway`

## Summary Changed

- Turned checkpoints into a narrative index.
- Made the blog thesis about AI questioning / mental model alignment.
- Connected Durable Objects to the exact Redis/Hono concurrency bug.
- Kept actor model as a middle entity, not the final answer.
- Preserved workflow/business process as the missing second half.
- Added quote slots for real-chat feel without turning blog into transcript dump.
