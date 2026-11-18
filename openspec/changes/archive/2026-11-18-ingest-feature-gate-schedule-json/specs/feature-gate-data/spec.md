## ADDED Requirements

### Requirement: Feature-gate ingestion SHALL read Anza's machine-readable schedule JSON

The updater SHALL discover pending features from `https://raw.githubusercontent.com/wiki/anza-xyz/agave/feature-gate-tracker-schedule.json` and SHALL NOT parse the rendered `Feature-Gate-Tracker-Schedule.md` wiki table. The document is a map of section name to row array; only sections whose name begins with `Pending` (case-insensitive) SHALL be imported, so an added, renamed, or reordered non-pending section cannot shift which rows are picked up.

A fetch failure (non-2xx) SHALL abort the run — the schedule is the essential data source and a partial run must not be mistaken for an up-to-date one. There SHALL NOT be a fallback to the markdown page: a silent degradation that produces rows missing `owners` is worse than a visibly skipped daily run.

#### Scenario: Schedule adds a column the explorer does not read

- **WHEN** the schedule rows gain a field that is not part of `FeatureGateSchema` (as `Min FRD Versions` did)
- **THEN** the run SHALL succeed and ignore the field
- **AND** no row in `feature-gates.json` SHALL carry the unknown field

#### Scenario: Schedule renames a field the mapper reads

- **WHEN** a field the mapper reads (`Feature ID`, `Title`, `Description`, `Devnet Epoch`, `Testnet Epoch`, `SIMDs`, `Owners`, or a `Min … Versions` array) is renamed or removed in a pending section
- **THEN** the run SHALL fail with an error naming the offending pending section
- **AND** SHALL NOT write rows with blank titles or keys

#### Scenario: A section the updater never imports changes shape

- **WHEN** rows in `Fully Activated` gain, lose, or rename fields
- **THEN** the run SHALL succeed unaffected, because only pending sections are validated against the row struct

#### Scenario: Upstream restructures the document with no pending section

- **WHEN** the fetched document contains no section whose name begins with `Pending`
- **THEN** the run SHALL fail with an error listing the section names it did find
- **AND** SHALL NOT silently import zero features

#### Scenario: Epoch cell is blank

- **WHEN** a `Devnet Epoch` or `Testnet Epoch` cell is `null`, `''`, or text that is not a number
- **THEN** the corresponding `*_activation_epoch` field SHALL be `null`, to be resolved later by the on-chain passes

#### Scenario: Row carries no SIMD reference

- **WHEN** a pending row's `SIMDs` array holds only blank entries
- **THEN** both `simds` and `simd_link` SHALL be written as empty arrays, keeping the two arrays index-aligned for readers that pair them positionally

### Requirement: Schedule-sourced rows SHALL carry owners and any upstream description on first import

New rows appended from the schedule SHALL populate `owners` from the row's `Owners` array and `description` from the row's `Description` field when upstream provides one. Both are trimmed, and blank entries in `Owners` are dropped — upstream spells "no value" as `['']`.

When upstream `Description` is absent or empty, `description` SHALL be written as `''` so that the existing SIMD-markdown back-fill stage still fills it. A non-empty upstream description SHALL suppress that fetch for the row, per the write-once description policy.

#### Scenario: Pending row lists an owner

- **WHEN** a newly-imported row has `Owners: ['bw-solana']`
- **THEN** the persisted row SHALL have `owners: ['bw-solana']` rather than the empty array the markdown parser produced

#### Scenario: Pending row carries an upstream description

- **WHEN** a newly-imported row has a non-empty `Description`
- **THEN** it SHALL be persisted as the row's `description`
- **AND** the SIMD-markdown back-fill SHALL NOT fetch a summary for that row

#### Scenario: Row already persisted before this change

- **WHEN** a row's `key` is already in `feature-gates.json` with `owners: []`
- **THEN** the updater SHALL leave it unchanged, because schedule-sourced metadata is first-import-only
- **AND** backfilling those rows SHALL require a separate one-off migration

## MODIFIED Requirements

### Requirement: The feature-gate cron updater SHALL run as a single TypeScript pipeline

The daily feature-gate refresh SHALL be implemented as one TypeScript entry point (`scripts/update-feature-gates.ts`) that reads the JSON once, runs schedule ingestion + per-cluster epoch refreshes + SIMD description back-fill as a sequenced pipeline of pure `FeatureGateDraft[] → FeatureGateDraft[]` stages (branded to the validated `FeatureGate` type at the `create()` write boundary), and writes the JSON once.

The pipeline MUST NOT depend on a Python runtime. The pipeline's stage helpers SHALL live under `scripts/feature-gates/lib/` and SHALL be unit-testable against frozen fixtures (schedule JSON, SIMD proposals JSON, SIMD summary markdown) so parser changes can be validated offline.

#### Scenario: GitHub Actions runs the daily refresh

- **WHEN** `.github/workflows/update-feature-gates.yml` executes
- **THEN** it SHALL invoke `pnpm exec tsx scripts/update-feature-gates.ts` and SHALL NOT install or invoke Python

#### Scenario: Schedule parser is changed

- **WHEN** a contributor modifies `scripts/feature-gates/lib/schedule.ts`
- **THEN** `scripts/feature-gates/lib/__tests__/schedule.spec.ts` SHALL exercise the change against the committed `agave-schedule.json` / `real-agave-schedule.json` fixtures without making a network call
