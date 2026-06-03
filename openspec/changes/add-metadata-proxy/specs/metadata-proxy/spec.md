## ADDED Requirements

### Requirement: Off-chain metadata SHALL be fetched through a flag-gated server proxy

Off-chain metadata and image URIs (which originate from on-chain, third-party data) SHALL be routed through the server-side proxy at `/api/metadata/proxy` when `NEXT_PUBLIC_METADATA_ENABLED === 'true'`, and SHALL be passed through unchanged for direct browser fetching when the flag is unset or any other value.

The client rewriter `getProxiedUri` SHALL only rewrite `http:`/`https:` URIs to `/api/metadata/proxy?uri=<encoded>`; non-HTTP URIs and empty strings SHALL be returned unchanged. The route itself SHALL respond `404` whenever the feature is not enabled, so the proxy cannot be reached in disabled deployments even by direct URL.

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

The proxy SHALL reject any upstream body exceeding a per-request byte cap with `413`, where the cap defaults to 3 MB (3,000,000 bytes) — chosen to sit below Vercel's ~4.5 MB buffered-response limit and to bound the memory the function buffers — and is overridable via `NEXT_PUBLIC_METADATA_MAX_CONTENT_SIZE`.

The cap MUST be enforced everywhere the size becomes knowable so no oversize body is fully buffered: the `Content-Length` pre-check, the streamed read (which aborts mid-stream when `Content-Length` is omitted or understated), the `fetch()`-rejection path, and the decode step. A malformed `Content-Length` (parsing to `NaN`) SHALL be ignored by the pre-check and fall through to the streamed read.

#### Scenario: Declared Content-Length exceeds the cap

- **WHEN** an upstream declares a `Content-Length` larger than the effective cap
- **THEN** the proxy SHALL cancel the body and respond `413` without buffering it

#### Scenario: Server understates or omits Content-Length

- **WHEN** an upstream streams more than the cap with no (or an understated) `Content-Length`
- **THEN** the streamed read SHALL abort once the cap is crossed and the proxy SHALL respond `413`

#### Scenario: Cap overridden by environment

- **WHEN** `NEXT_PUBLIC_METADATA_MAX_CONTENT_SIZE` is set
- **THEN** that value SHALL be used as the cap, and the 3,000,000-byte default SHALL apply only when it is unset

### Requirement: The proxy SHALL bound each request with a timeout

Each hop's `fetch` SHALL be aborted after a configurable timeout, defaulting to 10,000 ms and overridable via `NEXT_PUBLIC_METADATA_TIMEOUT`. A timed-out or aborted upstream fetch SHALL surface as `504`. In addition, the route SHALL declare a platform-level `maxDuration` (15 s) as a backstop that bounds the whole invocation independently of the per-hop timeout — covering DNS resolution and multi-hop redirect chains the per-hop timeout does not.

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

The proxy SHALL omit `Content-Length` from its response (to keep the response a "simple" CORS response that browsers accept without `Access-Control-Allow-Origin`) and SHALL forward `content-type` and `etag` from the upstream (with safe defaults when absent). It SHALL set its own caching headers (see the caching requirement below) rather than forwarding the upstream `cache-control`. The client-facing error body SHALL use the canonical `STATUS_MESSAGES` text, decoupled from the internal per-throw-site message preserved for logging.

#### Scenario: Proxied SVG opened directly

- **WHEN** a proxied SVG containing a `<script>` is opened as a top-level document via the proxy URL
- **THEN** the CSP sandbox and `nosniff` headers SHALL prevent the script from executing in the Explorer origin

#### Scenario: Upstream lacking CORS headers

- **WHEN** an upstream that sends no `Access-Control-Allow-Origin` is proxied
- **THEN** the proxy response SHALL omit `Content-Length` so the browser accepts it as a simple CORS response

### Requirement: The proxy SHALL cache successful responses at the edge

Successful (2xx) responses SHALL be cached on Vercel's CDN via `Vercel-CDN-Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800`, with a browser-facing `Cache-Control: public, max-age=300`. The cache key is the request URL (including the `uri` query parameter), so each distinct upstream resource is cached independently. The proxy SHALL NOT forward the upstream `cache-control` (it is frequently `no-store`/`no-cache`/`private`, any of which would disqualify the response from the CDN), and non-2xx responses SHALL NOT carry caching headers.

#### Scenario: Successful response is edge-cacheable

- **WHEN** the proxy serves a 2xx response
- **THEN** it SHALL set `Vercel-CDN-Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800` and `Cache-Control: public, max-age=300`
- **AND** SHALL NOT forward the upstream `cache-control`

#### Scenario: Errors are not cached

- **WHEN** the proxy responds with a non-2xx status
- **THEN** the response SHALL NOT carry `s-maxage` / `stale-while-revalidate` caching headers

### Requirement: The proxy SHALL report size-cap hits and network failures to Sentry as warnings

Because oversize content and upstream network failures are expected third-party behaviour rather than application faults, the proxy SHALL report them at `warning` severity (via `Logger.warn` with `sentry: true`) and MUST NOT raise them as exceptions/errors.

Every one of the three `413` size-cap paths (Content-Length pre-check, streamed overflow, and `fetch()` rejection) SHALL emit a warning whose `sentryExtras` include the upstream `host` and effective `maxSize`; the pre-check path SHALL additionally include `declaredContentLength`. A general fetch failure SHALL likewise emit a `warning`.

#### Scenario: Any size-cap path trips

- **WHEN** the proxy rejects a response on any of the three size-cap paths
- **THEN** it SHALL emit a `Logger.warn(..., { sentry: true, sentryExtras: { host, maxSize, … } })` and SHALL NOT report an exception

#### Scenario: Upstream fetch fails for a network reason

- **WHEN** `fetch()` fails for a reason other than timeout/abort/size
- **THEN** the proxy SHALL emit a `warning`-level Sentry event and respond `500`

### Requirement: The proxy SHALL log successful fetch sizes for cap tuning

On the success path the proxy SHALL emit an `info`-level log recording the actual fetched byte length together with the upstream `host`, the response `contentType`, and the effective `maxSize`, so the full fetched-size distribution — not only the over-cap tail captured by the size-cap warnings — can be queried from logs to choose the long-term cap. This log MUST NOT be sent to Sentry (no per-request Sentry event on success).

#### Scenario: A resource is fetched within the cap

- **WHEN** the proxy successfully fetches and serves a resource
- **THEN** it SHALL emit `Logger.info('[api:metadata-proxy] Resource fetched', { byteLength, contentType, host, maxSize })`
- **AND** the event SHALL NOT be reported to Sentry

### Requirement: Off-chain images SHALL degrade to a graceful fallback when they cannot be displayed

Off-chain images rendered through the proxy SHALL be displayed via the `ProxiedImage` component, which composes proxy-agnostic image primitives from `app/components/shared/ui/image/` and renders a fallback in place of the image whenever it fails to load — including when the proxy rejects it with `413` for exceeding the size cap. Because a browser `<img>` element cannot read the HTTP status, the component SHALL treat every load failure (`413`/`404`/`502`/CORS) with the same fallback rather than an oversize-specific message.

The fallback SHALL offer access to the original third-party URL only as an explicit, user-initiated link (opening in a new tab with `rel="noopener noreferrer"`), so the viewer's IP is exposed to the upstream host only on a deliberate click and never automatically. When no URI is available the fallback SHALL render without an outbound link.

#### Scenario: Image exceeds the size cap

- **WHEN** an image routed through the proxy is rejected with `413`
- **THEN** the consumer SHALL render the `ProxiedImage` fallback (placeholder plus an opt-in "View original" link) rather than a broken-image icon

#### Scenario: Image fails to load for any other reason

- **WHEN** the image request fails with `404`, `502`, or a CORS error
- **THEN** the same generic fallback SHALL be shown, since the `<img>` element cannot distinguish the cause

#### Scenario: Opening the original is opt-in

- **WHEN** the fallback is shown for a resource with a known URI
- **THEN** it SHALL render a link to the original URI that navigates only on user click, with `target="_blank"` and `rel="noopener noreferrer"`
- **AND** SHALL NOT fetch or preload the original automatically
