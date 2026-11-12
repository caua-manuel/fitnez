# roast-me

A Claude Code skill that interrogates a raw idea instead of encouraging it.

The premise: every question the roast asks is one you will get asked later by someone
whose money or time is on the line. Better to hear it here.

## What it does

You drop an idea. The skill runs it through three adversarial rounds, each with a
different persona, then writes a verdict and, if anything survived, a pitch or an
implementation plan.

- **Phase 0, capture.** Forces the idea into one sentence: *for [who], [what], instead of
  [current alternative]*. Creates `ideas/<slug>/idea.md` with the one-liner, your raw
  description verbatim, and the date.
- **Phase 1, recon.** Quietly finds who already does this and whether there's evidence the
  problem is real, then folds the strongest competitor into the first round of questions.
- **Phase 2, three rounds.** Round 1 is the target user who doesn't care and already gets
  by. Round 2 is a numerate investor who has seen this before. Round 3 is the engineer who
  has to ship it and the operator who has to run it. Max four questions per round.
- **Phase 3, verdict.** Writes `ideas/<slug>/roast.md`: kill shots, what survived,
  everything you hand-waved, the single riskiest assumption plus the cheapest test for it,
  and a plain `BUILD` / `RESHAPE` / `PARK`.
- **Phase 4, deliverable.** A one-page pitch, a risk-ordered implementation plan, or both,
  built only from what survived.

Ground rules the skill holds itself to: no flattery, no compliment sandwiches, attacks on
the idea and never the person, every attack specific and falsifiable, vague answers marked
`UNANSWERED` rather than quietly filled in with optimism.

## Usage

From this directory, in Claude Code:

```
/roast-me
```

Or just say "roast this idea", "poke holes in this", or "would you invest in this" and
describe the idea. The skill triggers on its own.

Answer the questions honestly. A roast you win by being vague produces a pitch that fails
on contact with a real audience, which defeats the point.

## Layout

```
.claude/skills/roast-me/
  SKILL.md                      the roast itself: rules, personas, phases
  references/
    attack-lines.md             question bank + named failure modes
    pitch-template.md           one-page pitch structure
    plan-template.md            risk-ordered plan structure
ideas/
  <slug>/
    idea.md                     one-liner + raw description + date
    roast.md                    kill shots, survivors, verdict
    pitch.md                    optional deliverable
    plan.md                     optional deliverable
```

`references/attack-lines.md` carries the named failure modes the roast checks against:
*vitamin not painkiller*, *feature not a company*, *founder is the only user*,
*distribution unsolved*, *economics inverted*, and a dozen more. It's a bank to draw from,
not a checklist to run.
