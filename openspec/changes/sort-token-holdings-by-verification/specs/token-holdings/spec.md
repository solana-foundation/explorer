## ADDED Requirements

### Requirement: Token holdings SHALL be ordered by verification

The Token Holdings card SHALL order deduplicated mints into two tiers: mints in Jupiter's `verified` tag list first, then every other mint. The order MUST be stable. Within a tier, mints keep the order the RPC returned them in, so the same holdings render the same way on every load. No mint is removed from the list by this ordering, and every holding stays reachable through Load More.

#### Scenario: Verified holdings lead the list

- **WHEN** an account holds verified and unverified mints
- **THEN** the card SHALL render every verified mint before any other mint

#### Scenario: Ordering is stable within a tier

- **WHEN** two mints share a tier
- **THEN** they SHALL keep their relative RPC order
- **AND** re-rendering the card without refetching SHALL NOT change their order

#### Scenario: Total count is unchanged by ordering

- **WHEN** an account holds 1117 distinct mints of which 46 are verified
- **THEN** the footer SHALL still report 1117 as the total
- **AND** all 1117 SHALL remain reachable through Load More

### Requirement: The verified token info SHALL load before the card renders rows

The card MUST load the token info of its verified mints before it renders rows, because a tier cannot be assigned to a mint before the answer arrives. The card SHALL show its existing loading state until the lookup settles, and MUST NOT render an unsorted list that reorders afterwards.

#### Scenario: Rows wait for the verified token info

- **WHEN** holdings have loaded but the verified lookup is still in flight
- **THEN** the card SHALL keep showing the loading state
- **AND** it SHALL NOT render rows that would reorder once the lookup settles

### Requirement: Token info SHALL be requested only for the unverified rows on screen

A verified row SHALL take its token info from the verified lookup. An unverified row SHALL look up its own token info, and the browser SHALL batch the lookups of one render into one request. A lookup of every holding costs one Jupiter request per `TOKEN_INFO_REQUEST_LIMIT` mints on every view, and a large account then exceeds the rate limit of `JUPITER_API_KEY`.

#### Scenario: A page of verified rows sends no request

- **WHEN** every row of a page holds a verified mint
- **THEN** the browser SHALL NOT send a token info request for that page

#### Scenario: A page with unverified rows sends one request

- **WHEN** the card renders a page with unverified rows
- **THEN** the browser SHALL send one token info request for the unverified mints of that page
- **AND** it SHALL NOT request token info for a mint that is not on screen

#### Scenario: Load More requests only the next page

- **WHEN** the user clicks Load More
- **THEN** the browser SHALL request token info only for the unverified mints of the next page
- **AND** the rows already on screen SHALL keep their token info

#### Scenario: Row renders for a mint with no metadata

- **WHEN** a row is rendered for a mint with no token info
- **THEN** it SHALL render the mint address and balance
- **AND** it SHALL omit the symbol and fall back to the placeholder logo

### Requirement: The verified token info SHALL come from one server-cached list

`POST /api/token-info/verified` SHALL answer the token info of the given mints that are in Jupiter's `verified` tag list. The server SHALL keep the list in the Next data cache, so Jupiter gets one request per cache refresh, not one per view.

#### Scenario: Repeat views reuse the cached list

- **WHEN** two visitors open token holdings within the cache window
- **THEN** the second request SHALL be answered without a Jupiter request

### Requirement: Holdings SHALL fall back to RPC order when verification is unavailable

Ordering MUST degrade rather than fail. When the verified lookup fails, or when Jupiter does not cover the active cluster, no mint is verified, so the list keeps RPC order. The card SHALL still render every holding, and a failed lookup MUST NOT produce an error state or an empty list.

An outage MUST stay distinguishable from an empty list. The route SHALL answer a failed lookup with an error status, the failure is reported, and the data cache SHALL NOT keep it, so the next request asks Jupiter again. A Jupiter answer with an entry that breaks Jupiter's documented token schema SHALL fail the lookup. The browser SHALL NOT keep a failed lookup, so the next mount of the card asks again. Every request SHALL be bounded by a timeout, because an unbounded one leaves the card on its loading state indefinitely.

#### Scenario: Upstream failure

- **WHEN** the verified lookup fails
- **THEN** the card SHALL render all holdings in RPC order
- **AND** it SHALL NOT show an error card

#### Scenario: An outage is not cached as an answer

- **WHEN** the Jupiter lookup fails
- **THEN** the route SHALL answer an error status rather than `200` with an empty list
- **AND** the failure SHALL be reported to error tracking

#### Scenario: A malformed entry fails the lookup

- **WHEN** Jupiter answers the tag list with one entry whose `isVerified` is a string
- **THEN** the route SHALL answer an error status rather than `200` without the mint
- **AND** the failure SHALL be reported to error tracking

#### Scenario: A stalled lookup gives up

- **WHEN** the verified lookup does not settle within its timeout
- **THEN** the card SHALL leave its loading state
- **AND** it SHALL render all holdings in RPC order

#### Scenario: Cluster without curated data

- **WHEN** Jupiter does not cover the active cluster
- **THEN** the card SHALL NOT send the verified lookup
- **AND** the rendered order SHALL match the RPC order

#### Scenario: A failed lookup is asked again

- **WHEN** the verified lookup failed and the card mounts again
- **THEN** the browser SHALL send the verified lookup again
