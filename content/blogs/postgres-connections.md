---
title: "Why Postgres Runs Out of Connections - and Why More Can Make It Slower"
date: "2026-08-25"
readingTime: "14 min read"
summary: "A visual deep dive into what a Postgres connection creates, why max_connections is not a free throughput knob, how MVCC and Serializable Snapshot Isolation work, and why the safest connection is the one you hold for the shortest possible time."
tags: ["postgresql", "databases", "backend", "performance", "mvcc", "connection-pooling", "system-design"]
---

# Why Postgres Runs Out of Connections - and Why More Can Make It Slower

This is the companion post to [Why Postgres Runs Out of Connections](https://youtu.be/vLxBnGF4iLU), my 16-minute visual deep dive into the same rabbit hole.

I was reading Brandur's article on [managing Postgres connections](https://brandur.org/postgres-connections) and hit the obvious question:

**If an app runs out of connection slots, why not just increase `max_connections`?**

That fixes the error. It can also make every query slower.

The answer only clicked after I stopped treating a connection as a socket and followed what Postgres actually creates behind it: a server process, transaction state, snapshots, locks, and more work coordinating shared data.

This is my attempt to build that mental model from the smallest useful pieces. The demos are deliberately small teaching models, not production sizing formulas. Change the controls as you go; each one is there to make one relationship visible.

## The error points at a limit. The real problem is concurrency.

The failure usually looks like this:

```text
FATAL: remaining connection slots are reserved for non-replication superuser connections
```

The message says the database has reached a limit. The tempting response is to raise the limit and move on.

But a connection is not free plumbing. PostgreSQL normally gives each client connection its own backend process. That process becomes another active actor competing for the same CPU, memory, I/O, locks, buffers, and shared transaction state.

The question is not only **how many clients can enter?** It is also **how many concurrent database actors can this machine handle usefully?**

## The mental model in one table

| What looks obvious | What is actually happening |
| --- | --- |
| More connections = more capacity | More connections = more concurrent actors sharing one machine |
| A connection is just a network pipe | Postgres normally creates a backend process for it |
| Idle connections are harmless | They still hold finite slots and process resources |
| A pool makes the database faster | A pool mainly bounds concurrency and creates backpressure |
| Keep a connection for the request | Borrow it only for the smallest database-only window |

The practical rule:

**Bound database concurrency. Queue excess work. Hold each connection for the minimum viable span.**

The rest of this post is the why.

## A connection is a process with shared-state work attached

At a high level, a client connects to the PostgreSQL server, and the server starts a dedicated backend process to handle that connection. Ten client connections therefore create roughly ten database actors, not one magically larger worker.

Those backends are not independent islands. They need a coherent answer to questions such as:

- Which transactions are currently running?
- Which transaction IDs are active?
- Which row versions can this transaction see?
- Is another transaction holding a conflicting lock?
- Which data is in shared buffers, and what needs to be written to WAL?

A query may touch several pieces of that shared state while it parses, plans, takes a snapshot, checks visibility, reads or writes rows, acquires locks, and commits.

Some parallelism is useful. A database doing one thing at a time wastes available CPU and I/O. But useful parallelism has a ceiling. After that ceiling, extra backends do not create new hardware. They compete for the hardware that already exists and add coordination work around it.

Drag the connection count through the useful range and beyond it:

::demo[connection-pressure]

The numbers in this teaching model are illustrative, not a sizing formula. The shape is the point:

1. Early connections unlock useful parallel work.
2. Throughput reaches the machine's useful concurrency.
3. Extra connections add scheduling, cache pressure, locks, and shared-state coordination.
4. Latency rises while throughput flattens or falls.

That is why `max_connections` is a safety boundary, not a free performance dial.

## MVCC lets transactions overlap, but snapshots create bookkeeping

If every transaction blocked every other transaction, the database would be easy to reason about and painfully slow.

Postgres instead uses **Multi-Version Concurrency Control**. An update can create a new row version while older transactions continue seeing the version valid for their snapshot. Readers and writers get room to overlap without pretending that there is only one reality at every instant.

That flexibility still requires bookkeeping. Old versions must remain available while snapshots may need them. Active transactions must be tracked. Visibility checks happen while queries run. Dead versions eventually need vacuuming.

So MVCC improves concurrency by making the database manage more state, not by making state disappear.

## One row can have multiple valid answers

Use this small sequence under two isolation levels:

1. Transaction A reads a balance of `$100`.
2. Transaction B updates it to `$200` and commits.
3. Transaction A reads the balance again.

::demo[mvcc-visibility]

Under **Read Committed**, PostgreSQL's default isolation level, each statement gets a fresh snapshot. A's second read sees `$200`.

Under **Repeatable Read**, A keeps the transaction-level snapshot established by its first statement. Its second read still sees `$100`, even though B has committed `$200` for newer transactions.

Neither result is random. Both are deliberate answers to the question: **which committed reality is this transaction allowed to observe?**

This is the useful part of MVCC, but it is not free. More active transactions mean more snapshots, visibility decisions, transaction IDs, cleanup pressure, and coordination for the system to keep consistent.

## A valid snapshot can still produce an invalid world

Repeatable Read prevents a transaction's own view from changing underneath it. But two transactions can each make a valid decision from separate snapshots containing the same committed values and still create an invalid combined result.

That is **write skew**.

Suppose two accounts hold `$600` each, and the invariant says their combined balance must remain at least `$500`:

- Transaction A sees `$1,200` and withdraws `$600` from Account A.
- Transaction B sees the same `$1,200` and withdraws `$600` from Account B.
- They update different rows, so there is no direct write/write conflict.

Run the same sequence under both isolation modes:

::demo[write-skew]

Step through the five events instead of jumping straight to the verdict. The trail shows when each transaction establishes its snapshot, what total it reads, which row it writes, when each read/write dependency materializes, and whether that write commits or rolls back. The important difference appears at the last event: Repeatable Read lets both different-row writes commit, while Serializable detects the crossed dependencies and aborts one transaction before the invalid state can commit.

Repeatable Read can let both commits through and leave a combined balance of `$0`.

**Serializable Snapshot Isolation** tracks dangerous read/write dependencies between transactions. Here, A reads B before B writes it, and B reads A before A writes it; when the second write would complete that cycle, Postgres aborts one transaction with a serialization failure. The application retries it against the newly committed state, sees only `$600` total, and rejects the second withdrawal.

Stronger isolation buys a simpler guarantee for application code. The cost is more dependency tracking and occasional serialization failures. A retry is not an implementation detail to hide; it is part of how Serializable preserves the invariant.

## A pool is a budget and a queue

A pool does not create more database capacity. It decides how much application work may compete for that capacity at once.

Without a useful bound, a traffic burst becomes a connection burst. Every request races to become a backend. The database becomes the queue, except it is now queuing work while also paying the overhead of all those active backends.

With a bounded pool:

- a fixed number of requests borrow database connections;
- excess requests wait in a cheaper application-side queue;
- the database stays near its useful concurrency;
- latency degrades predictably instead of collapsing all at once.

That is backpressure. **The queue is not failure. It is the mechanism preventing overload from spreading into the database.**

### Pool size is local configuration with global consequences

Every application process can have its own pool. The database sees the sum.

For example:

```text
4 app replicas × 16 pool slots = 64 possible app connections
15 worker and cron connections          = 15
operator and recovery headroom          = 10
                                         ---
                                         89 possible connections
```

That is already most of a `max_connections = 100` budget. Add replicas and the arithmetic changes before anyone edits the database configuration.

The exact numbers are illustrative. The rule is not: **budget across replicas, workers, migrations, admin access, and recovery paths—not only inside one app process.**

Tools such as PgBouncer can reuse server connections more aggressively. In transaction pooling mode, a server connection can return to the pool when a transaction completes instead of staying attached to a client session. That can improve the shape of a large fleet, but session-scoped features need explicit compatibility checks.

## Keep the checkout window smaller than the request

Pool size is only half the problem. The other half is how long each request holds its slot.

The common shape is wasteful:

1. Check out a connection.
2. Parse and validate input.
3. Query the database.
4. Call an external API.
5. Format the response.
6. Finally return the connection.

The connection is reserved while the code does work that does not need Postgres. If the external API takes two seconds, the database slot waits two seconds too.

Toggle the checkout span:

::demo[checkout-window]

The safer shape is:

1. Parse and validate first.
2. Check out immediately before database work.
3. Begin the transaction.
4. Query or mutate.
5. Commit or roll back.
6. Return the connection.
7. Only then do slow external work.

This is why I now think of a connection as a **checked-out shared resource**, not a property of the whole request.

Do not hold a transaction open across a network call unless the consistency requirement genuinely demands it. You are keeping a connection, a snapshot, and possibly locks alive while waiting on a system you do not control.

## What I would measure in production

- **Active connections and pool wait time together.** A high connection count means something different when the pool is idle versus when requests are queued behind it.
- **Query latency and transaction age.** Long transactions retain snapshots and can delay cleanup.
- **Pool occupancy by process and replica.** One healthy-looking instance can hide a fleet-wide connection budget problem.
- **Serialization failures and retry duration.** Serializable is only useful if retries are bounded and observable.
- **Load under the real query mix.** The useful connection count depends on query shape, CPU, memory, I/O, locks, and downstream behavior.

Then apply the boring fixes that tend to work:

- **Use a bounded pool.** Let excess work wait before it becomes database concurrency.
- **Keep headroom.** Operators, migrations, background jobs, and recovery still need to connect during an incident.
- **Keep transactions short.** Do not make the database preserve a snapshot while your application waits on unrelated work.
- **Move external calls outside the checkout window.** Database slots should be doing database work.
- **Retry Serializable transactions as complete units.** An aborted transaction must be rerun from a clean beginning.
- **Do not copy a magic pool-size formula.** Bound, observe, load test, and tune.

## The mental model I was missing

The original error says there are no connection slots left. That makes the slot count look like the problem.

Usually it is the symptom.

The deeper problem is uncontrolled concurrency: too many application tasks are allowed to become database actors at the same time, and each actor stays around too long.

So the fix is not simply **allow more actors**.

It is:

1. Decide how much concurrency the database can use well.
2. Queue the rest.
3. Keep each checkout as short as correctness allows.

**More connections are not more database. They are more competition for the database you already have.**

The safest connection is usually the one you hold for the shortest possible time.

## Further reading

- [How to Manage Connections Efficiently in Postgres, or Any Database](https://brandur.org/postgres-connections) by Brandur Leach — the article that started this rabbit hole.
- [PostgreSQL connection settings](https://www.postgresql.org/docs/current/runtime-config-connection.html) — `max_connections` and reserved connection slots.
- [Introduction to PostgreSQL MVCC](https://www.postgresql.org/docs/current/mvcc-intro.html) — the versioning model behind concurrent reads and writes.
- [Transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html) — Read Committed, Repeatable Read, Serializable, and serialization failures.
- [Routine vacuuming](https://www.postgresql.org/docs/current/routine-vacuuming.html) — why old row versions and long-running transactions matter.
- [PgBouncer configuration](https://www.pgbouncer.org/config) — session, transaction, and statement pooling trade-offs.
