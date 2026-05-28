# Proposal: Pick OpenSpec for tracking design decisions

## Context

- **Brownfield project.** Large codebase, established practices, partially outdated tools. Any process we adopt must coexist with what already exists, not assume a greenfield setting.
- **Open-source project.** Contributors range from core maintainers to one-off drive-by PRs. Any process we adopt is a tax on participation — methods that demand training, tooling setup, or persona orchestration are non-starters.
- **Design-decision rationale has no home.** It is scattered across the codebase, with no reference place to look up *why* something is built the way it is. When a non-obvious choice is questioned later, the answer has to be reconstructed from code and adjacent PR text, and the original reasoning is often lost.

## Why

We want a single, durable artifact for recording the rationale behind a design or architectural decision — *why we built it this way* — so future readers can answer "why is it like this?" without code archaeology.

PR descriptions and commit bodies serve review-time context, not durable rationale: they are tied to the change that happened, not to the decision that shaped it, and they are not searchable as a corpus.

Four principles drove the methodology choice:

- **Stay simple, no ceremony.** Brownfield work cannot afford a process that demands setup, role personas, or staged handoffs to produce a single rationale document.
- **One artifact per decision.** Splitting rationale across multiple sibling files (a spec, a plan, a task list) lets pieces drift apart over time. All context for one decision should live in one file.
- **Adopt selectively.** We want to write an ADR-style artifact for a specific feature without being forced to also produce a plan, a task breakdown, or a living spec. Not every decision warrants the same shape of follow-up.
- **Low contributor friction.** A contributor should be able to write a proposal after reading one existing example. No prerequisite tooling, no methodology vocabulary, no persona setup.

Candidates evaluated:

- **BMAD-METHOD — not adopted as the methodology.** Agent-orchestrated end-to-end feature delivery (PM → Architect → Dev personas). Decisions emerge from dialogue between personas rather than landing as standalone artifacts, and the ceremony is built for end-to-end build-out, not rationale capture. It also demands persona setup, prompts, and orchestration tooling that drive-by contributors will not invest in. Fails *stay simple*, *one artifact*, and *low contributor friction*. Specific patterns may be borrowed later (e.g., persona-style prompts during decision exploration), with the OpenSpec proposal remaining the canonical record.
- **Spec-Kit — not adopted.** Spec-Kit's `spec.md` is a forward-looking feature specification — user stories, functional requirements (`System MUST …`), measurable success criteria — written before implementation. Its "why" is product value (why this feature is worth building), not architectural rationale (why we built it this way). Applied to already-implemented code, it either forces post-hoc reverse-engineering of user stories and success criteria, or leaves its mandatory structure hollow. Even for greenfield work, the spec/plan/tasks template demands more vocabulary than a contributor should need to learn to record one design decision. Fails *adopt selectively* and *low contributor friction*; misaligned with our actual goal of capturing rationale on existing code.
- **OpenSpec — picked.** A change proposal is one self-contained markdown file (Context / Why / What Changes / Impact). We can use it for one decision without taking on the rest of the framework.

## What Changes

- Adopt the **OpenSpec change proposal** artifact (single `proposal.md` per decision) as the canonical place to record the rationale for a non-trivial design or architectural choice.
- When a decision is captured, `proposal.md` is the only required artifact. Other OpenSpec artifacts (`specs/<capability>/spec.md`, `tasks.md`, `design.md`) and lifecycle commands (`apply`, `verify`, `archive`) are optional — added when the change warrants them, omitted otherwise.
- Finalized proposals live under `openspec/changes/<change-id>/proposal.md`. The `openspec/` directory is the canonical home for accepted proposals.
- "Non-trivial" is judged by the author. A guideline, not a gate: if a reviewer would reasonably ask "why this and not the obvious alternative?", a proposal is warranted.
- Existing features are **not** retroactively backfilled. New decisions get proposals from now on. A proposal may be written for an existing feature when that feature is next touched, but no one is on the hook to catalog the past.
- Existing content under `docs/` is migrated into `openspec/` over time, following the same semantic; the `docs/` directory is removed once migration is complete. This proposal states the direction; it does not schedule the migration.
- The convention is documented once under `openspec/` (a top-level `openspec/README.md` or this proposal itself) and referenced from `CLAUDE.md` / contributor docs so agents and humans find it.

## Impact

- **Spec-only; no code change.** No source files, dependencies, build config, or CI are modified by this proposal.
- Affected docs: `openspec/changes/` gains accepted proposals over time. Contributor-facing docs (`CLAUDE.md` and/or a new `openspec/README.md`) get a one-paragraph pointer to the convention. The exact location of that pointer is left to the spec-author / implementer.
- No tooling, no linter, no PR template field, no CI check is added. Adherence is by convention and code review, not enforcement.
- **Brownfield handling**: no backfill obligation. The project has years of accumulated decisions; demanding retroactive documentation would either produce fabricated rationale or stall on a backlog no one closes. We start from the next decision forward; past decisions get documented opportunistically when their code is touched.
- **Accepted risk.** Proposals can drift from code as the system evolves. We accept this: a written rationale that aged into staleness is still more recoverable than a rationale that was never written down.
- **What changes for the next PR**: an author making a non-trivial design choice drafts a short `proposal.md` (Context / Why / What Changes / Impact) under `openspec/changes/<change-id>/` alongside the PR. Reviewers read it for rationale, not for spec compliance.
- **What changes a year from now**: `openspec/changes/` is the searchable record of why the codebase looks the way it does. Anyone — human or agent — can grep it before re-asking a settled question.
- **Explicit non-goals**: not mandating any artifact or lifecycle step beyond the proposal itself — anything else OpenSpec offers stays optional and is used per-change as warranted. Not promising every feature gets a proposal. Not gating PRs on proposal presence.
