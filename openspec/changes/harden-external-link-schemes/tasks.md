# Tasks

> The shared guard (`getSafeExternalHref`, `app/shared/lib/url.ts`) and the `ExternalLink` component (`app/components/shared/ui/external-link.tsx`) ship with `add-metadata-proxy`. Sections 1-3 landed in #1210 (`beb830a29`). The one exception is the feature-gate page sink in section 2, which landed with the archive of this change.

## 0. Foundation (already shipped with `add-metadata-proxy`, #1050)

- [x] `getSafeExternalHref` / `parseUrl` (`app/shared/lib/url.ts`) — `new URL` parse + absolute-http(s)-only check; unit-tested.
- [x] `ExternalLink` (`app/components/shared/ui/external-link.tsx`) — safe-by-default anchor that owns `rel="noopener noreferrer"` + `target="_blank"` and renders nothing for an unsafe href.
- [x] `ExternalResourceLink` composes `ExternalLink`; `getProxiedUri` reuses the shared `parseUrl`/`SAFE_EXTERNAL_PROTOCOLS` primitives for its scheme check (it returns a proxied path, so it does not itself call `getSafeExternalHref`).

## 1. Migrate clearly on-chain sinks to `ExternalLink`

> **Naming collision:** `CompressedNftCard`, `TokenAccountSection`, `TokenExtensionsSection`, `VerifiedBuildCard`, and `security-txt/ui/common.tsx` already `import { ExternalLink } from 'react-feather'` (the trailing icon next to each link). Alias one side on import when migrating — e.g. `import { ExternalLink as ExternalLinkIcon } from 'react-feather'`, or import the shared component as `ExternalLink as SafeExternalLink` — otherwise the first edit hits a duplicate-identifier `SyntaxError`.

- [x] `app/components/account/CompressedNftCard.tsx` — `content.links.external_url`. Done in #1210.
- [x] `app/components/account/TokenAccountSection.tsx` — `extensions.website`. Done in #1210.
- [x] `app/components/account/TokenAccountSection.tsx` — `extensions.bridgeContract` (×2; the missing `noopener` comes for free). Done in #1210, together with `extensions.assetContract`.
- [x] `app/components/account/TokenAccountSection.tsx` — `nftData.json.external_url`. Done in #1210.
- [x] `app/components/account/TokenAccountSection.tsx` — `extension.uri`. Done in #1210.
- [x] `app/components/account/ConfigAccountSection.tsx` — `configData.website`. Done in #1210.
- [x] `app/components/account/TokenExtensionsSection.tsx` — `link.url`. Done in #1210.
- [x] `app/features/security-txt/ui/common.tsx` — website field and `url` (leave the `mailto:`/`t.me/`/`twitter.com/` template links as-is). Done in #1210. The `t.me/` and `twitter.com/` links also use `ExternalLink`, and `mailto:` keeps a raw anchor because `ExternalLink` allows only http(s).
- [x] `app/components/account/VerifiedBuildCard.tsx:211` — the `DisplayType.URL` metadata `value` anchor (currently gated by the file-local `isValidLink`, not the shared guard). Done in #1210: the `DisplayType.URL` case checks `getSafeExternalHref` and renders `ExternalLinkValue`, which delegates to `ExternalLink`.

## 2. Provenance audit (migrate only if untrusted)

- [x] `app/features/token-verification-badge/ui/TokenVerificationContent.tsx` — `source.url`, `source.applyUrl`. Migrated to `ExternalLink` in #1210.
- [x] `app/features/feature-gate/ui/*` and `app/components/account/FeatureAccountSection.tsx` — `simd_link`. Untrusted: it is ingested from the Agave feature-gate schedule. `SimdLinks` and `FeatureAccountSection` migrated in #1210. `ProposalUnavailable` in `app/address/[address]/feature-gate/page.tsx` (added by #1486) renders the same `simd_link` value and is migrated with the archive of this change.
- [x] `app/components/DeveloperResources.tsx` and `app/entities/cluster/ui/ExplorerLink.tsx` — `link`. Both trusted. `DeveloperResources` links are constants and use `ExternalLink` since #1210. `ExplorerLink` keeps its raw anchor: `buildExplorerLink` takes the origin from `EXPLORER_BASE_URL` and the path from the app, and a custom RPC URL goes only into the encoded query string.

## 3. De-duplicate the server-side copy

- [x] `app/api/metadata/proxy/route.ts` — replace the local `parseUrl` + `isHTTPProtocol` with the shared `parseUrl` / `SAFE_EXTERNAL_PROTOCOLS`, keeping a thin wrapper for the invalid-URL `Logger.error`. No behaviour change (the route already rejects non-http(s)). Done in #1210: the route's `parseUrl` is the thin wrapper over the shared `parseUrl`, and `isHTTPProtocol` (`feature/ip.ts`) checks `SAFE_EXTERNAL_PROTOCOLS`.

## 4. Verify

- [ ] `pnpm typecheck`, targeted tests asserting unsafe schemes render no anchor, and `pnpm openspec:validate` pass.
