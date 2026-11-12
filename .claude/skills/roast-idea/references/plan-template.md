# Plan template

A plan to *find out*, not a plan to build everything. It is ordered by risk: the thing most likely to kill the idea gets tested first, with the least work. If the plan's first milestone is "set up the repo", it's wrong.

---

## `<Name>`, implementation plan

**Goal of this plan.** One sentence on what will be true when it's done. Usually a decision rather than a shipped product: "we'll know whether X will pay for Y."

**Riskiest assumption first.** Restate the one from `roast.md`. Everything below is sequenced against it.

### Milestone 0: kill-or-continue test

The cheapest thing that could invalidate the idea. Days, not weeks. Often not code at all: five conversations, a landing page, a manual dry run of the service by hand.

- What you do
- What result means continue, what result means stop, decided *before* running it
- Timebox

Do not proceed past this milestone in the plan document without stating the continue condition. A plan whose first step can't fail isn't testing anything.

### Milestone 1: thinnest usable thing

The smallest artifact a real user can get value from once. Name the one user it's for.

- Scope: the three to five things it does
- **Explicitly not in scope**: the tempting things deliberately deferred, with a word on why
- The hard part, and the shortcut taken instead of solving it properly (manual step, hardcoded data, single tenant, human in the loop)
- Done when: a specific user does a specific thing

### Milestone 2: first real usage

Getting it in front of users who aren't the author, and instrumenting enough to know whether it worked.

- Who, how they're reached, how many
- What signal you watch, and what number would count as working
- The support and ops burden this creates, and who absorbs it

### Milestone 3 and beyond, only if the earlier ones pass

Sketch, don't specify. Whichever of scaling, hardening, the deferred hard part, or the second segment the earlier evidence points to. Detailed planning here is wasted until Milestone 2 reports back.

---

## Technical shape

Only what constrains the milestones above.

- Stack, and the one reason for each non-obvious choice
- External dependencies, with what happens if one changes its pricing or terms
- The data you need on day one and where it comes from, often the real bottleneck
- The one thing that would be expensive to change later, and the decision on it now

## Cost and effort

Rough honest numbers: build time per milestone, monthly running cost at Milestone 2 scale, and the per-user marginal cost if it's non-trivial (inference, storage, per-seat licenses, hardware).

## Open questions

Carried over from `roast.md`: the `UNANSWERED` items, each attached to the milestone that will answer it, or marked as needing someone outside this conversation.

## Stop conditions

What would make abandoning this the right call, decided now while it's cheap to be honest: a signal you didn't see, a cost that didn't come down, a date that passed. Written down in advance so sunk cost doesn't get to vote later.
