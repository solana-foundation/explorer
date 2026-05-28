# OpenSpec

This directory is the durable home for the rationale behind non-trivial design and architectural decisions in this repository. The convention itself — _why we picked OpenSpec, what's required, and what's optional_ — is captured as the first proposal under [`changes/pick-adr-methodology/proposal.md`](changes/pick-adr-methodology/proposal.md). Read it once before authoring a new proposal.

## When to write a proposal

When your PR makes a design choice a reviewer could reasonably question with _"why this and not the obvious alternative?"_, drop a `proposal.md` alongside the code. Bugfixes, renames, dependency bumps, and mechanical refactors do not need one. Author judgement, not a gate.

## Layout

```
openspec/
  config.yaml                          ← project context for AI tooling
  changes/<change-id>/
    proposal.md                        ← required
    specs/<capability>/spec.md         ← optional spec DELTA (see below)
    tasks.md                           ← optional
    design.md                          ← optional
  specs/<capability>/spec.md           ← populated only by `openspec archive`
```

`<change-id>` is a short kebab action slug, e.g. `unify-instruction-parsing`.

## `proposal.md` shape

Four sections, in order:

- **Context** — the situation that made the decision necessary
- **Why** — the rationale; list alternatives considered and the trade-off that decided it
- **What Changes** — what lands in the codebase
- **Impact** — files, contributors, docs, migrations, accepted risks

## Spec deltas (only if a spec is included)

An in-flight change's spec lives under `openspec/changes/<id>/specs/<capability>/spec.md` as a **delta**, with section headers like `## ADDED Requirements` / `## MODIFIED Requirements` / `## REMOVED Requirements` / `## RENAMED Requirements`. Each `### Requirement:` needs at least one `#### Scenario:`. The flat `openspec/specs/<capability>/spec.md` location is populated by `openspec archive` _after_ the change lands — putting a spec there prematurely makes the change look already archived.

Quirk worth knowing: the OpenSpec 1.3.1 validator reads only the first line of each requirement body, so the first line must contain `SHALL` or `MUST` — otherwise `--strict` rejects the change even when later lines carry it.

## Validate before merging

```
pnpm openspec:validate           # validates all changes + specs, strict
openspec validate <change-id> --type change --strict
openspec list
```

CI runs `pnpm openspec:validate` as part of the `Build-And-Test` job. It enforces **well-formedness only** — that proposals and spec deltas parse and follow the canonical layout. CI does NOT enforce whether a proposal _exists_ for a given change; that judgement stays with the author and reviewer.

## Brownfield handling

Existing decisions are not retroactively documented. New decisions get proposals from now on; old decisions get one only when their code is next touched and the author has the context to write it honestly. No backfill backlog.
