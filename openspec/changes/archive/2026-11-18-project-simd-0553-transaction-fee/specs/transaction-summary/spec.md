# Transaction summary

## ADDED Requirements

### Requirement: The projection SHALL be gated on an environment flag, off by default

The row SHALL render only when `NEXT_PUBLIC_SIMD_0553_FEE_ENABLED` is exactly `true`, and the flag SHALL be read at the call site so it is not frozen at import. A deployment that does not set it SHALL see the transaction page unchanged.

#### Scenario: flag unset

- **WHEN** the environment does not set the flag, or sets it to any value other than `true`
- **THEN** the summary card SHALL omit the row entirely

#### Scenario: flag enabled

- **WHEN** the environment sets the flag to `true`
- **THEN** the summary card SHALL render the row for every transaction that reports a fee and cost units

### Requirement: The summary card SHALL project the SIMD-0553 fee beside the fee paid

The transaction summary card SHALL render a "Fee under SIMD-0553" row directly below the fee row whenever the transaction reports both a fee and cost units, showing the projected total at each of the three staged resource-fee rates. The row SHALL be labelled as a not-yet-active projection, because none of the rate's feature gates are in the feature-gate registry.

#### Scenario: transaction reporting cost units

- **WHEN** the flag is enabled and a transaction's metadata carries `fee`, `costUnits` and `computeUnitsConsumed`, and its requested compute limit can be reconstructed
- **THEN** the summary card SHALL render one projected total per staged rate, each labelled with its rate

#### Scenario: transaction without cost units

- **WHEN** a transaction's metadata omits `costUnits`
- **THEN** the summary card SHALL omit the row rather than project from an estimate

### Requirement: The charge base SHALL be the requested cost, corrected off the executed cost the RPC reports

`meta.costUnits` is the cost of the transaction as executed, whose compute term is the units actually consumed. The projection SHALL charge on the requested cost instead, replacing the consumed compute units with the transaction's requested compute limit, and SHALL never project below the executed cost. Where a requested limit cannot be reconstructed, the row SHALL be omitted rather than projected from the executed cost.

#### Scenario: a loose compute budget

- **WHEN** a transfer reports 1,481 cost units and 150 consumed units while requesting 200,000
- **THEN** the charge base SHALL be 201,331 cost units, not 1,481

#### Scenario: a budget consumed exactly

- **WHEN** a transaction consumed precisely the compute units it requested
- **THEN** the charge base SHALL equal the executed cost the RPC reported

#### Scenario: no reconstructable compute request

- **WHEN** the transaction reports no consumed compute units, or no requested limit can be reconstructed
- **THEN** the summary card SHALL omit the row

### Requirement: A projected total SHALL be the inclusion fee plus the unchanged priority fee plus the burned resource fee

The projection SHALL sum a flat 2,500-lamport inclusion fee, the transaction's priority fee carried across unchanged, and a resource fee of `ceil_div(requested_cost_units × numerator, denominator)` computed over integers at each of the 1/10, 1/4 and 1/2 rates.

#### Scenario: cost units are charged at the staged rate

- **WHEN** a transaction requested 40,000 cost units and pays no priority fee
- **THEN** the projected totals SHALL be 6,500, 12,500 and 22,500 lamports at the 1/10, 1/4 and 1/2 rates

#### Scenario: a fractional resource fee rounds up

- **WHEN** the rate applied to the requested cost units does not divide evenly
- **THEN** the resource fee SHALL round up, so any requested cost is charged

### Requirement: The priority fee SHALL be read where declared and derived otherwise

The projection SHALL take the priority fee from the message where the transaction declares one, as v1 does, and otherwise derive it by subtracting 5,000 lamports per signature from the total fee, floored at zero.

#### Scenario: v1 transaction declaring a priority fee

- **WHEN** a v1 message declares a total priority fee
- **THEN** the projection SHALL use that figure rather than deriving one from the summed fee

#### Scenario: transaction paying only the base fee

- **WHEN** a single-signer transaction paid exactly 5,000 lamports
- **THEN** the derived priority fee SHALL be zero

### Requirement: Each projected total SHALL be compared against the fee paid

Each projected total SHALL carry a signed percentage against the fee the transaction actually paid, distinguishing cheaper from costlier, so a reader can tell which side of the model's redistribution the transaction falls on. The comparison SHALL be omitted when there is no fee to compare against.

#### Scenario: an accurately budgeted transaction

- **WHEN** a single-signer transfer requesting 1,000 compute units paid the flat 5,000-lamport fee
- **THEN** the terminal-rate projection SHALL be 3,666 lamports and SHALL be marked as cheaper

#### Scenario: a loose compute budget

- **WHEN** the same transfer left a default 200,000 compute unit request in place
- **THEN** the terminal-rate projection SHALL be 103,166 lamports and every staged projection SHALL be marked as costlier
