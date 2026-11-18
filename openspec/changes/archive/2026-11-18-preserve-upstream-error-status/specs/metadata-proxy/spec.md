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

## MODIFIED Requirements

### Requirement: The proxy SHALL serve only JSON, text-as-JSON, and image content

The proxy SHALL return only responses whose `Content-Type` is `application/json` (parsed as JSON), `text/plain` (trimmed, CRLF-normalised, then parsed as JSON), or `image/*` (returned as binary). Any other content type SHALL be `415`. Malformed JSON on the JSON or text path SHALL be `415`, not `500`. A non-2xx upstream (that is not a handled redirect) SHALL be answered as the requirement "The proxy SHALL pass listed upstream error statuses through unchanged" defines.

#### Scenario: Unsupported content type

- **WHEN** the upstream returns a `Content-Type` that is not JSON, text, or an image
- **THEN** the proxy SHALL respond `415`

#### Scenario: Malformed JSON

- **WHEN** the upstream advertises JSON (or text) but the body does not parse
- **THEN** the proxy SHALL respond `415`

#### Scenario: Non-2xx upstream

- **WHEN** the upstream returns a non-2xx, non-redirect status
- **THEN** the proxy SHALL respond with the same status when it is listed for pass-through, and `502` otherwise

### Requirement: The proxy SHALL report size-cap hits and network failures to Sentry as warnings

Because oversize content and upstream network failures are expected third-party behaviour rather than application faults, the proxy SHALL report them at `warning` severity (via `Logger.warn` with `sentry: true`) and MUST NOT raise them as exceptions/errors.

Every one of the three `413` size-cap paths (Content-Length pre-check, streamed overflow, and `fetch()` rejection) SHALL emit a warning whose `sentryExtras` include the upstream `host` and effective `maxSize`; the pre-check path SHALL additionally include `declaredContentLength`. A general fetch failure SHALL likewise emit a `warning`.

#### Scenario: Any size-cap path trips

- **WHEN** the proxy rejects a response on any of the three size-cap paths
- **THEN** it SHALL emit a `Logger.warn(..., { sentry: true, sentryExtras: { host, maxSize, … } })` and SHALL NOT report an exception

#### Scenario: Upstream fetch fails for a network reason

- **WHEN** `fetch()` fails for a reason other than timeout/abort/size
- **THEN** the proxy SHALL emit a `warning`-level Sentry event and respond `502` (an unreachable upstream is a bad gateway, not an internal fault). A `500` comes only from a listed upstream `500` or from a fault in the proxy's own code

### Requirement: Off-chain images SHALL surface why they could not be displayed and degrade gracefully

Off-chain images rendered through the proxy SHALL be displayed via the `ProxiedImage` component, which composes proxy-agnostic image primitives from `app/components/shared/ui/image/`. While the image loads it SHALL show a skeleton sized to the image's slot; on success it SHALL show the image; on any load failure it SHALL render a fallback in the image's place — including when the proxy rejects it with `413` for exceeding the size cap. While the on-error reason probe (below) is still in flight, the loading skeleton SHALL be held rather than flashing a reasonless fallback, so the failure state appears once, fully formed with its reason.

Because a browser `<img>` element cannot read the HTTP status, on a load failure the component SHALL re-`fetch` the same proxied (same-origin) `src` to read `response.status` and map it to a human-readable, per-status reason (e.g. `413` → "Image exceeds maximum size", `415` → "Unsupported image type", `502`/network failure → "Image source unavailable", `504` → "Image source timed out"). The probe targets the same-origin proxy URL — never the upstream host — so it leaks nothing the original `<img>` request did not, and is usually served from the browser cache that request primed (see the caching requirement); a `504` whose error response was not cached can re-incur the upstream timeout, which is why the loading state is held until the probe resolves. A `src` that is not the same-origin proxy (proxy disabled, or a non-HTTP scheme passed through) has no readable status, so the component SHALL show a generic reason without probing.

The default fallback SHALL be a Solana-logo placeholder that inherits the image's own className/box — so a rounded-full avatar gets a round logo — and SHALL carry the reason as both its accessible name and a hover tooltip (working at any size, including a 16px avatar where visible text would not fit). Consumers MAY supply a `fallback` render function to receive the resolved reason and render it differently.

The original third-party URL SHALL be offered only as an explicit, opt-in (`showOriginalLink`), user-initiated link (opening in a new tab with `rel="noopener noreferrer"`), so the viewer's IP is exposed to the upstream host only on a deliberate click and never automatically. When `showOriginalLink` is set the link is rendered beside the image in **every** state — loading, loaded, and failed — not gated on a load failure (a browser `<img>` can't report its status, so the escape hatch is offered up front); the IP is still exposed only on a deliberate click. When shown, the failure reason SHALL ride in that link's info tooltip rather than its text. When no URI is available the fallback SHALL render without an outbound link.

#### Scenario: Image exceeds the size cap

- **WHEN** an image routed through the proxy is rejected with `413`
- **THEN** the component SHALL re-fetch the proxied src, read the `413`, and render the fallback with the reason "Image exceeds maximum size" (as the logo's tooltip, and in the link's info tooltip when `showOriginalLink` is set) rather than a broken-image icon

#### Scenario: Image fails to load for another readable reason

- **WHEN** a proxied image fails with a status that has its own reason: `403`, `404`, `410`, `415`, `429`, `451`, `502`, `503`, or `504`
- **THEN** the on-error probe SHALL read that status and the fallback SHALL show the matching per-status reason

#### Scenario: Failure with no readable status

- **WHEN** the failing `src` is not the same-origin proxy (cross-origin or a non-HTTP passthrough), or the probe cannot read a status (network/opaque/abort)
- **THEN** the fallback SHALL show the generic reason "Image could not be displayed" without surfacing a misleading specific cause

#### Scenario: Failure reason still being determined

- **WHEN** a proxied image has failed but the on-error reason probe has not yet resolved
- **THEN** the component SHALL keep showing the loading skeleton rather than a reasonless fallback, until the reason resolves

#### Scenario: Opening the original is opt-in

- **WHEN** `showOriginalLink` is set for a resource with a known http(s) URI
- **THEN** the component SHALL render a link to the original URI that navigates only on user click, with `target="_blank"` and `rel="noopener noreferrer"`
- **AND** SHALL NOT fetch or preload the original automatically
