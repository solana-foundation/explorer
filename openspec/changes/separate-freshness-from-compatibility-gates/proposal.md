# Proposal: Separate the freshness gate from the compatibility gate

## Context

Two gates stand between a published release and `master`, and they were being asked to do each other's job.

**Freshness is a supply-chain control.** `pnpm-workspace.yaml` holds most of it — `ignoreScripts` removes install-time execution, `registries.default` pins resolution to public npm, and `minimumReleaseAge` refuses anything published in the last 14 days — with `pnpm audit:ci` as its own CI job. `.github/dependabot.yml` mirrors the age window via `cooldown`, so the bot does not propose what the resolver would refuse.

**Compatibility asks a different question: does this version still work here.** `frozenLockfile`, exact pins and the catalogs make resolution deterministic, but none of that evaluates a breaking change. Review, typecheck and tests do.

The trigger was a grouped `github-actions` update that proposed four major bumps in one pull request. Every one was between 19 and 57 days old — well clear of the window — and one still had to be held back by hand.

## Why

**Freshness is a function of elapsed time. Compatibility is not.**

The age gate models compromise of the supply chain — a hijacked maintainer token, a typosquat, a malicious dependency swapped in upstream. Time is the right mitigation because detection and yanking take days, so waiting buys real information. It pairs with `ignoreScripts`, which already removes the install-time execution path: what the window actually buys is detection time against malicious code that runs at _runtime_, which nothing else in the stack catches.

A breaking release has no such property. It is as breaking after a month as on the day it shipped, so waiting produces no new signal and no cooldown value gates it. Review does — and review needs the major to arrive in a pull request of its own. The `npm` entry already worked this way, its group scoped to minor and patch so majors fall out and get individual PRs. The `github-actions` entry grouped everything, which is why four majors arrived together.

The corollary is that the two gates must not be traded against each other. A major that is unsafe to adopt is held where it is declared, not by widening the age window — which could not have stopped it anyway.

### Alternatives considered

**A longer cooldown for majors (`semver-major-days`)** — rejected. Cooldown measures the candidate's publish date, and when the newest version is filtered it falls back to the next eligible one. A longer major window therefore selects an _older_ major rather than preventing one: it shifts which major you adopt, never whether you review it first.

**`ignore` on major update-types** — rejected as too blunt. It is a permanent opt-out: majors stop being proposed at all, and pinned action SHAs rot silently until someone notices by hand. Keeping those pins from rotting is the whole reason Dependabot watches this ecosystem. The group split keeps every major visible, one PR at a time.

**Dropping or lowering `minimumReleaseAge` workspace-wide** — rejected. It removes a supply-chain control from every dependency in order to solve a scheduling problem, and it addresses the wrong gate: the problem was unreviewed majors, not fresh releases.

## What Changes

- **`.github/dependabot.yml`** — the `github-actions` group gains `update-types: [minor, patch]`, matching the `npm` group. Majors are proposed as individual pull requests.
- Ships alongside a chore: `minimumReleaseAgeExclude` is removed from `pnpm-workspace.yaml` entirely, so every dependency sits behind the same window. Both carve-outs had expired, so nothing re-resolves. This discharges the follow-up recorded in `adopt-kit-7-transaction-introspection`.

## Impact

- **Config lands before it applies.** Dependabot reads `.github/dependabot.yml` from the default branch, so the group split takes effect only after merge.
- **The open grouped PR is recreated.** Changing a group's membership makes Dependabot rebuild the grouped pull request rather than update it.
- **More PRs, by design.** The `github-actions` entry sets no `open-pull-requests-limit`, so it inherits the default of five. A week with several majors will consume that budget where it previously produced one PR. Accepted: the alternative is majors that are never individually reviewed.
- **Unverified, and worth confirming once:** whether Dependabot honours `cooldown` for the `github-actions` ecosystem at all. Cooldown is implemented per-ecosystem inside each `UpdateChecker` in `dependabot-core`, and the triggering update settles nothing either way — nothing on offer was fresh enough for the gate to filter. The repository's Dependabot update logs name what a run filtered out.
