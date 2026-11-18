# supply-resolution

## Purpose

Chain supply for the home page: known clusters through a CDN-cached route, custom and localhost direct from the browser.

## ADDED Requirements

### Requirement: Known clusters read supply from a cached route

Supply SHALL be read through `GET /api/supply?cluster=<numeric cluster>`, cached at the CDN. The route MUST refuse `Cluster.Custom` and any unknown or malformed cluster with `400`. A custom URL is client-supplied, and the server must not be aimed at it.

#### Scenario: A resolvable cluster

- **WHEN** the route is asked for a cluster it can resolve
- **THEN** it MUST answer `200` with the supply, cached at the CDN for longer than one page load, with a stale-while-revalidate window that keeps a quiet region off the node

#### Scenario: An endpoint the server must not resolve

- **WHEN** the cluster is custom, unknown, or malformed
- **THEN** the route MUST answer `400`, and the browser MUST ask such endpoints directly instead

### Requirement: One request shape reaches the node

The route SHALL answer only the canonical query `?cluster=<digits>` and MUST refuse anything else with `400`. The CDN keys on the whole URL, so a second spelling of one request is a fresh miss, and every miss is a full ledger scan an unauthenticated caller can ask for.

#### Scenario: A query that would miss the shared cache entry

- **WHEN** a request carries an extra param, a repeated param, or a percent-encoded cluster value
- **THEN** the route MUST refuse it without asking the node

### Requirement: A local validator is asked directly

Supply for an endpoint the server cannot reach SHALL be read from the browser. This covers `Cluster.Custom` and any known cluster pointed at `localhost` or `127.0.0.1`.

#### Scenario: A known cluster pointed at a local validator

- **WHEN** the active endpoint is local
- **THEN** the browser MUST ask that endpoint directly rather than the route, which cannot reach it

### Requirement: Lamport counts survive the wire unrounded

The payload MUST carry circulating and total supply as decimal-digit strings, never JSON numbers, which round above 2^53. The client MUST validate the body, including the u64 range that a digit check alone cannot see. A mangled figure MUST fail the request rather than be reported as supply.

#### Scenario: A supply larger than a JS number can hold

- **WHEN** the route reports a supply above 2^53 lamports
- **THEN** the client MUST read back the exact figure

#### Scenario: An untrustworthy body

- **WHEN** a count is missing, is not a decimal-digit string, or does not fit in a u64
- **THEN** the client MUST treat the request as failed

### Requirement: An impossible pair of counts is refused

Every figure a node reports MUST pass through one boundary constructor, which MUST reject a count that is not an integer and a circulating figure larger than the total. Both counts can pass a per-field check while the pair is impossible: swapped, or a circulating figure against a zero total. The u64 check compares rather than parses, so a count that is absent, or a string where an integer belongs, clears it untouched.

#### Scenario: Counts that cannot both be true

- **WHEN** circulating supply exceeds total supply
- **THEN** construction MUST fail, on the route path and the direct path alike

#### Scenario: A count that is not a number at all

- **WHEN** a node answers with a count that is missing, or with a string where an integer belongs
- **THEN** construction MUST fail rather than yield a figure the card would render as a plausible supply

### Requirement: The read starts on mount

The request SHALL start on mount, alongside the genesis-hash check, and MUST NOT be gated on `ClusterStatus.Connected`.

#### Scenario: The health check has not answered yet

- **WHEN** the cluster status is still connecting
- **THEN** the supply request MUST already be in flight

### Requirement: An unsettled custom URL is asked nothing

While a custom URL awaits consent, or has not been judged yet, the client MUST NOT request supply. The fallback endpoint MUST NOT be asked in its place.

#### Scenario: A custom URL awaiting consent

- **WHEN** a custom URL from the query string has not been agreed to
- **THEN** the client MUST NOT request supply

#### Scenario: A custom URL the browser has not judged yet

- **WHEN** the hydrating render cannot yet tell whether a custom URL is approved
- **THEN** the client MUST NOT request supply, and MUST NOT ask the fallback endpoint in its place

### Requirement: A failure never reads as a zero supply

A failure MUST surface as a failed state. A retry MUST be offered only where asking again could answer differently, and a failure no retry can change MUST be a state of its own rather than a retryable one with the callback left off — otherwise a caller reads the absence of a callback as the discriminant. Supply already on screen MUST survive a later failure.

#### Scenario: A revalidation fails after supply is shown

- **WHEN** a later request fails while a figure is already in hand
- **THEN** the client MUST keep showing that figure

#### Scenario: A failure that will repeat

- **WHEN** the route reports a refusal, or answers with a body the client cannot read
- **THEN** the client MUST report a distinct state carrying no retry, so the card chooses its message from the state itself

### Requirement: Every fetch has a deadline

The route MUST bound its RPC call, and MUST declare a function duration above that bound so the bound is what fires. Both browser paths MUST bound their own requests too, and so MUST the cluster health check, which the cluster status waits on — every request keyed on that status waits there with it. A connection that is accepted and never answered otherwise leaves the card loading for good, with no error, no retry and nothing recorded.

#### Scenario: A node that accepts the connection and never answers

- **WHEN** a request passes its deadline
- **THEN** it MUST fail rather than remain in flight

### Requirement: Failures are sorted by who has to act on them

The route MUST record every failure it answers, and MUST NOT page anyone for a failure that is not its own. A missed deadline and a transient blip MUST warn. A node refusing the call, a cluster with no endpoint configured, and an unclassified failure MUST report at error level. A refusal a caller can provoke MUST NOT be reported at all, because this route is public and reporting one hands any caller a way to raise alerts.

Every failure the route answers MUST carry a browser cache bound, so the retries that follow one answer do not each reach the node. A shared cache MUST NOT be relied on to hold them: it stores a handful of status codes and no error status is among them.

#### Scenario: A slow node

- **WHEN** the node misses the deadline
- **THEN** the route MUST answer `504`, warn, and bound the answer in the visitor's own cache so the retries that follow cost a cache hit rather than another scan

#### Scenario: A node that refuses the call

- **WHEN** the node will not serve the method, or rejects the credentials
- **THEN** the route MUST answer `502`, report at error level, and the client MUST NOT retry it

#### Scenario: A transient upstream failure

- **WHEN** the node is overloaded, or the connection fails in a way that clears on its own
- **THEN** the route MUST answer `503`, warn, and the client MAY retry it

#### Scenario: A failure the route cannot classify

- **WHEN** the failure matches no tier — a name that stops resolving, a TLS handshake nothing completes, a proxy answering with HTML
- **THEN** the route MUST answer `503` and report at error level: nothing here can say the next attempt fails the same way, so `502` stays reserved for a refusal, which is the one answer the client is told not to re-ask

#### Scenario: A cluster the deployment serves with no endpoint set

- **WHEN** a known cluster resolves to no endpoint
- **THEN** the route MUST answer `500` and report at error level, because no caller can provoke it and every visitor's card is dead until someone acts

#### Scenario: A refusal any caller can provoke

- **WHEN** the query is not the canonical shape, or names a cluster the server must not resolve
- **THEN** the route MUST NOT report it to an error tracker

#### Scenario: A rate limit from in front of the route

- **WHEN** something ahead of the route throttles the request
- **THEN** the client MAY retry it, because a rate limit clears on its own and is not an answer the route decided

### Requirement: The browser reports only what no server saw

The browser MUST report a failure the route could not have seen: a `4xx` the route refused the request with, and a `200` whose body it cannot read. It MUST NOT report a `5xx`, which the route recorded itself. A rate limit is the one `4xx` it MUST NOT report either: it comes from in front of the route, it is nobody's bug, and one throttled region would otherwise report once per visitor. It MUST NOT report anything for `Cluster.Custom`, whose URL is the visitor's own and may carry their key.

A report the browser makes for every visitor MUST NOT raise the error rate on its own. Where the browser cannot tell a failure that clears from one that repeats, it MUST report at warning level.

#### Scenario: A route answer the route did not record

- **WHEN** the route refuses the one fixed request this client sends, with any `4xx` but a rate limit
- **THEN** the browser MUST report it, because that answer means a bug here or a client left behind by a deploy

#### Scenario: A failure at a node the browser asked directly

- **WHEN** a direct request fails on a known cluster
- **THEN** the browser MUST record it, because no route saw it, and MUST NOT let one slow cluster set the error rate
