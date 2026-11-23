## ADDED Requirements

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

v1 carries its compute unit limit, heap size, loaded accounts data size limit and total priority fee in a message-level config rather than in Compute Budget instructions. The RPC's `jsonParsed` encoding does not surface that config, so it SHALL be recovered by decoding the `base64` wire bytes with kit's compiled-message decoder. Those bytes are the ones the raw transaction fetch already retrieves for the download action and the inspector, so reading the config SHALL NOT cost an additional request.

The priority fee SHALL be labelled as a total amount so it is not read as v0's per-compute-unit price in micro-lamports. The compute unit limit shown for a v1 transaction SHALL come from the config rather than from a scan of Compute Budget instructions, which v1 does not carry.

#### Scenario: v1 transaction that sets resource limits

- **WHEN** a v1 message sets any of the four limits
- **THEN** the summary card SHALL render each limit that is present
- **AND** the priority fee SHALL be presented as a total in lamports, distinct from the per-compute-unit price

#### Scenario: v1 transaction that sets no resource limits

- **WHEN** a v1 message sets none of the four limits
- **THEN** no resource limit rows SHALL be rendered

#### Scenario: Non-v1 transaction

- **WHEN** the transaction is legacy or v0
- **THEN** no config SHALL be reported and the compute unit limit SHALL continue to be derived from its Compute Budget instructions

### Requirement: Raw transaction bytes SHALL be retained verbatim, and the inspector SHALL refuse versions it cannot render

The raw transaction provider SHALL retain the message bytes exactly as served by the RPC, and the download action SHALL write those bytes rather than re-serializing a parsed message. This keeps the download byte-identical to the transaction on chain for every version.

The web3.js `VersionedMessage` and decompiled `TransactionMessage` views SHALL be populated for legacy and v0 only. The inspector SHALL report that a version is unsupported rather than render a substitute message shape, because a substitute would serialize to bytes that differ from the transaction on chain.

#### Scenario: Downloading a v1 transaction

- **WHEN** a user downloads a v1 transaction from the summary card
- **THEN** the written bytes SHALL equal the message bytes the RPC served

#### Scenario: Inspecting a v1 transaction

- **WHEN** a user opens the inspector for a v1 transaction
- **THEN** the inspector SHALL state that it does not yet support that version, rather than render accounts and instructions from a substituted message
