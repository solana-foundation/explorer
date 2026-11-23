## MODIFIED Requirements

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

## ADDED Requirements

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
