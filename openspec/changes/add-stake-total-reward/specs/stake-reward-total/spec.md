## ADDED Requirements

### Requirement: The lifetime total SHALL be the sum of per-epoch inflation rewards over the account's own epoch range

The total SHALL be the sum of the `getInflationReward` amounts for the stake account, across every epoch in the range. It MUST NOT be derived from the current account state.

The range SHALL start at the later of two values: the epoch the account was created in, or the first epoch that paid inflation rewards on the cluster (mainnet-beta 132, testnet 43). The range SHALL end at the earlier of two values: the previous epoch, or the account's `delegation.deactivationEpoch`.

An epoch may return no reward. This happens when the validator was delinquent, or when the RPC does not serve that epoch. Such an epoch SHALL count as zero. It MUST NOT stop the sum.

The total SHALL count inflation staking rewards only. It SHALL exclude lamports from any other source, such as MEV tip claims and plain transfers. Those stay loose in the account and never enter `delegation.stake`.

#### Scenario: Range covers the account's own epochs and stops before the current one

- **WHEN** a stake account created and activated in epoch 943 is queried during epoch 1012, with no deactivation set
- **THEN** the range SHALL be epochs 943 through 1011
- **AND** the total SHALL NOT include the current epoch

#### Scenario: Rewards are summed and a non-paying epoch counts zero

- **WHEN** the range covers four epochs, three paying 10, 20, and 30 lamports and one paying nothing
- **THEN** the total SHALL be 60 lamports

#### Scenario: Deactivated stake account

- **WHEN** the account's `delegation.deactivationEpoch` is set and is earlier than the current epoch
- **THEN** the range SHALL end at `deactivationEpoch`, not at the current epoch

#### Scenario: Account credited with MEV or transfers

- **WHEN** the stake account has received lamports from tip claims or transfers
- **THEN** the total SHALL NOT include those lamports

### Requirement: The range SHALL start at the account's creation epoch, not its activation epoch

The endpoint SHALL derive the start of the range from the epoch the stake account was created in, read from the slot of the account's oldest signature. It MUST NOT use `delegation.activationEpoch` as the start, under any condition.

Re-delegating a stake account resets `delegation.activationEpoch` to the epoch of the latest delegation. The earlier delegation's rewards are still paid to the same address and still returned by `getInflationReward`, so a range that starts at `activationEpoch` drops them. Measured on `MCrWxQJgT3VogbgM5sy78K4uCEmwPQiKeXG2Bna51zs`: 55,208,535 lamports earned, 10,482,997 reported, 81% missing. Five of 100 sampled accounts sharing an activation epoch were already earning more than 100 epochs before it.

An account cannot be paid a reward before it exists, so the creation epoch is a correct start. The cluster's first reward epoch is also correct, but a sweep that long does not fit the route's budget: measured at 188 seconds for 881 epochs, against a 40-second sweep budget.

The endpoint SHALL page `getSignaturesForAddress` backwards until a page arrives shorter than the page limit, which is the end of the account's history. A full page MUST NOT end the walk, because older signatures may sit behind it.

When the account still cannot be dated — more pages than the walk will follow, or no signatures at all — the endpoint SHALL return an error. It MUST NOT substitute `delegation.activationEpoch` or any other epoch. Every substitute is a start later than the truth, which yields a total short by an unknown amount that cannot be told apart from a correct one. This is the same failure the sweep's own error policy prevents, and it would strike exactly the accounts with the longest histories.

#### Scenario: Re-delegated account is swept from creation

- **WHEN** an account reports `activationEpoch` 1005 but its oldest signature falls in epoch 844
- **THEN** the range SHALL start at epoch 844

#### Scenario: Signature page comes back full

- **WHEN** a page of signatures returns the maximum number of entries
- **THEN** the endpoint SHALL request the next page back
- **AND** SHALL NOT treat the oldest entry of that page as the account's first

#### Scenario: Account has more history than the walk will follow

- **WHEN** the walk reaches its page limit with every page still full
- **THEN** the endpoint SHALL return an error
- **AND** SHALL NOT return a total
- **AND** SHALL NOT sweep any epoch

#### Scenario: Older account delegated this epoch

- **WHEN** an account was created in an earlier epoch but `activationEpoch` is the current epoch
- **THEN** the endpoint SHALL still sweep from the creation epoch
- **AND** SHALL NOT report zero on the strength of `activationEpoch` alone

#### Scenario: Signature lookup fails

- **WHEN** the request for the account's signatures fails
- **THEN** the endpoint SHALL return an error
- **AND** SHALL NOT sweep a range bounded by `delegation.activationEpoch`

### Requirement: Only settled epochs SHALL be cached permanently

The last epoch in the range MAY still be unsettled, so its response SHALL NOT be stored in a permanent cache entry. Every earlier epoch SHALL be cached with no expiry.

Rewards for epoch N become effective inside epoch N+1, not at the boundary. Measured across 67 consecutive epochs, they landed 2 to 297 slots after the boundary, and never before it. So the last epoch in the range can return no reward simply because it has not settled yet. Storing that as a permanent zero would keep the total short for as long as the entry survives, which is across deployments.

Every epoch before the last one settled at least a full epoch earlier. Those are safe to cache with no expiry.

#### Scenario: Newest epoch has not settled

- **WHEN** the last epoch in the range returns no reward because it has not settled
- **THEN** that response SHALL NOT be stored in a permanent cache entry
- **AND** a later request SHALL fetch that epoch again

#### Scenario: Older epochs are cached

- **WHEN** an epoch other than the last in the range is fetched
- **THEN** its response SHALL be cached with no expiry

### Requirement: The endpoint SHALL say why an address has no total

The endpoint SHALL tell apart the reasons an address cannot produce a total, and MUST NOT report them all the same way. Each reason points the caller at a different fix, and collapsing them hides which one applies.

An address that does not exist SHALL return `404`. An address that exists but is not a stake account SHALL return `400`. A stake account that has never been delegated SHALL return `400` with a message distinct from the previous case.

None of these SHALL report a total of zero. A never-delegated account has no activation epoch, so there is no range to sum, and zero would be a claim about the account rather than about the request. None of these responses SHALL be cached: an account can be created or delegated at any time, and a cached answer would outlive the fact.

#### Scenario: Account does not exist

- **WHEN** the address has no account
- **THEN** the endpoint SHALL respond `404`
- **AND** SHALL NOT sweep any epoch

#### Scenario: Address is not a stake account

- **WHEN** the account exists but is not a parsable stake account
- **THEN** the endpoint SHALL respond `400`

#### Scenario: Stake account has never been delegated

- **WHEN** the account is a stake account with no delegation
- **THEN** the endpoint SHALL respond `400` with a message distinct from a missing or non-stake account
- **AND** SHALL NOT report a total of zero

#### Scenario: None of these are cached

- **WHEN** the endpoint rejects an address for any of the reasons above
- **THEN** the response SHALL NOT carry cache headers

### Requirement: A failed sweep SHALL return an error, never a partial total

The endpoint SHALL fail the whole request when any epoch in the range cannot be fetched. It MUST NOT return a total computed from only the epochs that succeeded.

A partial total cannot be told apart from a correct one, so returning one would present a wrong figure as if it were right.

An epoch that returns no reward is not a failure. It counts as zero, as described above. A failure is an RPC error that remains after the configured retries.

The error response SHALL NOT be cached, so a passing failure cannot be held for the length of the success cache window.

#### Scenario: An epoch fails after retries

- **WHEN** an epoch's request still fails after the configured retries
- **THEN** the endpoint SHALL respond with an error
- **AND** the response SHALL NOT carry a total
- **AND** the response SHALL NOT be cached

#### Scenario: No reward is not a failure

- **WHEN** an epoch returns a successful response that carries no reward
- **THEN** it SHALL count as zero and the sweep SHALL continue

#### Scenario: Retry after a failure

- **WHEN** a request is retried after a failed sweep
- **THEN** the epochs that already succeeded SHALL be served from the cache
- **AND** only the failed epochs SHALL be fetched again

### Requirement: Successful responses SHALL be cached at the CDN for four hours

A successful response SHALL carry the shared cache headers used by the other route handlers: `max-age` and `s-maxage` of 14400 seconds, with `stale-while-revalidate` of 3600.

This sits on top of the per-epoch cache. Without it, every request repeats the whole sweep as cache reads even when no epoch has changed.

An epoch lasts about 50 hours, so a four-hour entry means the total can lag a new epoch by up to four hours. That is accepted: the figure is a lifetime total, and being one epoch behind for part of a day does not mislead.

#### Scenario: Repeat request inside the cache window

- **WHEN** a second request for the same address and cluster arrives inside the four-hour window
- **THEN** it SHALL be served from the CDN
- **AND** the sweep SHALL NOT run again

### Requirement: The card SHALL show the total with separate loading, value, and error states

The Stake Delegation card SHALL always render the total reward row, and the row SHALL show its own state rather than putting the whole card into a loading or error state.

While the total is being fetched, the row SHALL show a loading placeholder. When it resolves, the row SHALL show the amount in SOL. When it fails, the row SHALL show a short message in place of the amount.

The failure message SHALL be visually quiet. It SHALL NOT use the styling reserved for destructive or blocking errors, because a missing total does not stop the rest of the card being useful. The row SHALL NOT show `0` when the total is unavailable, because zero is a claim about the account rather than a claim about the request.

A failure to load the total SHALL NOT affect the other rows in the card.

#### Scenario: Total is loading

- **WHEN** the total has been requested and has not resolved
- **THEN** the row SHALL show a loading placeholder
- **AND** the other rows in the card SHALL render normally

#### Scenario: Total resolves

- **WHEN** the total resolves
- **THEN** the row SHALL show the amount in SOL

#### Scenario: Total fails to load

- **WHEN** the request for the total fails
- **THEN** the row SHALL show a short, quiet message instead of the amount
- **AND** the row SHALL NOT show `0`
- **AND** the other rows in the card SHALL render normally
