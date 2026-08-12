## ADDED Requirements

### Requirement: The total SHALL be the sum of per-epoch inflation rewards, not a figure derived from account state

The system SHALL compute a stake account's total reward as the sum of its per-epoch inflation staking rewards, and MUST NOT derive it from the current account state. Each epoch's reward is added to both the lamport balance and `delegation.stake`, and the principal at delegation time is never stored, so no arithmetic over account state can recover the figure. MEV payments and transfers are excluded.

#### Scenario: Rewards spread across several epochs

- **WHEN** an account's reward history holds rewards of 1,000, 2,500 and 0 lamports
- **THEN** the reported total SHALL be 3,500 lamports

### Requirement: The reward history SHALL be read by stake account address over the account's full history

The system SHALL query the upstream endpoint that accepts a stake account address, and MUST pass an explicit range start so the upstream one-month default window cannot be mistaken for a lifetime total. The range start is mainnet-beta genesis, because no reward can predate the cluster.

#### Scenario: Range floored at genesis

- **WHEN** the system requests a page of reward history
- **THEN** the request SHALL carry a range start of the mainnet-beta genesis timestamp

#### Scenario: History longer than one page

- **WHEN** a full page of rewards is returned
- **THEN** the system SHALL request the next page, and SHALL stop at the first page shorter than the page size

### Requirement: A total the system cannot stand behind SHALL NOT be reported

The system MUST fail the request rather than return a total that is incomplete, silently rescaled, or beyond exact arithmetic. Each of these still reads as authoritative while being wrong by an unknown amount, which is worse than showing nothing.

#### Scenario: A later page fails

- **WHEN** the first page succeeds and a subsequent page returns an upstream error
- **THEN** the request SHALL fail, and no total SHALL be returned

#### Scenario: History exceeds the paging bound

- **WHEN** paging reaches the maximum page count without a short page
- **THEN** the request SHALL fail rather than return the partial sum

#### Scenario: Upstream reports a failure inside a successful HTTP response

- **WHEN** upstream answers `200` with a body marking the request unsuccessful
- **THEN** the request SHALL fail rather than read the absent rows as the end of the history

#### Scenario: Reward not denominated in lamports

- **WHEN** a reward row reports a decimals value other than 9
- **THEN** the request SHALL fail rather than sum the amount

#### Scenario: Total beyond exact integer arithmetic

- **WHEN** the summed total exceeds the largest exactly representable integer
- **THEN** the request SHALL fail rather than return a rounded total

### Requirement: The total SHALL be served from a cached server route, mainnet only

The system SHALL expose the total at `GET /api/stake-rewards/{address}`, holding the upstream API key server-side and caching successful responses at the CDN so the work is shared across visitors. The route SHALL refuse clusters the upstream does not index rather than serve a mainnet figure for another cluster's address. Because the route is public and each cache miss spends metered upstream quota, it MUST confirm the address is a stake account before spending any.

#### Scenario: Address is not a stake account

- **WHEN** the requested address is not owned by the stake program
- **THEN** the route SHALL respond `404` without calling upstream

#### Scenario: The stake-account check cannot be completed

- **WHEN** the check itself fails
- **THEN** the route SHALL fail without calling upstream, rather than spending quota on an unverified address

#### Scenario: Successful total

- **WHEN** a client requests the total for a valid stake account address on mainnet
- **THEN** the route SHALL respond `200` with the total in lamports and a CDN cache header

#### Scenario: Non-mainnet cluster

- **WHEN** the request names a cluster other than mainnet-beta
- **THEN** the route SHALL respond `400` without calling upstream

#### Scenario: Upstream rate limit

- **WHEN** upstream reports a rate limit
- **THEN** the route SHALL pass `429` through rather than masking it as a server error

### Requirement: The feature SHALL be gated by a flag, off by default

The system SHALL render no Total Reward row and serve no total unless the feature is explicitly enabled for the deployment. The flag MUST be readable by the client, because otherwise the browser cannot tell an unprovisioned deployment from a broken one and requests a total it will never get on every stake page.

#### Scenario: Feature disabled

- **WHEN** the feature flag is not enabled
- **THEN** the card SHALL omit the Total Reward row entirely, rather than rendering it as unavailable
- **AND** the client SHALL make no request for the total

#### Scenario: Endpoint reached directly while disabled

- **WHEN** the route is requested and the feature flag is not enabled
- **THEN** the route SHALL refuse before validating the address or spending any upstream quota

### Requirement: The client SHALL retry only the failures a repeat request can resolve

The client SHALL retry a rate limit or an upstream failure, because both can answer differently on the next call. It MUST NOT retry a refusal that is settled for the address — a rejected address, a cluster the upstream does not index, a disabled deployment, or an unconfigured key — because repeating the request cannot change the answer.

#### Scenario: Route refuses the address

- **WHEN** the route answers with a client error the request cannot change
- **THEN** the client SHALL show the unavailable message without repeating the request

#### Scenario: Route reports a rate limit

- **WHEN** the route answers `429`
- **THEN** the client SHALL retry, because the limit resets

### Requirement: The card row SHALL distinguish a zero total from an unavailable one

The Stake Delegation card SHALL render the total in its own row with three states — loading, an amount, and an unavailable message — and MUST NOT render `0` when the figure could not be fetched, because zero is a claim about the account rather than about the request. The remaining rows SHALL render regardless of the total's state.

#### Scenario: Total unavailable

- **WHEN** the total cannot be fetched for any reason
- **THEN** the row SHALL show an unavailable message, and the other rows SHALL still render

#### Scenario: Total is genuinely zero

- **WHEN** the account has earned no rewards
- **THEN** the row SHALL show a zero amount rather than the unavailable message
