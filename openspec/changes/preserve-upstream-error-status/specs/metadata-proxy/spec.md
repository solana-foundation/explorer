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
