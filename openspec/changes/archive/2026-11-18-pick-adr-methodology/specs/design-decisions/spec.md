## ADDED Requirements

### Requirement: Non-trivial design choices SHALL be captured as proposals

A PR making a non-trivial design or architectural choice SHALL include a `proposal.md` under `openspec/changes/<change-id>/`.

A non-trivial choice is one a reviewer could reasonably question with _"why this and not the obvious alternative?"_ Mechanical work (bugfixes, renames, dependency bumps, refactors without a debatable choice) is exempt. Judgement rests with the author; review confirms.

#### Scenario: PR introduces a new architectural pattern

- **WHEN** a PR adds a non-trivial design choice (new pattern, new dependency category, new module convention, etc.)
- **THEN** the PR SHALL contain `openspec/changes/<change-id>/proposal.md`

#### Scenario: PR is a bugfix or rename

- **WHEN** a PR is a straightforward bugfix, rename, dependency bump, or mechanical refactor without a debatable choice
- **THEN** no proposal is required

### Requirement: Proposals SHALL use the four canonical sections

Every `proposal.md` SHALL contain `## Context`, `## Why`, `## What Changes`, and `## Impact` headings, in that order.

The `## Why` section SHALL list the alternatives considered and the trade-off that decided the choice, so a future reader can recover the rationale without reconstructing it from code or PR discussion.

#### Scenario: Proposal omits a required section

- **WHEN** a `proposal.md` is missing one of Context, Why, What Changes, Impact
- **THEN** the proposal is incomplete and reviewers SHALL request the missing section before merge

#### Scenario: Why section omits alternatives

- **WHEN** the `## Why` section names the chosen approach without explaining the alternatives considered
- **THEN** the proposal is incomplete; the trade-off that justified the choice is not recoverable from the document

### Requirement: Spec deltas SHALL live inside the change folder until archived

A spec accompanying an in-flight change SHALL live at `openspec/changes/<change-id>/specs/<capability>/spec.md` and SHALL begin with one of `## ADDED Requirements`, `## MODIFIED Requirements`, `## REMOVED Requirements`, or `## RENAMED Requirements`.

Each `### Requirement:` SHALL include at least one `#### Scenario:` block. The flat path `openspec/specs/<capability>/spec.md` is populated only by `openspec archive` after the change lands.

#### Scenario: In-flight change ships with a spec

- **WHEN** a change is under review and includes a spec
- **THEN** the spec lives at `openspec/changes/<id>/specs/<capability>/spec.md` with a delta header
- **AND** `openspec validate <id> --type change --strict` passes

#### Scenario: Spec written to the archived location prematurely

- **WHEN** a contributor writes `openspec/specs/<capability>/spec.md` for an unarchived change
- **THEN** the change appears already-archived to OpenSpec tooling
- **AND** reviewers SHALL request the spec be moved into the change folder

### Requirement: Past decisions SHALL NOT be backfilled

Existing features SHALL NOT be retroactively documented with proposals.

New decisions get proposals from the methodology's adoption forward. A proposal MAY be authored for an existing feature opportunistically when that feature is next touched and the author has the context to write it honestly — but no contributor is on the hook for a backfill backlog.

#### Scenario: Untouched legacy module

- **WHEN** a module predates the methodology and has not been modified
- **THEN** no proposal is required and no backlog task is created

#### Scenario: Author touches a legacy module they understand

- **WHEN** a contributor modifies a legacy module and has the historical context for an original design choice
- **THEN** the contributor MAY add a `proposal.md` capturing that rationale, but is not obliged to

### Requirement: CI SHALL validate OpenSpec artifact well-formedness

CI SHALL run `openspec validate --all --strict` on every PR and SHALL fail the build when any OpenSpec artifact under `openspec/` is malformed.

The check covers well-formedness only — that proposals and spec deltas parse, contain the canonical sections / headers, and that every requirement has at least one scenario. It does NOT enforce whether a proposal _exists_ for a given non-trivial design choice; that judgement remains with the author and reviewer (covered by the requirement _Non-trivial design choices SHALL be captured as proposals_ above).

#### Scenario: PR touches no OpenSpec content and existing artifacts validate

- **WHEN** a PR modifies only files outside `openspec/`
- **AND** `openspec validate --all --strict` exits 0 against the existing tree
- **THEN** the OpenSpec CI step passes

#### Scenario: PR adds a malformed spec delta

- **WHEN** a PR introduces a `### Requirement:` whose first body line lacks `SHALL`/`MUST`, or a requirement without a `#### Scenario:`, or a spec missing the canonical `## ADDED Requirements` / `## MODIFIED Requirements` / `## REMOVED Requirements` / `## RENAMED Requirements` header
- **THEN** the OpenSpec CI step fails with a pointer at the malformed file
- **AND** the merge is blocked until the artifact is fixed

#### Scenario: PR makes a non-trivial design choice but omits a proposal

- **WHEN** a PR introduces a non-trivial design choice but no `openspec/changes/<id>/proposal.md`
- **THEN** the OpenSpec CI step passes — absence is a judgement question for human review, not a build failure
