# Transaction version handling

## ADDED Requirements

### Requirement: One transaction value SHALL describe every version

A single `ParsedTransaction` union SHALL carry accounts, instructions and signatures for legacy, v0 and v1,
with `version` as its discriminant, version-only fields on their own arm, and helpers that take no version
argument.

#### Scenario: A consumer needs a transaction's accounts

- **WHEN** any consumer reads accounts or instructions from a transaction
- **THEN** it reads them off the union without narrowing on `version`

#### Scenario: A version-only field is read

- **WHEN** a consumer reads the message config or the address lookup tables
- **THEN** it calls `getTransactionConfig` or `getAddressTableLookups`, which return absent values for the
  versions that cannot carry them

#### Scenario: A transaction of unknown version arrives

- **WHEN** an RPC reports a version the union does not cover
- **THEN** construction fails with `UnsupportedTransactionVersionError` rather than producing a partial value

### Requirement: Version facts SHALL live in `@explorer/parsers/transaction`

One package subpath SHALL export the size limit, the wire envelope size, the v1 message prefix sniff, the
config reader, and the shared `TransactionVersion` union, consumed by both the app and
`@explorer/entity-inspector`. Features and components SHALL NOT compute them locally.

#### Scenario: A component needs a transaction's size limit

- **WHEN** a component renders a transaction's serialized size against its limit
- **THEN** it calls `transactionSizeLimit(transaction)` from the package
- **AND** no `version === 1` literal appears under `app/features/transaction` or `app/components/inspector`

#### Scenario: A single-signer legacy transaction is measured

- **WHEN** the limit is resolved for a legacy transaction with one required signature
- **THEN** it is 1232 bytes, not the 4096 that byte-sniffing would report

### Requirement: Malformed v1 config SHALL make parsing throw

A malformed v1 config SHALL throw `InvalidTransactionConfigError`, a `MalformedTransactionError`, in message bytes
and in a compiled message. A legacy or v0 message has no config, so `readTransactionConfig` SHALL return
`undefined` for it and SHALL NOT throw.

#### Scenario: Message bytes carry a broken config mask

- **WHEN** v1 message bytes set only one of the two priority-fee mask bits
- **THEN** `fromMessageBytes` and `fromRpcTransaction` throw `InvalidTransactionConfigError`

#### Scenario: A compiled message's config values do not match its mask

- **WHEN** a compiled v1 message lists a config value of the wrong kind for its mask
- **THEN** `readTransactionConfig` throws `InvalidTransactionConfigError`

#### Scenario: A legacy or v0 message is read for its config

- **WHEN** `readTransactionConfig` receives a legacy or v0 compiled message
- **THEN** it returns `undefined` instead of throwing

### Requirement: An absent v1 compute unit limit SHALL read as zero

Every consumer SHALL treat a v1 transaction with no declared compute unit limit as a limit of zero, because
v1 applies no per-instruction default.

#### Scenario: The same transaction is shown on the block page and the detail page

- **WHEN** a v1 transaction declares no compute unit limit
- **THEN** both pages report zero requested compute units
- **AND** the value is labelled as a fallback, not rendered as a bare total

### Requirement: MCP payloads SHALL accept v1 and stay byte-identical for earlier versions

`inspect_entity` SHALL serve v1 transactions, and its legacy and v0 payloads SHALL be unchanged by the switch
to the shared package.

#### Scenario: A v1 signature is inspected over MCP

- **WHEN** `inspect_entity` receives a v1 transaction signature
- **THEN** it returns a payload with resolved accounts and instructions
- **AND** the config fields appear additively

#### Scenario: A v0 signature is inspected before and after the switch

- **WHEN** the same v0 signature is inspected before and after the package is adopted
- **THEN** the two payloads are byte-identical
