# Proposal: Server-side proxy for off-chain metadata and images

## Context

- The Explorer renders token/NFT artwork, logos, and off-chain JSON metadata from URIs that originate **on-chain** — i.e. supplied by arbitrary third parties (token creators, NFT mints, `security.txt` logos). Today the browser fetches those URIs **directly**: `getProxiedUri` (`app/features/metadata/utils.ts`) returns the raw URI, and components like `NFTArt`, `AccountHeader`, `OwnedTokensCard`, `CompressedNftCard`, and the receipt page load it straight from the upstream host.
- Direct browser fetching has four standing problems for user-supplied URIs:
  - **Privacy** — every viewer's IP and `Referer` are exposed to whatever host a token creator put on-chain.
  - **CORS reliability** — many metadata hosts (S3, IPFS gateways, game CDNs) don't send `Access-Control-Allow-Origin`, so JSON fetches fail in the browser even though the bytes are public.
  - **No resource control** — the browser will pull a multi-hundred-MB "image" with no size or time bound.
  - **Untrusted content execution** — an SVG with embedded `<script>` served from a metadata host runs in the Explorer origin if rendered or opened directly.
- A server-side proxy route already exists under `app/api/metadata/proxy/` but is **gated off**: the route returns `404` unless `NEXT_PUBLIC_METADATA_ENABLED === 'true'`, and `getProxiedUri` only rewrites URIs to `/api/metadata/proxy?uri=…` when that same flag is set. The feature is being built and validated dark; this proposal is the design record for what the proxy guarantees and why, ahead of enabling it per-deployment.

## Why

We want a **single, SSRF-safe server seam** through which all off-chain metadata and image bytes flow, so we can apply privacy, reliability, resource, and content-safety policy in one place instead of trusting the browser to fetch arbitrary on-chain URIs.

Principles that drove the design:

- **A proxy is the only seam that owns the fetch.** Privacy (hide the viewer's IP), CORS reliability (server-to-server has no CORS), size/timeout limits, and content sandboxing all require the fetch to happen on our side. No client-only change achieves them.
- **User-supplied URIs are hostile until proven otherwise.** The target host comes from on-chain data, so the proxy must assume SSRF intent: it validates every hop against private IP ranges, pins DNS to defeat rebinding, and refuses non-HTTP protocols.
- **Expected-but-unwanted input is not a fault.** Oversize bodies, missing CORS, and unsupported content types are normal third-party behaviour. They produce deterministic HTTP statuses and (for the size cap and network failures) `warning`-level Sentry signal — not exceptions that page on-call.
- **Ship dark, enable deliberately.** Turning the proxy on reroutes every metadata/image request through one function and changes the failure surface; it stays behind `NEXT_PUBLIC_METADATA_ENABLED` so it can be validated on preview and enabled per-deployment, with the limit tunable via env before launch.

Alternatives considered:

- **Keep direct browser fetching (the current disabled-state behaviour).** Zero infra. Rejected as the long-term posture: it cannot fix the privacy leak, the CORS failures, or untrusted-SVG execution, and gives no resource bound — exactly the four problems above.
- **Use a third-party image proxy / CDN (imgix, weserv, Cloudflare Images).** Offloads bytes and resizing. Rejected: it adds a vendor dependency and cost, still requires an SSRF-safe fetch of arbitrary on-chain URIs (the CDN would fetch whatever we point it at), and gives us no control over the JSON path or the content-type/sandbox policy.
- **Use Next.js built-in image optimization (`next/image` loader).** Native. Rejected: it's designed for a known allow-list of image domains, not arbitrary user-supplied hosts, and does not cover the JSON-metadata path at all.
- **Validate only the initial hostname, then let `fetch` follow redirects.** Simplest proxy. Rejected: it reopens the SSRF hole — a public host can `302` to `169.254.169.254` (cloud metadata) or an internal address. The proxy instead follows redirects manually with per-hop re-validation.
- **Trust `Content-Length` alone for the size cap.** Cheap. Rejected: a hostile or sloppy upstream can omit or understate it, so the cap is also enforced on the actual streamed byte count and on the decode path.
- **Enable the proxy by default once merged.** Rejected: enabling reroutes all metadata/image traffic through one function and changes the failure modes site-wide; a flag lets us validate on preview and roll out per-deployment.

## What Changes

The metadata proxy comprises a Next.js route, a `feature/` library of SSRF-safe fetch primitives, and a client URI rewriter, all gated by one flag:

- **Route — `app/api/metadata/proxy/route.ts`.** A `force-dynamic` `GET` that returns `404` when `NEXT_PUBLIC_METADATA_ENABLED !== 'true'`, parses the `uri` query param, rejects non-HTTP protocols, and delegates to `fetchResource`. It maps any thrown `StatusError` to a canonical status body (`STATUS_MESSAGES`), attaches hardening headers, and strips `Content-Length` so the response stays CORS-simple while passing through `cache-control` / `content-type` / `etag`.
- **SSRF-safe fetch — `feature/fetch-resource.ts` + `feature/ip.ts`.** Each hop resolves DNS once, validates every returned address against private IPv4/IPv6 ranges (and localhost), and replays those pinned addresses to undici so the kernel never re-resolves — closing the DNS-rebinding TOCTOU window. Redirects are followed manually up to `MAX_REDIRECTS` (3) with per-hop re-validation and loop detection.
- **Resource limits — `feature/read-body-with-limit.ts` + `route.ts` config.** A per-request byte cap (default 10 MB, override `NEXT_PUBLIC_METADATA_MAX_CONTENT_SIZE`) is enforced at the `Content-Length` pre-check, mid-stream, on `fetch()` rejection, and at decode. A request timeout (default 10 s, override `NEXT_PUBLIC_METADATA_TIMEOUT`) bounds each hop.
- **Content policy — `feature/processors.ts`.** Only `application/json`, `text/plain` (parsed as JSON), and `image/*` are served; anything else is `415`. Malformed JSON is `415`, not `500`.
- **Response hardening — `route.ts`.** A `Content-Security-Policy: sandbox; default-src 'none'; …` plus `X-Content-Type-Options: nosniff` prevents proxied SVG/HTML from executing if the proxy URL is opened directly.
- **Observability.** The size-cap paths and the network-failure path emit `Logger.warn(..., { sentry: true, sentryExtras })` with `host`/`maxSize` context; SSRF blocks, redirect anomalies, and non-2xx upstreams are logged.
- **Client gate — `app/features/metadata/utils.ts`.** `getProxiedUri` rewrites `http(s)` URIs to the proxy path when the flag is on and passes everything through unchanged when off, so consumers (`NFTArt`, `AccountHeader`, `OwnedTokensCard`, `CompressedNftCard`, `ProgramHeader`, `useOffChainMetadata`, the receipt page, `entities/nft`) need no per-call-site change to switch modes.

## Impact

- **Runtime surface.** With the flag **off** (current default), behaviour is unchanged — URIs are fetched directly by the browser and the route 404s. With the flag **on**, every metadata/image request routes through `/api/metadata/proxy`, gaining the privacy/CORS/size/sandbox guarantees and the proxy's failure modes (`403` SSRF block, `413` oversize, `415` unsupported type, `502` bad gateway, `504` timeout).
- **Configuration.** `NEXT_PUBLIC_METADATA_ENABLED` (master switch), `NEXT_PUBLIC_METADATA_MAX_CONTENT_SIZE` (cap, default 10 MB), `NEXT_PUBLIC_METADATA_TIMEOUT` (default 10 s), `NEXT_PUBLIC_METADATA_USER_AGENT` (default `Solana Explorer`).
- **Accepted risk (Vercel buffered-response cap).** Vercel Functions cap buffered response bodies at ~4.5 MB (`FUNCTION_RESPONSE_PAYLOAD_TOO_LARGE`); on Vercel, image responses above that are rejected at the platform layer regardless of `MAX_SIZE`, so the 10 MB default mainly benefits the JSON path and non-Vercel hosts.
- **Accepted risk (centralized load & egress).** Enabling concentrates all metadata/image fetching on one function and shifts egress from the viewer to our infrastructure; this is the deliberate trade for the privacy and safety guarantees, and is why rollout is flag-gated.
- **Tests.** `app/api/metadata/proxy/__tests__/` covers the SSRF/private-IP matrix, redirect handling, size-cap paths (incl. Sentry assertions), content-type routing, and the route endpoint; an integration spec exercises the real undici streaming path.
