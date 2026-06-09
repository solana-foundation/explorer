# Proposal: Resolve ipfs:// URIs to an HTTP gateway for NFT images and metadata

## Context

- The Explorer renders NFT artwork and off-chain metadata from URIs stored on-chain. A significant portion of these URIs use the `ipfs://` scheme (e.g. `ipfs://QmWATWQ7fVPP2EFGu71UkfnqhYXDYH566qy47CnJDgvs8u`). Modern browsers do not natively resolve `ipfs://` — the URI produces a network error, rendering a broken image or missing metadata card.
- The metadata proxy (`app/api/metadata/proxy/`) only fetches `http(s)` targets. An `ipfs://` URI passed through `getProxiedUri` unchanged reaches neither the proxy (which rejects non-HTTP protocols) nor the browser (which can't resolve it). The result is a silent, total failure for every IPFS-hosted asset.
- This is a pre-proxy resolution step: it rewrites the URI before it enters the existing proxy/passthrough path, so the proxy and non-proxy code paths both receive a fetchable HTTP URL.

## Why

We need IPFS content to render out-of-the-box without requiring user action or extra infrastructure.

Alternatives considered:

- **Do nothing (status quo).** Every `ipfs://` URI silently fails. Rejected: broken images and missing metadata are a visible degradation that affects a meaningful share of NFT assets.
- **Require an IPFS browser extension (e.g. IPFS Companion).** Zero infra. Rejected: it shifts the burden to every viewer, adds friction for casual users, and leaves the problem unsolved for anyone who hasn't installed the extension.
- **Run a dedicated IPFS gateway or node.** Full control over resolution. Rejected: significant infrastructure and maintenance overhead for a read-only use case that public gateways already serve reliably at scale.
- **Rewrite to a public HTTP gateway (`ipfs.io`).** Chosen. The rewrite happens inside `getProxiedUri` before the proxy/passthrough decision, so the rest of the pipeline sees an ordinary `https://` URL. The public gateway is free, widely used, and requires no infra. The trade-off — a runtime dependency on a third-party service — is acceptable because the alternative (the current state) is 100% failure.

## What Changes

- **URI rewriting — `app/features/metadata/utils.ts`.** `getProxiedUri` now detects the `ipfs:` protocol, delegates to a `resolveIpfsUri` helper that strips any redundant `ipfs/` path prefix (some on-chain URIs encode `ipfs://ipfs/<cid>`), splits the CID from any subpath (e.g. `ipfs://QmXXX/image.png` → CID `QmXXX`, subpath `/image.png`), and rewrites the URI to `https://ipfs.io/ipfs/<cid><subpath>`. The rewritten URI then flows through the existing proxy-or-passthrough logic unchanged.
- **CID validation — `resolveIpfsUri` + `multiformats`.** Before rewriting, the CID is parsed with `CID.parse()` from the `multiformats` package. Malformed CIDs return `''` (logged via `Logger.warn`) rather than producing a gateway request that will 400 — this avoids polluting the gateway with known-bad requests and gives callers a clean empty-string signal.
- **Dependency — `multiformats@13.4.2`.** Pinned (no `^`) to avoid silent major bumps. Used only for `CID.parse()` — a single, well-scoped import.
- **Tests — `app/features/metadata/__tests__/utils.spec.ts`.** Tests cover CIDv0 and CIDv1 URIs (with and without `ipfs/` prefix, with and without proxy enabled), URIs with subpaths (e.g. `ipfs://QmXXX/image.png`, `ipfs://QmXXX/metadata/0.json`), and the malformed-CID rejection path.

## Impact

- **Runtime behaviour.** `ipfs://` URIs that previously produced broken images now resolve to the `ipfs.io` gateway and render correctly — both with the metadata proxy enabled and disabled. Non-IPFS URIs are unaffected.
- **Contributors.** Future changes to `getProxiedUri` or the metadata proxy should be aware of this pre-proxy resolution step. The helper is co-located and short.
- **Accepted risk (gateway dependency).** We depend on `https://ipfs.io` being available. If it goes down or rate-limits, IPFS assets fail to load — but this is strictly better than the current state (100% failure) and no worse than the browser extension alternative (which also depends on a gateway). If a self-hosted or alternative gateway is needed later, the change is a one-line constant swap.
- **Accepted risk (CID validation scope).** `CID.parse()` validates structural well-formedness, not that the CID actually resolves to content. A structurally valid but non-existent CID produces a gateway 404 — same as any other dead link, handled by the existing `ProxiedImage` fallback.
