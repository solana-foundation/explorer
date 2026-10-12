## ADDED Requirements

### Requirement: The proxy SHALL pass listed upstream error statuses through unchanged

When the upstream returns a non-2xx status that is not a handled redirect, the proxy SHALL respond with the same status if it is one of `400`, `403`, `404`, `410`, `429`, `451`, `500`, `503`, or `504`, and with `502` otherwise. The response body SHALL be the canonical `STATUS_MESSAGES` text. On a `429` the proxy SHALL forward the upstream `Retry-After` value unchanged when present; it SHALL NOT forward any other upstream response header on this path.

This requirement intentionally replaces the `add-metadata-proxy` rule that every non-2xx upstream is a `502`; `502` remains only for statuses outside the list. It also replaces that change's statement that `500` is reserved for internal errors: an upstream `500` passes through as `500`.

#### Scenario: Listed upstream status

- **WHEN** the upstream responds `404`
- **THEN** the proxy SHALL respond `404`

#### Scenario: Upstream rate limit

- **WHEN** the upstream responds `429` with a `Retry-After` header
- **THEN** the proxy SHALL respond `429`
- **AND** the response SHALL include the same `Retry-After` value

#### Scenario: Upstream rate limit without Retry-After

- **WHEN** the upstream responds `429` with no `Retry-After` header
- **THEN** the proxy SHALL respond `429` without `Retry-After`

#### Scenario: Unlisted upstream status

- **WHEN** the upstream responds with a status outside the list (e.g. `401`, `304`, `502`)
- **THEN** the proxy SHALL respond `502`
- **AND** it SHALL emit a `warning`-level log with the raw upstream status and `host`

### Requirement: The proxy SHALL answer an upstream failure after the headers with an upstream status

An upstream failure that happens after the response headers arrive SHALL produce the same status as the equivalent failure of the request itself: `504` when the body stalls past the timeout, `502` when the connection drops while the body streams, and `502` when a redirect `Location` is not a valid URL. A fault in the proxy's own code, whether thrown or returned as `decode-failed`, SHALL be answered `500` and reported to Sentry as an exception. A listed upstream `500` passes through under the pass-through requirement and is not reported as an exception.

#### Scenario: Body stalls past the timeout

- **WHEN** the upstream sends headers and then sends the body slower than the timeout allows
- **THEN** the proxy SHALL respond `504`

#### Scenario: Connection dropped mid-body

- **WHEN** the upstream closes the connection while the body streams
- **THEN** the proxy SHALL respond `502`
- **AND** it SHALL emit the `warning`-level network-failure event to Sentry, not an exception

#### Scenario: Invalid redirect Location

- **WHEN** the upstream redirects with a `Location` that is not a valid URL
- **THEN** the proxy SHALL respond `502` without following it

#### Scenario: Internal fault

- **WHEN** the proxy's own code throws while handling a request
- **THEN** the proxy SHALL respond `500`
- **AND** it SHALL report the error to Sentry as an exception

#### Scenario: Decode fault on a buffered body

- **WHEN** decoding the buffered body fails for a reason other than malformed JSON
- **THEN** the proxy SHALL respond `500`
- **AND** it SHALL report the error to Sentry as an exception
