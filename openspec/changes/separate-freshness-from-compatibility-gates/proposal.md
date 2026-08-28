# Proposal: Separate the freshness gate from the compatibility gate

## Context

`minimumReleaseAge` and Dependabot `cooldown` hold every dependency for 14 days as a supply-chain control. A grouped `github-actions` update then proposed four majors in one pull request — every one well clear of that window, and one still had to be held back by hand.

## Why

The window gates compromise, not breakage: a release is as breaking after a month as on the day it shipped, so no cooldown value substitutes for proposing majors one at a time. Rejected alternatives: `semver-major-days`, which falls back to the next eligible version and so selects an _older_ major rather than preventing one; and `ignore` on major update-types, a permanent opt-out that lets pinned action SHAs rot silently.

## What Changes

- `github-actions` group scoped to `update-types: [minor, patch]`, matching `npm`. Majors are proposed individually.
- `minimumReleaseAgeExclude` removed — both carve-outs had expired, so nothing re-resolves. Discharges the follow-up recorded in `adopt-kit-7-transaction-introspection`.

## Impact

- Dependabot reads config from the default branch, so the split takes effect only after merge, and changing group membership rebuilds the grouped PR rather than updating it.
- The `github-actions` entry sets no `open-pull-requests-limit`, so majors now draw on the default of five.
- Unverified: whether Dependabot honours `cooldown` for the `github-actions` ecosystem at all.
