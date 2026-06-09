## ADDED Requirements

### Requirement: Off-chain metadata SHALL be fetched through a flag-gated server proxy

Off-chain metadata and image URIs (which originate from on-chain, third-party data) SHALL be routed through the server-side proxy at `/api/metadata/proxy` when `NEXT_PUBLIC_METADATA_ENABLED === 'true'`, and SHALL be passed through unchanged for direct browser fetching when the flag is unset or any other value.

The client rewriter `getProxiedUri` SHALL only rewrite `http:`/`https:` URIs to `/api/metadata/proxy?uri=<encoded>`; non-HTTP URIs, empty strings, and unparseable URIs SHALL be returned unchanged. A malformed on-chain URI MUST NOT throw — callers render the returned value inline (often outside an error boundary), so a throw would crash the surrounding component. The route itself SHALL respond `404` whenever the feature is not enabled, so the proxy cannot be reached in disabled deployments even by direct URL.

#### Scenario: Feature disabled

- **WHEN** `NEXT_PUBLIC_METADATA_ENABLED` is unset or not `'true'`
- **THEN** `getProxiedUri` SHALL return the original URI unchanged
- **AND** a direct `GET /api/metadata/proxy?uri=…` SHALL respond `404`

#### Scenario: Feature enabled

- **WHEN** `NEXT_PUBLIC_METADATA_ENABLED === 'true'` and a consumer needs an `http(s)` resource
- **THEN** `getProxiedUri` SHALL return `/api/metadata/proxy?uri=<encodeURIComponent(uri)>`

#### Scenario: Non-HTTP URI while enabled

- **WHEN** the feature is enabled and the URI uses a non-HTTP scheme (e.g. `ipfs:`, `data:`)
- **THEN** `getProxiedUri` SHALL return the URI unchanged rather than route it through the proxy

#### Scenario: Malformed URI while enabled

- **WHEN** the feature is enabled and the URI cannot be parsed as an absolute URL (e.g. `not-a-url`, `http://`)
- **THEN** `getProxiedUri` SHALL return the value unchanged rather than throw, so a single bad on-chain URI cannot crash the component rendering it

### Requirement: The proxy SHALL block SSRF via private-IP rejection and DNS pinning

The proxy MUST treat every target host as untrusted. For each hop it SHALL resolve the hostname once, reject the request with `403` if any resolved address falls in a private/reserved IPv4 or IPv6 range (or the host is `localhost`/`0`/`::1`), and SHALL refuse non-HTTP protocols with `403`.

To close the DNS-rebinding TOCTOU window, the proxy SHALL pin the validated addresses and replay them to the HTTP client so the kernel never re-resolves the hostname between validation and connection.

#### Scenario: Host resolves to a private address

- **WHEN** the target hostname resolves to any address in a private/reserved range (e.g. `10.0.0.0/8`, `127.0.0.0/8`, `169.254.0.0/16`, `::1`)
- **THEN** the proxy SHALL respond `403` and SHALL NOT open a connection to that address

#### Scenario: Non-HTTP protocol

- **WHEN** the (initial or post-redirect) URL uses a scheme other than `http:`/`https:`
- **THEN** the proxy SHALL respond `403`

#### Scenario: DNS rebinding attempt

- **WHEN** an authoritative DNS server would return a public address at validation time and a private one at connect time
- **THEN** the connection SHALL use only the validated, pinned address, so the rebind cannot redirect the socket to a private host

### Requirement: The proxy SHALL follow redirects manually with per-hop re-validation

The proxy SHALL NOT delegate redirect following to the HTTP client. It SHALL follow up to `MAX_REDIRECTS` (3) redirect hops, re-running hostname validation on every hop, so a public host cannot redirect to an internal address.

A redirect status without a `Location` header SHALL be a `502`; a redirect that revisits an already-seen URL SHALL be a `502` (loop); exceeding the hop budget SHALL be a `502`.

#### Scenario: Redirect to an internal address

- **WHEN** a public host returns a `3xx` whose `Location` points at a private/reserved address
- **THEN** the next hop's validation SHALL reject it with `403`

#### Scenario: Redirect loop

- **WHEN** the redirect chain revisits a URL already seen in the same request
- **THEN** the proxy SHALL respond `502` rather than loop indefinitely

#### Scenario: Too many redirects

- **WHEN** the redirect chain exceeds 3 hops
- **THEN** the proxy SHALL respond `502`

### Requirement: The proxy SHALL enforce a configurable per-request size cap

The proxy SHALL reject any upstream body exceeding a per-request byte cap with `413`, where the cap defaults to 4 MB (4,000,000 bytes) — chosen to sit just under Vercel's ~4.5 MB buffered-response limit (a thin ~0.5 MB margin) while still bounding the memory the function buffers — and is overridable via `NEXT_PUBLIC_METADATA_MAX_CONTENT_SIZE`. The override SHALL be validated as a positive integer at module load; a missing or malformed value (non-numeric, zero, negative, or `NaN`) SHALL fall back to the default and be logged, so a misconfigured env cannot silently disable the cap (fail open).

The cap MUST be enforced everywhere the size becomes knowable so no oversize body is fully buffered: the `Content-Length` pre-check, the streamed read (which aborts mid-stream when `Content-Length` is omitted or understated), and the `fetch()`-rejection path. The streamed read is the binding guarantee — it bounds the buffer before any decode occurs; the decode-path size catches in `processors.ts` are a defensive backstop, exercised by unit tests but not reachable in the live pipeline (processors only decode the already-bounded buffer). A malformed `Content-Length` (parsing to `NaN`) SHALL be ignored by the pre-check and fall through to the streamed read.

#### Scenario: Declared Content-Length exceeds the cap

- **WHEN** an upstream declares a `Content-Length` larger than the effective cap
- **THEN** the proxy SHALL cancel the body and respond `413` without buffering it

#### Scenario: Server understates or omits Content-Length

- **WHEN** an upstream streams more than the cap with no (or an understated) `Content-Length`
- **THEN** the streamed read SHALL abort once the cap is crossed and the proxy SHALL respond `413`

#### Scenario: Cap overridden by environment

- **WHEN** `NEXT_PUBLIC_METADATA_MAX_CONTENT_SIZE` is set to a positive integer
- **THEN** that value SHALL be used as the cap

#### Scenario: Cap override is missing or malformed

- **WHEN** `NEXT_PUBLIC_METADATA_MAX_CONTENT_SIZE` is unset or not a positive integer (e.g. `abc`, `0`, `-1`)
- **THEN** the 4,000,000-byte default SHALL be used and a malformed value SHALL be logged, so the cap is never silently disabled

### Requirement: The proxy SHALL bound each request with a timeout

Each hop's `fetch` SHALL be aborted after a configurable timeout, defaulting to 10,000 ms and overridable via `NEXT_PUBLIC_METADATA_TIMEOUT` (validated as a positive integer, falling back to the default on a missing or malformed value, as with the size cap). A timed-out or aborted upstream fetch SHALL surface as `504`. In addition, the route SHALL declare a platform-level `maxDuration` (15 s) as a backstop that bounds the whole invocation independently of the per-hop timeout — covering DNS resolution and multi-hop redirect chains the per-hop timeout does not.

#### Scenario: Upstream is too slow

- **WHEN** an upstream does not respond within the timeout
- **THEN** the fetch SHALL be aborted and the proxy SHALL respond `504`

### Requirement: The proxy SHALL serve only JSON, text-as-JSON, and image content

The proxy SHALL return only responses whose `Content-Type` is `application/json` (parsed as JSON), `text/plain` (trimmed, CRLF-normalised, then parsed as JSON), or `image/*` (returned as binary). Any other content type SHALL be `415`. Malformed JSON on the JSON or text path SHALL be `415`, not `500`. A non-2xx upstream (that is not a handled redirect) SHALL be `502`.

#### Scenario: Unsupported content type

- **WHEN** the upstream returns a `Content-Type` that is not JSON, text, or an image
- **THEN** the proxy SHALL respond `415`

#### Scenario: Malformed JSON

- **WHEN** the upstream advertises JSON (or text) but the body does not parse
- **THEN** the proxy SHALL respond `415`

#### Scenario: Non-2xx upstream

- **WHEN** the upstream returns a non-2xx, non-redirect status
- **THEN** the proxy SHALL respond `502`

### Requirement: The proxy SHALL harden responses against content execution and CORS friction

The proxy response MUST carry `Content-Security-Policy: sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:; frame-ancestors 'none'` and `X-Content-Type-Options: nosniff`, so proxied SVG/HTML cannot execute scripts if the proxy URL is opened directly as a top-level document.

The proxy SHALL omit `Content-Length` from its response (to keep the response a "simple" CORS response that browsers accept without `Access-Control-Allow-Origin`) and SHALL forward `content-type` from the upstream (with a safe default when absent). It SHALL NOT set an `ETag`: the route does no conditional revalidation (it never reads `If-None-Match` nor emits `304`), so a forwarded validator would be inert and a shared placeholder would risk false `304` matches across distinct resources. It SHALL set its own browser `Cache-Control` (see the caching requirement below) rather than forwarding the upstream `cache-control`. The client-facing error body SHALL use the canonical `STATUS_MESSAGES` text, decoupled from the internal per-throw-site message preserved for logging.

#### Scenario: Proxied SVG opened directly

- **WHEN** a proxied SVG containing a `<script>` is opened as a top-level document via the proxy URL
- **THEN** the CSP sandbox and `nosniff` headers SHALL prevent the script from executing in the Explorer origin

#### Scenario: Upstream lacking CORS headers

- **WHEN** an upstream that sends no `Access-Control-Allow-Origin` is proxied
- **THEN** the proxy response SHALL omit `Content-Length` so the browser accepts it as a simple CORS response

#### Scenario: Response carries no ETag

- **WHEN** the proxy serves a response, whether or not the upstream sent an `ETag`
- **THEN** the proxy response SHALL NOT include an `ETag` header

### Requirement: The proxy SHALL cache responses in the browser only, never at the edge

Successful (2xx) responses SHALL carry a browser-facing `Cache-Control: public, max-age=86400` (1 day), so a viewer's own browser serves repeat views from its cache for up to a day. The directive SHALL NOT include `immutable`, so a rare in-place overwrite of a mutable URL is picked up once the window lapses.

Error (non-2xx) responses SHALL carry a short, browser-only `Cache-Control: private, max-age=30`. This lets the failed `<img>` request prime the browser cache so the on-error failure-reason probe (see the fallback requirement) re-reads the status from cache rather than re-invoking the function; `private` keeps the verdict out of shared/edge caches, and the short TTL lets a transient `5xx` clear quickly while a stable `413`/`404`/`415` stays cheap to re-read.

Neither path SHALL set `Vercel-CDN-Cache-Control` (or any other edge/CDN cache directive), so responses are never cached at the Vercel edge and every cold or cross-client view re-invokes the function. The proxy SHALL NOT forward the upstream `cache-control` (it is frequently `no-store`/`no-cache`/`private`).

#### Scenario: Successful response is browser-cacheable but not edge-cached

- **WHEN** the proxy serves a 2xx response
- **THEN** it SHALL set `Cache-Control: public, max-age=86400`
- **AND** it SHALL NOT set `Vercel-CDN-Cache-Control`
- **AND** SHALL NOT forward the upstream `cache-control`

#### Scenario: Error response is briefly browser-cached, never edge-cached

- **WHEN** the proxy responds with a non-2xx status
- **THEN** it SHALL set `Cache-Control: private, max-age=30`
- **AND** it SHALL NOT set `Vercel-CDN-Cache-Control`

### Requirement: The proxy SHALL report size-cap hits and network failures to Sentry as warnings

Because oversize content and upstream network failures are expected third-party behaviour rather than application faults, the proxy SHALL report them at `warning` severity (via `Logger.warn` with `sentry: true`) and MUST NOT raise them as exceptions/errors.

Every one of the three `413` size-cap paths (Content-Length pre-check, streamed overflow, and `fetch()` rejection) SHALL emit a warning whose `sentryExtras` include the upstream `host` and effective `maxSize`; the pre-check path SHALL additionally include `declaredContentLength`. A general fetch failure SHALL likewise emit a `warning`.

#### Scenario: Any size-cap path trips

- **WHEN** the proxy rejects a response on any of the three size-cap paths
- **THEN** it SHALL emit a `Logger.warn(..., { sentry: true, sentryExtras: { host, maxSize, … } })` and SHALL NOT report an exception

#### Scenario: Upstream fetch fails for a network reason

- **WHEN** `fetch()` fails for a reason other than timeout/abort/size
- **THEN** the proxy SHALL emit a `warning`-level Sentry event and respond `502` (an unreachable upstream is a bad gateway, not an internal fault); `500` is reserved for genuine internal errors caught at the route boundary

### Requirement: The proxy SHALL log successful fetch sizes for cap tuning

On the success path the proxy SHALL emit an `info`-level log recording the actual fetched byte length together with the upstream `host`, the response `contentType`, and the effective `maxSize`, so the full fetched-size distribution — not only the over-cap tail captured by the size-cap warnings — can be queried from logs to choose the long-term cap. This log MUST NOT be sent to Sentry (no per-request Sentry event on success).

#### Scenario: A resource is fetched within the cap

- **WHEN** the proxy successfully fetches and serves a resource
- **THEN** it SHALL emit `Logger.info('[api:metadata-proxy] Resource fetched', { byteLength, contentType, host, maxSize })`
- **AND** the event SHALL NOT be reported to Sentry

### Requirement: Off-chain images SHALL surface why they could not be displayed and degrade gracefully

Off-chain images rendered through the proxy SHALL be displayed via the `ProxiedImage` component, which composes proxy-agnostic image primitives from `app/components/shared/ui/image/`. While the image loads it SHALL show a skeleton sized to the image's slot; on success it SHALL show the image; on any load failure it SHALL render a fallback in the image's place — including when the proxy rejects it with `413` for exceeding the size cap. While the on-error reason probe (below) is still in flight, the loading skeleton SHALL be held rather than flashing a reasonless fallback, so the failure state appears once, fully formed with its reason.

Because a browser `<img>` element cannot read the HTTP status, on a load failure the component SHALL re-`fetch` the same proxied (same-origin) `src` to read `response.status` and map it to a human-readable, per-status reason (e.g. `413` → "Image exceeds maximum size", `415` → "Unsupported image type", `502`/network failure → "Image source unavailable", `504` → "Image source timed out"). The probe targets the same-origin proxy URL — never the upstream host — so it leaks nothing the original `<img>` request did not, and is usually served from the browser cache that request primed (see the caching requirement); a `504` whose error response was not cached can re-incur the upstream timeout, which is why the loading state is held until the probe resolves. A `src` that is not the same-origin proxy (proxy disabled, or a non-HTTP scheme passed through) has no readable status, so the component SHALL show a generic reason without probing.

The default fallback SHALL be a Solana-logo placeholder that inherits the image's own className/box — so a rounded-full avatar gets a round logo — and SHALL carry the reason as both its accessible name and a hover tooltip (working at any size, including a 16px avatar where visible text would not fit). Consumers MAY supply a `fallback` render function to receive the resolved reason and render it differently.

The original third-party URL SHALL be offered only as an explicit, opt-in (`showOriginalLink`), user-initiated link (opening in a new tab with `rel="noopener noreferrer"`), so the viewer's IP is exposed to the upstream host only on a deliberate click and never automatically. When `showOriginalLink` is set the link is rendered beside the image in **every** state — loading, loaded, and failed — not gated on a load failure (a browser `<img>` can't report its status, so the escape hatch is offered up front); the IP is still exposed only on a deliberate click. When shown, the failure reason SHALL ride in that link's info tooltip rather than its text. When no URI is available the fallback SHALL render without an outbound link.

#### Scenario: Image exceeds the size cap

- **WHEN** an image routed through the proxy is rejected with `413`
- **THEN** the component SHALL re-fetch the proxied src, read the `413`, and render the fallback with the reason "Image exceeds maximum size" (as the logo's tooltip, and in the link's info tooltip when `showOriginalLink` is set) rather than a broken-image icon

#### Scenario: Image fails to load for another readable reason

- **WHEN** a proxied image fails with `403`, `415`, `502`, or `504` (the statuses the proxy actually emits; an upstream `404` is surfaced as a `502`)
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
