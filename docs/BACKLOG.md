# Backlog

## Parked from `todo-polish.md` (Sprint 2+ — do not execute unprompted)

Sections **§3–§17** of `docs/todo-polish.md` are parked per user decision
(Nov 22): the todo was too broad; §18 (IA eye-flow + sidebar
unification) is the next sprint and ~90% of the visible value. When §18
lands and the user asks, resume in this order: §3/§4 (type + spacing) →
§6 (layout de-clunk leftovers) → §11 (radius) → §14/§17 (motion +
mini-interactions, now that reveal is installed) → §8 remainder →
§5 sweep → §10/§13/§15 (state architecture) → §16 (data layer for future
pages) → Verify pass.

Shadcn-dependent installs stay prompt-first (see the rule below).

## Mobile day switching — open design decision (prompt the user first)

The mobile sheet has no day picker, and the planned mobile brand header
was **deleted** (user decision: a brand header clutters the viewport; the
brand lockup returns later as a View Transitions *shared element* that
sweeps into the map during the skeleton/map-loading pass — §16-C — never
as a header).

Open question (needs the user before implementing): **where does day
switching live on mobile?** Likely shape: a day control inside the sheet's
home tab (near the live-session card), not a header. Until decided, day
switching stays desktop-only.

Also parked here: any polish item that needs a shadcn registry install
(`npx shadcn add …`) — registry access works (components.json exists), but
each install is a dependency + file churn decision to make explicitly.
Prompt the user before pulling more FF components beyond what's vendored.
