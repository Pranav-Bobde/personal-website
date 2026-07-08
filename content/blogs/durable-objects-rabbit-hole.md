---
title: "I Asked What Durable Objects Are. Ended Up in a Distributed Systems Rabbit Hole."
date: "2026-07-02"
readingTime: "12 min read"
summary: "A late-night AI conversation that started with Cloudflare rate limiting and turned into a fight about actors, workflows, and a Redis bug I'd already fixed. The real lesson wasn't the answer — it was refusing to accept the answer until it mapped to my problem."
tags: ["durable objects", "distributed systems", "actor model", "ai", "redis"]
hidden: true
---

# I Asked What Durable Objects Are. Ended Up in a Distributed Systems Rabbit Hole.

This isn't a Durable Objects guide. If you're here for "learn Durable Objects in 10 minutes," close the tab, you'll be happier.

This is a log of a conversation I had with an AI on a weekend night that started as one small side-project question and turned into a three-hour argument about actors, workflows, and whether any of it actually applied to a bug I'd fixed the week before. The useful part was never the answer. The useful part was that I kept pushing until the answer stopped being impressive and started being *correct for me*.

Let me walk it back from the start.

---

## Log 01: The side quest

I was poking at a side project on the Cloudflare stack and hit the most boring question in the world: how should I rate limit my APIs? Nothing fancy. I basically asked what the chads on tech Twitter do.

The answer was reasonable — layer it. WAF rules at the edge for the crude stuff, Worker middleware for per-user and per-API-key limits, app-side limits where you actually need precision. Fine. I asked whether I should bolt on Upstash or Better Auth or something, and got told: you're already on Cloudflare, just key the Worker limits by user, don't add a dependency for this.

Then I poked at the thing I was actually curious about:

> don't nobody use CF KV for rate limiting?

And the answer is: you *can*, but only for approximate limits. KV is global and fast to read, but it's eventually consistent. During a burst, two edge locations can genuinely disagree about what the counter says. So if you need an *exact* limit, KV lies to you at exactly the wrong moment.

That's the sentence that flipped the whole night. "One truth vs distributed approximate state." Because the fix for that is Durable Objects, and the moment Durable Objects entered the chat, the conversation stopped being about rate limiting.

---

## Log 02: Durable Objects sounded familiar

So I asked the obvious follow-up — what *are* they, give me the mental model.

The framing I got: a Worker is a stateless function that runs anywhere. A Durable Object is one active object per key — a tiny stateful server that owns its little slice of state. Counters, chat rooms, multiplayer game state, AI credits. One key, one live instance, and everything for that key funnels through it.

And I sat there for a second because that sounded *exactly* like a bug I'd just been bitten by.

The week before, I'd had a race in a Hono backend. One Redis service in Docker Compose — not a cluster, not sharded, one container. The business rule was simple: two requests come in for the same `user_id`, and if that user is already `processing`, drop the second one. Except both requests would read the state, both would see `idle`, and both would happily set `processing`. The check and the write weren't one thing.

So I asked the question that actually mattered to me:

> two requests, same user_id, both read idle, both set processing — is Durable Objects the fix for this? is my Redis fix basically the same idea?

Because I *had* fixed it. I refactored the Redis code to stop doing `get` then `set` and instead push it through a single atomic command — `sendCommand` style, one operation, no gap in the middle for the second request to sneak through. And now this AI was describing Durable Objects like they solved the same problem, and I wanted to know if I'd reinvented something with a fancy name.

---

## Log 03: The AI says "actor model"

Here's where it got slippery. While explaining Durable Objects, the AI kept using a word I didn't have a mental model for.

> A Durable Object is basically a single-threaded actor with persistent storage, hosted by Cloudflare.

Actor. New word. So I stopped and asked for the real-world version, no jargon.

The explanation was clean: an actor *owns* its state. Nobody outside reaches in and mutates it. Outside code sends the actor a message, and the actor decides how to change its own state. A `UserActor(user_123)`, a bank-account actor, a chat actor. Requests don't touch the data — they ask the owner, and the owner does the work one message at a time.

That's tidy. Suspiciously tidy. Because if request A runs and request B has to wait its turn, that's just… a queue with good branding. So I said that.

---

## Log 04: I keep pushing back

> if A runs and B waits, isn't that just queuing?

The AI agreed, which I respected. But it drew a line I hadn't thought about: the queue is the *mechanism*, ownership is the *principle*. A Durable Object is roughly an object plus its internal state plus a mailbox plus an event loop. Yeah, there's a queue in there. But the point isn't "things happen one at a time," the point is "there is exactly one thing allowed to change this state, and everyone else has to go through it."

I still wasn't satisfied, so I pushed on the part that actually bugged me:

> if I can emulate all of this with locks and mutexes and queues, why is the actor model *better*?

And again, credit where it's due, the answer wasn't "actors are magic." The answer was: actors aren't magic and they don't make impossible things possible. The difference is architectural. Locks start from shared state and *add protection later* — you've got a mutable thing everybody can touch, and you sprinkle mutexes on top and pray you did it right. Actors start from ownership. Nobody can touch the state in the first place, so there's nothing to protect.

That reframing was the first genuinely useful thing. But it still wasn't my Redis bug.

---

## Log 05: The deadlock detour

To make the "locks add protection later" thing concrete, the examples got bigger. User, Order, Team, Invoice — a request grabs a couple of locks, another request grabs the same ones in a different order, and now you've built a deadlock without meaning to.

I asked it to actually draw one for me. The picture: move a user from Team A to Team B, while another operation is deleting Team A. In the shared-state world you're grabbing a lock on the user and a lock on the team, another request grabs them in the opposite order, and both sit there forever waiting on each other. In the actor world there's a `UserActor` and a `TeamActor`, and messages replace most of the direct locking, so the ordering trap mostly stops existing.

Useful. Genuinely. But I noticed the thread had quietly widened from "my two requests raced" to "here's how large systems deadlock," and I hadn't agreed to that trip. Also — and I said this — real actor systems still have message loops, timeouts, partial failures. You don't get to wave those away by saying "actor." So where do *those* go?

---

## Log 06: The layers start separating

That question cracked the conversation open. Once I pushed on actor-system *failures*, the AI reached for a whole other shelf: sagas, compensation, idempotency, workflow engines, Temporal. And it dumped them on me kind of flat, all at once, like they were the same category of thing.

They're not, and that annoyed me enough to say so. Idempotency is a *principle* — run it twice, same result. Compensation is an *operation* — a business undo. A saga is a *pattern* — steps with compensations wired up. A workflow engine is a *tool* — the runtime that manages retries and timeouts and resume and state. These are four different altitudes and stacking them in one breath is how people stay confused.

The AI accepted the correction and tightened it up, and it added one line that started to actually organize the mess:

> A distributed system is just many machines working together. A durable workflow is the narrower thing: one long-running business process that survives crashes and resumes.

That's the split I'd been missing. This is the same durable-execution idea I'd chewed on before in [my Hatchet notes](/blogs/getting-started-with-hatchet) — the process is tracked in a database, not held in memory, so if it dies halfway it knows where it was. The more I pushed, the less the conversation was about "actors solve concurrency" and the more it was about *which layer owns which problem*.

---

## Log 07: Part 1 vs Part 2

And then the thing clicked, and it clicked as a split.

The actor gives you Part 1:

- one owner
- ordered state transitions
- a single safe place where mutation happens

The actor does *not* give you Part 2:

- does the latest write win, or the first?
- does a cancel beat an in-flight upgrade?
- do we refund?
- what do we do with a stale async result that comes back after we've moved on?

Part 2 is business logic. Product semantics. The actor happily serializes your state changes and has *no opinion whatsoever* about which of those changes was the correct one to make. It gives you a clean, ordered place to be wrong.

And this is where my Redis bug swam back into focus, because I finally had language for what half of it even was.

---

## Log 08: The sharpest counter-question

The AI had said, correctly, that my single Redis "only sequenced commands, not the business operation." One Redis server does run commands one at a time — `GET A`, `GET B`, `SET A` — but my bug lived *across* commands: `GET → IF → SET` was three commands with gaps, and the race lived in the gaps. Making it one atomic command closed the gaps. Fine, I'd figured that part out already.

But I turned that same sentence back on the actor model, because it seemed to prove too much:

> Redis only guarantees commands run sequentially, not that a business operation runs sequentially. But doesn't the actor model *also* only sequence commands and state transitions? If an upgrade starts, sets state to `pending`, and returns — a cancel can still arrive before the upgrade is actually finished. So who sequences the whole *operation*?

And the AI agreed. Cleanly, no hedging:

> The actor serializes state transitions, not the whole workflow. That's exactly where the actor model ends and the workflow layer begins.

That was the moment the actor model stopped pretending to solve my whole problem. Upgrade a subscription: mark pending, charge the card, flip the plan, send the email. The actor can move state to `pending` and return in a millisecond — but the *operation* is nowhere near done, and a cancel landing in that window is a real thing that happens. The actor sequences state mutations *inside itself*. It does not sequence a long-running business process. Nothing about owning state makes the process atomic.

So: actor sequences state transitions. Workflow sequences long-running business processes. Two different jobs. I'd been asking one of them to do the other's work.

---

## Log 09: The disappointing, honest answer

At this point I said the quiet thing out loud: in my actual situation, Part 1 barely mattered. Whether I used a Durable Object or one Redis instance, concurrent operations still show up and I still have to decide what they *mean*. So where does the actor model actually *shine*? And — kind of provocatively — if I get the workflow and business logic right, why do I need actors at all?

And the answer was the most useful thing in the whole night, precisely because it deflated its own concept:

> For this specific Redis bug, the actor model probably gives you very little.

The real requirement was a business invariant — *if processing, reject new work* — and that's atomicity plus a rule. Redis with a single command, Lua, a Postgres transaction, a mutex, a lock, or an actor could all enforce it. The actor wasn't special here. It was one option among several for a problem that was mostly about semantics, not ownership.

Weirdly satisfying. The model finally stopped overreaching.

---

## Log 10: Where the actor model actually clicked

But "little value for *this* bug" isn't "useless," and the last turn is where it landed for real.

The actor model starts earning its keep when ownership gets *blurry*. Not when two requests race — when the same business entity gets mutated by an HTTP API, and webhooks, and a background worker, and a cron job, and an admin panel, and now some agent, all reaching into the same state from six directions and each one half-remembering the rules. That's the disease. The actor is the boundary that cures it:

> Don't let everybody touch state. Everybody asks the owner.

And that reframed my own fix. When I wrapped my Redis logic in a class so the messy `GET → IF → SET` lived in one place behind one method — that was already actor-shaped thinking. I'd centralized mutation behind an owner without knowing that had a name. The value was never "better concurrency." It was *don't trust every caller to remember every rule.* Put the rules in one place and make everyone knock on that door.

The actor model wasn't useless. I'd just spent three hours trying to use it for the wrong problem.

---

## Log 11: What this actually taught me — and it's not about actors

Here's the part I'll keep.

That AI was confident the entire night. It was also, for a good stretch, confidently answering a problem *next to* mine instead of mine. It introduced the actor model while explaining something else, the word stuck, and it kept building on it — and if I'd nodded along, I'd have walked away thinking I needed to sprinkle actors on a Redis bug that wanted a single atomic command and a business rule.

The only reason it got good is that I kept refusing:

- does this actually solve *my* issue?
- isn't this just a queue?
- why is this better than a lock?
- if both only sequence commands, who sequences the operation?
- okay, so where does this model *really* help?

Every one of those narrowed the answer. The final version was smaller than the first version and about ten times more useful. The confusion wasn't a detour I survived — the confusion was the *mechanism*. The friction is what dragged the answer down from "impressive-sounding" to "true for me."

The actor model kept feeling underwhelming, and for the longest time I thought that meant I didn't get it. I got it fine. It felt underwhelming because I was holding it up against my Redis bug, and it was never a good match for that bug. Once I stopped forcing that map, it clicked in about one sentence.

---

## The model I actually walked away with

```txt
Actor owns state.
Workflow owns process.
Database stores facts.
Business rules decide meaning.
```

Durable Objects made me ask the right question. The Redis bug made the question real. The actor model answered *ownership* — not workflow correctness, not product semantics. The workflow layer owns the process. The database holds the facts. And which fact is the *correct* one is a business rule nobody's framework decides for you.

I didn't come out of this thinking "I need actors everywhere." I came out thinking something more boring and more useful: never let an AI answer *feel* correct until you can map it back, cleanly, onto your own concrete problem. If it doesn't map, you're not done asking yet.

The rabbit hole wasn't wasted. It was the whole point.
