# Proposal: Preserve upstream error statuses in the metadata proxy

## Context

- `executeHop` in `app/api/metadata/proxy/feature/fetch-resource.ts` answers every non-2xx upstream response with `502`.
- Production logs show the upstream statuses behind those `502`s are mostly `429`, `403`, and `404`.
- `reasonForStatus` in `app/features/metadata/lib/imageFailure.ts` has per-status copy for `403` and `404` that the proxy never lets it reach.

## Why

The proxy forwards what the upstream said when that status means the same thing to our caller, and answers `502` only when it does not. RFC 9110 §15.6.3 defines `502` as an invalid upstream response; a `404` from Arweave is a valid response.

Alternatives considered:

- **Keep `502` for every non-2xx.** Rejected: a dead link, a denied request, and a rate limit are indistinguishable in logs and in the UI.
- **Forward every upstream status.** Rejected: `401` and `407` carry authentication semantics that do not apply to our caller, and the set of proxy statuses stops being bounded by `STATUS_MESSAGES`.
- **Map upstream `500` to `502` to keep `500` for internal faults.** Rejected: the upstream status is more useful to the caller, and the throw-site message already separates the two in logs.
- **Drop `Retry-After` on `429`.** Rejected: the caller's retry policy needs the upstream's hint, so the proxy forwards `Retry-After` verbatim (delay-seconds or HTTP-date, RFC 9110 §10.2.3). The proxy itself never retries.
- **Forward `3xx`.** Rejected: redirects are followed inside the proxy with per-hop SSRF validation; a forwarded redirect would send the browser to the upstream directly, exposing the viewer's IP and bypassing the response sandbox.

## What Changes

- `app/api/metadata/proxy/feature/lib/upstream-status.ts` holds `UPSTREAM_PASSTHROUGH` and `toProxyStatus`; `executeHop` uses `toProxyStatus` for every non-2xx, non-redirect response.
- A status outside `UPSTREAM_PASSTHROUGH` keeps the existing `502` response and emits an `Unlisted upstream status` warning with the raw status and `host`, so new candidates for the list show up in logs.
- `STATUS_MESSAGES` gains `410`, `429`, `451`, and `503`.
- A `429` carries the upstream `Retry-After` through `StatusError` to the route response.
- `reasonForStatus` gains copy for `410`, `429`, `451`, and `503`.

## Impact

- Upstream `404`, `403`, and `429` stop counting as proxy `5xx`. Upstream `500`, `503`, and `504` still count.
- Supersedes the "Non-2xx upstream" scenario of `add-metadata-proxy`, which requires `502` for every non-2xx upstream.
