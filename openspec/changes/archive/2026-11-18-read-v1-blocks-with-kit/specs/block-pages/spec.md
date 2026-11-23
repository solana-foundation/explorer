# Block pages

## ADDED Requirements

### Requirement: Block pages SHALL render blocks containing v1 transactions

The fetch SHALL request transactions at the newest version Explorer renders, so a block is never rejected for holding one. Legacy and v0 SHALL decode as before.

#### Scenario: a block holding a v1 transaction

- **WHEN** a block contains a v1 transaction
- **THEN** every subpage SHALL render it rather than the fetch-failed state, reading its accounts and instructions from its own wire bytes

### Requirement: Requested compute units SHALL come from the message config for v1

v1 states its compute unit limit in the message config, so instruction scanning SHALL NOT be used to derive it. An absent limit SHALL report zero, not a default.

#### Scenario: a v1 transaction's compute unit limit

- **WHEN** requested units are reported for a v1 transaction
- **THEN** they SHALL be the config's limit, or zero if it sets none, and any ComputeBudget instruction SHALL be ignored

#### Scenario: a legacy or v0 transaction

- **WHEN** the transaction is legacy or v0
- **THEN** requested units SHALL continue to come from ComputeBudget instructions and per-program reserves
