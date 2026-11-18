## ADDED Requirements

### Requirement: Feature-gate JSON SHALL be governed by a single runtime schema

The on-disk `app/entities/feature-gate/feature-gates.json` file SHALL be validated at runtime by `FeatureGatesArraySchema` (defined in `app/entities/feature-gate/lib/feature-gates-schema.ts`). The same schema MUST be the write contract for `scripts/update-feature-gates.ts` and the read contract for every UI consumer (the standalone Feature Gates page, the account section, the OG image route, the address layout, the feature-gate search provider).

The schema SHALL validate `key` as a base58-encoded Solana address (not merely a string) and brand it to `@solana/kit`'s `Address` type on the read side, so a malformed key cannot reach a consumer that derives links or on-chain reads from it. Producers that assemble rows from untrusted sources (the wiki) SHALL use the plain-string `FeatureGateDraft` type; the schema brands `key` at the `create()` write boundary in `feature-store.ts`.

A test that loads the committed JSON through the schema SHALL exist and run in CI, so that a drift between cron-generated output and UI expectations fails the build rather than surfacing as a runtime render error.

#### Scenario: Cron writes a JSON record missing a required field

- **WHEN** `scripts/update-feature-gates.ts` produces a record without a field the schema marks non-optional
- **THEN** `pnpm test` fails on `feature-gates-schema.spec.ts` before the cron-generated PR can be merged

#### Scenario: Cron writes a record whose key is not a valid base58 address

- **WHEN** `scripts/update-feature-gates.ts` produces a record whose `key` is not a base58-encoded Solana address (e.g. a stray wiki heading parsed into the key column)
- **THEN** `create()` in `writeFeatureGates` rejects it at cron time, and `feature-gates-schema.spec.ts` fails in CI for any such row that reaches the committed JSON — rather than the address being trusted by a UI consumer

#### Scenario: UI imports the typed schema, not a hand-rolled shape

- **WHEN** a new UI consumer needs the feature-gate shape
- **THEN** it SHALL import `FeatureGate` from `@/app/entities/feature-gate` and SHALL NOT redeclare the shape locally

### Requirement: Feature-gate domain data SHALL live under `app/entities/feature-gate/`

Feature-gate JSON, its schema, its entity-level accessors (`getFeatureInfo`, `useFeatureInfo`), and any server-only helpers SHALL live under `app/entities/feature-gate/`. The legacy location `app/utils/feature-gate/` SHALL NOT be reintroduced.

Server-only consumers SHALL import from `app/entities/feature-gate/server.ts`; React consumers SHALL import from `app/entities/feature-gate/index.ts` (or `model/use-feature-info.ts` for the hook).

#### Scenario: New consumer needs feature-gate data

- **WHEN** a new feature or component needs to read feature-gate records
- **THEN** it SHALL import from `@/app/entities/feature-gate` (or `…/server` when used outside the React tree)

#### Scenario: PR reintroduces `app/utils/feature-gate/`

- **WHEN** a PR recreates files under `app/utils/feature-gate/` instead of extending the entity
- **THEN** reviewers SHALL request the code be moved into `app/entities/feature-gate/`

### Requirement: The feature-gate updater SHALL apply a field-specific refresh policy to existing rows

The updater pipeline SHALL preserve already-persisted rows by default and SHALL only mutate fields whose stage explicitly opts in. The per-field policy is:

- Wiki-sourced metadata fields (`title`, `simds`, `min_agave_versions`, `min_fd_versions`, `min_jito_versions`, `owners`, `comms_required`, `planned_testnet_order`) SHALL be set only on first import of a previously-unseen `key`, and SHALL NOT be overwritten on subsequent runs.
- `simd_link` SHALL be set on first import alongside the other wiki fields. On every subsequent run the updater SHALL back-fill empty slots (entries equal to `''`, or array length shorter than `simds.length`) by re-resolving them against the current SIMD proposals listing. Non-empty entries SHALL NOT be overwritten. This is the recovery path for first-import runs that hit a transient GitHub rate-limit on the proposals listing fetch.
- `devnet_activation_epoch` and `testnet_activation_epoch` SHALL be re-derived from on-chain account reads on every run, but only while `mainnet_activation_epoch` is `null`. Once mainnet activation is recorded, both fields SHALL freeze.
- `mainnet_activation_epoch` SHALL be re-derived from on-chain account reads only when `devnet_activation_epoch` and `testnet_activation_epoch` are both set and `mainnet_activation_epoch` is still `null`. Once mainnet activation is recorded, the field SHALL freeze.
- `description` SHALL be back-filled from the linked SIMD markdown only when the persisted value is empty. A non-empty description SHALL NOT be re-fetched on subsequent runs.

The trade-off accepted by this policy is that historical errors on fully-activated features are not auto-healed by the daily cron — correcting them requires a manual rebuild via the `--refresh-activated` opt-in flag (see "manual rebuild" requirement below) rather than a permanent change to the refresh predicates.

#### Scenario: Feature already activated on mainnet

- **WHEN** the updater runs against a feature whose `mainnet_activation_epoch` is set
- **THEN** none of the three activation-epoch fields SHALL be re-read on-chain
- **AND** the wiki and SIMD-description fetches SHALL NOT modify the row

#### Scenario: Feature still pending mainnet

- **WHEN** the updater runs against a feature whose `mainnet_activation_epoch` is `null`
- **THEN** `devnet_activation_epoch` and `testnet_activation_epoch` SHALL be re-derived on-chain on each run
- **AND** if both are set and mainnet is still `null`, the mainnet pass SHALL also attempt an on-chain read

#### Scenario: Wiki metadata changes on a feature already in the JSON

- **WHEN** the Agave wiki updates the `title`, `SIMD`, version-floor, or owner columns of a feature whose `key` is already persisted
- **THEN** the updater SHALL leave the persisted fields unchanged
- **AND** propagating the updated metadata SHALL require either a manual edit or a follow-up change to the merge logic

#### Scenario: First-import run hit a transient GitHub rate-limit and stored `simd_link: ['']`

- **WHEN** a previously-persisted feature has `simds: ['337']` and `simd_link: ['']` because the SIMD proposals listing fetch failed (rate-limit, network error, or any non-2xx response) at first-import time
- **AND** the next run successfully fetches the SIMD proposals listing
- **THEN** the updater SHALL back-fill the empty `simd_link` slot with the resolved GitHub URL
- **AND** SHALL leave any non-empty `simd_link` entries on the same row untouched

#### Scenario: Description back-fill is write-once

- **WHEN** a feature already has a non-empty `description`
- **THEN** the updater SHALL NOT re-fetch the SIMD markdown for that feature on subsequent runs

### Requirement: The feature-gate updater SHALL support a manual `--refresh-activated` rebuild mode

`scripts/update-feature-gates.ts` SHALL accept a `--refresh-activated` CLI flag that switches the activation-epoch refresh from the default field-specific policy to a full re-read of every feature on every cluster. The flag is intended for manual rebuilds only — the daily GitHub Actions workflow SHALL invoke the script without it.

In `--refresh-activated` mode the eligibility predicates `stillPending` and `liveButNotOnMainnet` SHALL be replaced with "every feature is eligible" for all three cluster passes. The script SHALL trust the freshly-derived chain state over the persisted value: when the probe returns `missing` (RPC confirmed the account does not exist) or `unactivated` (account exists but the activated flag is clear), the corresponding field SHALL be set to `null`. When the probe returns `unreachable` (RPC retries exhausted), the existing value SHALL be preserved regardless of mode — a transient blip must not wipe known-good data.

The CI workflow file SHALL invoke the script with no flags so the default mode applies, and SHALL NOT introduce the `--refresh-activated` flag into automated runs.

#### Scenario: Default cron run with a feature whose account has disappeared from chain

- **WHEN** the script runs without `--refresh-activated` and the on-chain account for a feature returns `value: null` from `getAccountInfo`
- **THEN** the existing `*_activation_epoch` value for that feature SHALL be preserved
- **AND** no row in the JSON is mutated solely because the account is currently missing on one cluster

#### Scenario: Manual `--refresh-activated` run with a feature whose account has disappeared from chain

- **WHEN** the script runs with `--refresh-activated` and the on-chain account returns `value: null` from `getAccountInfo`
- **THEN** the `*_activation_epoch` field for that cluster SHALL be written as `null`
- **AND** stale activation epochs for accounts no longer present on chain SHALL be corrected on this run

#### Scenario: Either mode under transient RPC failure

- **WHEN** the RPC call itself fails (network error, retries exhausted on rate-limit) for a feature
- **THEN** the persisted `*_activation_epoch` value for that feature SHALL be preserved unchanged
- **AND** the behaviour SHALL be the same in default and `--refresh-activated` modes

#### Scenario: CI workflow stays in default mode

- **WHEN** `.github/workflows/update-feature-gates.yml` runs the script
- **THEN** the invocation SHALL be `pnpm exec tsx scripts/update-feature-gates.ts` with no flags
- **AND** the automated cron PR SHALL NOT clear historical activation epochs as a side effect

### Requirement: The feature-gate JSON file SHALL be written with pure-ASCII encoding

`scripts/feature-gates/lib/feature-store.ts#writeFeatureGates` SHALL serialise the validated record list as 2-space-indented JSON and SHALL escape every codepoint at or above `U+0080` as a `\uXXXX` sequence before writing to disk, matching the byte-level form of the prior Python writer (`json.dumps(..., ensure_ascii=True)`).

This is a write-side guarantee: the on-disk file contains only bytes in the range `0x00`–`0x7F` (ASCII). Readers SHALL parse the file with `JSON.parse`, which natively decodes `\uXXXX` escapes back to the original codepoints.

The purpose is to keep cron-generated PR diffs limited to real content changes rather than encoding flips between writers.

#### Scenario: Description contains a non-ASCII codepoint

- **WHEN** a feature description contains `…` (U+2026), `—` (U+2014), or any other non-ASCII codepoint
- **THEN** the on-disk JSON SHALL store it as `…`, `—`, etc., not as the raw UTF-8 bytes

#### Scenario: Two consecutive runs against unchanged upstream data

- **WHEN** the updater runs twice in a row with no upstream changes
- **THEN** the second run SHALL produce no `git diff` against the file written by the first run

### Requirement: The feature-gate cron updater SHALL run as a single TypeScript pipeline

The daily feature-gate refresh SHALL be implemented as one TypeScript entry point (`scripts/update-feature-gates.ts`) that reads the JSON once, runs wiki ingestion + per-cluster epoch refreshes + SIMD description back-fill as a sequenced pipeline of pure `FeatureGateDraft[] → FeatureGateDraft[]` stages (branded to the validated `FeatureGate` type at the `create()` write boundary), and writes the JSON once.

The pipeline MUST NOT depend on a Python runtime. The pipeline's stage helpers SHALL live under `scripts/feature-gates/lib/` and SHALL be unit-testable against frozen fixtures (wiki markdown, SIMD proposals JSON, SIMD summary markdown) so parser changes can be validated offline.

#### Scenario: GitHub Actions runs the daily refresh

- **WHEN** `.github/workflows/update-feature-gates.yml` executes
- **THEN** it SHALL invoke `pnpm exec tsx scripts/update-feature-gates.ts` and SHALL NOT install or invoke Python

#### Scenario: Wiki parser is changed

- **WHEN** a contributor modifies `scripts/feature-gates/lib/wiki.ts`
- **THEN** `scripts/feature-gates/lib/__tests__/wiki.spec.ts` SHALL exercise the change against the committed `agave-wiki.md` / `real-agave-wiki.md` fixtures without making a network call
