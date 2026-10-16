# instruction-intent

## Purpose

The intent of a top-level instruction, the sRFC 39 sentence that `@codama/dynamic-instructions` builds from the
program's Program Metadata IDL, shown on the instruction cards of the transaction page and the Inspector.

## ADDED Requirements

### Requirement: Intents come only from the Program Metadata IDL

An intent SHALL be built only from the program's Program Metadata IDL, read through the shared `useProgramIdls`
request. The Anchor IDL MUST NOT be used. A Codama IDL MUST pass `validateCodamaVersion` before use.

#### Scenario: The program has no usable IDL

- **WHEN** the program has no Program Metadata IDL, has an Anchor IDL only, or has a Codama IDL without templates
- **THEN** the card MUST show the dashed Intent button and the `no-metadata` reason

#### Scenario: The IDL fetch fails

- **WHEN** the IDL request fails, also while SWR retries it
- **THEN** the card MUST show the `idl-failed` reason, not `no-metadata`

#### Scenario: The Codama major version differs

- **WHEN** the Program Metadata IDL has a Codama major version other than the supported one
- **THEN** the card MUST show the `malformed-metadata` reason

### Requirement: Untrusted metadata never breaks the page

A throw from the instruction parse, the account plan, or the intent computation SHALL be caught and MUST resolve to
the `malformed-metadata` reason, without a Retry.

#### Scenario: The parser throws on a malformed IDL

- **WHEN** `parseInstruction` throws for a top-level instruction
- **THEN** that card MUST show `malformed-metadata`, and the other cards and the page MUST keep rendering

### Requirement: Account reads start on the first open and are shared

Account reads and the intent computation SHALL start only after the first open of a card. Account reads MUST be
cached by the sorted address set, and computations by instruction content, per cluster and RPC URL.

#### Scenario: A closed card

- **WHEN** a card with an intent is not opened
- **THEN** no account is fetched and no intent is computed

#### Scenario: Two instructions read one mint

- **WHEN** two cards open whose intents both read the same mint
- **THEN** the mint MUST be fetched in one `getMultipleAccounts` call

#### Scenario: Two equal instructions

- **WHEN** two cards open with the same program, accounts, and data
- **THEN** the intent MUST be computed once

### Requirement: Retry only for the account read

The panel SHALL offer Retry only for a failed account read. A Retry MUST show the loading state until the read
settles. A card whose instruction cannot be loaded SHALL show the failed state without Retry.

#### Scenario: The account read fails

- **WHEN** the account read fails
- **THEN** the panel MUST show Retry, and a click MUST show the loading state, then the sentence on success

#### Scenario: The raw transaction fetch fails

- **WHEN** the raw transaction fetch fails
- **THEN** every top-level card MUST show the failed state without Retry

#### Scenario: The transaction does not decode

- **WHEN** the raw transaction loads but its instructions cannot be decoded
- **THEN** the card MUST show the failed state without Retry

### Requirement: A withheld sentence falls back to the intent label

When the SDK withholds the interpolated sentence, the panel SHALL show the short intent label with a note that the
rows below carry the details. When the sentence uses account data, the panel SHALL say the data is current, not
from the transaction's slot.

#### Scenario: The mint account is missing

- **WHEN** a `mintTo` intent reads a mint that no longer exists
- **THEN** the panel MUST show "Mint tokens" with the fill-in note, and the amount MUST stay unscaled

### Requirement: Only top-level cards show an intent

The Intent button and row SHALL render only on top-level instruction cards. Inner instruction cards MUST NOT show
them, also when they render inside a parent card's provider.

#### Scenario: An inner card inside a parent card

- **WHEN** an inner instruction card renders inside the top-level card's `InstructionIntentProvider`
- **THEN** the inner card MUST NOT render the Intent button
