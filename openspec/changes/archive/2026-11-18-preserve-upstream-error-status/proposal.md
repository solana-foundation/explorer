# Proposal: Preserve upstream error statuses in the metadata proxy

## Context

- `executeHop` in `app/api/metadata/proxy/feature/fetch-resource.ts` answers every non-2xx upstream response with `502`.
- Production logs show the upstream statuses behind those `502`s are mostly `429`, `403`, and `404`.
- `reasonForStatus` in `app/features/metadata/lib/imageFailure.ts` has copy for `404` that the proxy never lets it reach, and copy for `403` that only the proxy's own SSRF and protocol blocks reach.
- An upstream that sends headers and then stalls or drops the connection while the body streams makes `readBodyWithLimit` reject; the route's catch then answers `500` "General Error" for what is an upstream failure. A malformed redirect `Location` does the same through `new URL`.
- This decision overlaps the one recorded in `add-metadata-proxy`, which made every non-2xx upstream a `502`: its requirement "The proxy SHALL serve only JSON, text-as-JSON, and image content" says so, and its scenario "Image fails to load for another readable reason" says an upstream `404` is surfaced as a `502`.

## Why

This change intentionally reverses the `502` rule that `add-metadata-proxy` built: the statuses in `UPSTREAM_PASSTHROUGH` now reach the caller unchanged, and `502` remains only for the rest.

The proxy forwards what the upstream said when that status means the same thing to our caller, and answers `502` only when it does not. RFC 9110 §15.6.3 defines `502` as an invalid upstream response; a `404` from Arweave is a valid response.

The same principle covers failures after the headers arrive: the upstream's fault gets an upstream status, and `500` is left for the proxy's own faults. `fetchResource` therefore returns every upstream failure as a `StatusError`, including a body that stalls past the timeout (`504`), a connection dropped mid-body (`502`), and an invalid redirect `Location` (`502`). Only an internal fault throws, so the route's catch reports a thrown error as a Sentry exception and answers `500`.

Alternatives considered:

- **Keep `502` for every non-2xx.** Rejected: a dead link, a denied request, and a rate limit are indistinguishable in logs and in the UI.
- **Forward every upstream status.** Rejected: `401` and `407` carry authentication semantics that do not apply to our caller, and the set of proxy statuses stops being bounded by `STATUS_MESSAGES`.
- **Map upstream `500` to `502` to keep `500` for internal faults.** Rejected: the upstream status is more useful to the caller, and the `StatusError` `code` already separates the two in logs.
- **Drop `Retry-After` on `429`.** Rejected: the caller's retry policy needs the upstream's hint, so the proxy forwards `Retry-After` verbatim (delay-seconds or HTTP-date, RFC 9110 §10.2.3). The proxy itself never retries.
- **Keep `500` for failures that throw from `fetchResource`.** Rejected: the user sees "Image could not be displayed" instead of "timed out" or "source unavailable", and upstream failures count against the proxy's own `5xx` rate.
- **Answer `502` from the route's catch.** Rejected: the catch cannot tell an upstream failure from a proxy bug, so every bug would be reported as the upstream's fault.
- **Forward `3xx`.** Rejected: redirects are followed inside the proxy with per-hop SSRF validation; a forwarded redirect would send the browser to the upstream directly, exposing the viewer's IP and bypassing the response sandbox.

## What Changes

- `app/api/metadata/proxy/feature/lib/upstream-status.ts` holds `UPSTREAM_PASSTHROUGH` and `toProxyStatus`; `executeHop` uses `toProxyStatus` for every non-2xx, non-redirect response.
- A status outside `UPSTREAM_PASSTHROUGH` keeps the existing `502` response and emits an `Unlisted upstream status` warning with the raw status and `host`, so new candidates for the list show up in logs.
- `STATUS_MESSAGES` gains `410`, `429`, `451`, and `503`.
- A `429` carries the upstream `Retry-After` through `StatusError` to the route response.
- `reasonForStatus` gains copy for `410`, `429`, `451`, and `503`.
- `processResponse` sends a body-read rejection other than the size cap through `classifyFetchError`, the classifier `fetch()` rejections already use; `readBodyWithLimit` throws `BodyShapeError` for the two faults caused by the runtime's stream type, which keep throwing.
- `resolveRedirectUrl` returns a `redirect-invalid-location` `502` for a `Location` that `URL.parse` rejects.
- The route's catch reports through `Logger.error` with `sentry: true`.
- `decode-failed` is reported as a Sentry exception: the body is already buffered, so a decode failure other than malformed JSON is the proxy's own fault.

## Impact

- Upstream `404`, `403`, and `429` stop counting as proxy `5xx`. Upstream `500`, `503`, and `504` still count.
- A stalled body answers `504` and a dropped connection `502` instead of `500`. Apart from a listed upstream `500`, a proxy `500` then means the proxy's own fault, and each one is a Sentry exception.
- Supersedes four passages of `add-metadata-proxy`, across three requirements:
    - "The proxy SHALL serve only JSON, text-as-JSON, and image content": its sentence "A non-2xx upstream (that is not a handled redirect) SHALL be `502`" and its "Non-2xx upstream" scenario.
    - "Off-chain images SHALL surface why they could not be displayed and degrade gracefully": its "Image fails to load for another readable reason" scenario, which says an upstream `404` is surfaced as a `502`.
    - "The proxy SHALL report size-cap hits and network failures to Sentry as warnings": its "Upstream fetch fails for a network reason" scenario, which says "`500` is reserved for genuine internal errors caught at the route boundary", while an upstream `500` now passes through.
- Archive order: `add-metadata-proxy` is archived first, which creates the `metadata-proxy` base spec. This delta then moves from `## ADDED Requirements` to `## MODIFIED Requirements`, restating all three requirements above in full with the superseded passages replaced, before it is archived. Until then both changes are open and the overlap is recorded here only.
