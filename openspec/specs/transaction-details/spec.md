# transaction-details Specification

## Purpose
The Explorer fetches and decodes transaction details with kit, including v1 transactions.
## Requirements
### Requirement: Transaction details SHALL be fetched with kit at transaction version 1

The transaction detail page SHALL request `getTransaction` through `@solana/kit` with `maxSupportedTransactionVersion: 1`, and SHALL NOT use web3.js `Connection` for that fetch. web3.js validates the response version against a `'legacy' | 0` superstruct union, so it throws on a v1 response rather than rendering it, and its `VersionedMessage` cannot represent a v1 message at all.

The kit response SHALL be adapted into the web3.js-shaped `ParsedTransactionWithMeta` the page's components already consume, with the version widened to `'legacy' | 0 | 1`. Numeric fields the RPC serves as `bigint` — slot, block time, fee, balances, compute units consumed — SHALL be narrowed to `number`, and `costUnits` SHALL be preserved even though kit does not declare it.

#### Scenario: v1 transaction on a cluster that has them

- **WHEN** the detail page loads a transaction whose version is 1
- **THEN** the page SHALL render it fully rather than erroring or reporting it as not found

#### Scenario: Legacy and v0 transactions

- **WHEN** the detail page loads a legacy or v0 transaction
- **THEN** it SHALL render exactly as before, including the fee, transaction cost, compute units, and token balance rows

#### Scenario: Cluster that predates v1

- **WHEN** the RPC node holds no v1 transactions
- **THEN** requesting a ceiling of 1 SHALL be inert, because the node compares that ceiling only against the versions it actually holds

### Requirement: v1 resource limits SHALL be decoded from the wire bytes and rendered distinctly

v1 carries its compute unit limit, heap size, loaded accounts data size limit and total priority fee in a message-level config rather than in Compute Budget instructions. The RPC's `jsonParsed` encoding does not surface that config, so it SHALL be recovered by decoding the `base64` wire bytes. That decoding SHALL use kit's `decodeTransactionFromRpcResponse` rather than a decoder maintained in this repository.

The config SHALL be read from `decompileTransactionMessage`, and the type describing it SHALL be derived from kit's `TransactionMessage` rather than hand-declared, so it tracks kit's definition.

The priority fee SHALL be labelled as a total amount so it is not read as v0's per-compute-unit price in micro-lamports. The compute unit limit shown for a v1 transaction SHALL come from the config rather than from a scan of Compute Budget instructions, which v1 does not carry.

#### Scenario: v1 transaction that sets resource limits

- **WHEN** a v1 message sets any of the four limits
- **THEN** the summary card SHALL render each limit that is present
- **AND** the priority fee SHALL be presented as a total in lamports, distinct from the per-compute-unit price

#### Scenario: v1 transaction that sets no resource limits

- **WHEN** a v1 message sets none of the four limits
- **THEN** no resource limit rows SHALL be rendered

#### Scenario: Wire bytes that cannot be decoded

- **WHEN** decoding the config throws
- **THEN** the resource limit rows SHALL be omitted
- **AND** the rest of the detail page SHALL render

### Requirement: Raw transaction bytes SHALL be retained verbatim, and the inspector SHALL refuse versions it cannot render

The raw transaction provider SHALL retain the message bytes exactly as served by the RPC, and the download action SHALL write those bytes rather than re-serializing a parsed message. This keeps the download byte-identical to the transaction on chain for every version.

The web3.js `VersionedMessage` and decompiled `TransactionMessage` views SHALL be populated for legacy and v0 only. The inspector SHALL report that a version is unsupported rather than render a substitute message shape, because a substitute would serialize to bytes that differ from the transaction on chain.

#### Scenario: Downloading a v1 transaction

- **WHEN** a user downloads a v1 transaction from the summary card
- **THEN** the written bytes SHALL equal the message bytes the RPC served

#### Scenario: Inspecting a v1 transaction

- **WHEN** a user opens the inspector for a v1 transaction
- **THEN** the inspector SHALL state that it does not yet support that version, rather than render accounts and instructions from a substituted message

### Requirement: Transaction wire bytes SHALL be decoded through kit's introspection helpers

The transaction wire envelope SHALL be split into its message and signatures by kit's `decodeTransactionFromRpcResponse`, applied directly to the `getTransaction` response. The repository SHALL NOT maintain its own wire-envelope decoder, and SHALL NOT depend on `@solana/transaction-introspection` directly, because `@solana/kit` re-exports it.

Message bytes handed to callers SHALL be copied out of the response buffer, so a caller owns the array it is given.

Signatures SHALL be rendered in signer order. A signer slot that has not been signed SHALL carry no signature, so it is not reported as one that fails to verify.

#### Scenario: Fetching a transaction for the inspector

- **WHEN** `fetchRawTransaction` decodes a `base64` response
- **THEN** the message bytes SHALL be exactly those the RPC served, so the download button is byte-exact on every version

#### Scenario: Partially signed transaction

- **WHEN** a message requires more signatures than have been supplied
- **THEN** each unsigned signer position SHALL be reported as carrying no signature

