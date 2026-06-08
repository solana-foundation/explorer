# Tasks

> The shared guard (`getSafeExternalHref`, `app/shared/lib/url.ts`) and the `ExternalLink` component (`app/components/shared/ui/external-link.tsx`) ship with `add-metadata-proxy`. This change only migrates the remaining sinks onto them — so its own tasks (sections 1–4) are intentionally not started here; they land after that PR merges.

## 0. Foundation (already shipped with `add-metadata-proxy`, #1050)

- [x] `getSafeExternalHref` / `parseUrl` (`app/shared/lib/url.ts`) — `new URL` parse + absolute-http(s)-only check; unit-tested.
- [x] `ExternalLink` (`app/components/shared/ui/external-link.tsx`) — safe-by-default anchor that owns `rel="noopener noreferrer"` + `target="_blank"` and renders nothing for an unsafe href.
- [x] `ExternalResourceLink` composes `ExternalLink`, and `getProxiedUri` routes through the shared guard.

## 1. Migrate clearly on-chain sinks to `ExternalLink`

- [ ] `app/components/account/CompressedNftCard.tsx` — `content.links.external_url`
- [ ] `app/components/account/TokenAccountSection.tsx` — `extensions.website`
- [ ] `app/components/account/TokenAccountSection.tsx` — `extensions.bridgeContract` (×2; the missing `noopener` comes for free)
- [ ] `app/components/account/TokenAccountSection.tsx` — `nftData.json.external_url`
- [ ] `app/components/account/TokenAccountSection.tsx` — `extension.uri`
- [ ] `app/components/account/ConfigAccountSection.tsx` — `configData.website`
- [ ] `app/components/account/TokenExtensionsSection.tsx` — `link.url`
- [ ] `app/features/security-txt/ui/common.tsx` — website field and `url` (leave the `mailto:`/`t.me/`/`twitter.com/` template links as-is)
- [ ] `app/components/account/VerifiedBuildCard.tsx` — metadata `value` link

## 2. Provenance audit (migrate only if untrusted)

- [ ] `app/features/token-verification-badge/ui/TokenVerificationContent.tsx` — `source.url`, `source.applyUrl`
- [ ] `app/features/feature-gate/ui/*` and `app/components/account/FeatureAccountSection.tsx` — `simd_link`
- [ ] `app/components/DeveloperResources.tsx` and `app/entities/cluster/ui/ExplorerLink.tsx` — `link`

## 3. De-duplicate the server-side copy

- [ ] `app/api/metadata/proxy/route.ts` — replace the local `parseUrl` + `isHTTPProtocol` with the shared `parseUrl` / `SAFE_EXTERNAL_PROTOCOLS`, keeping a thin wrapper for the invalid-URL `Logger.error`. No behaviour change (the route already rejects non-http(s)).

## 4. Verify

- [ ] `pnpm typecheck`, targeted tests asserting unsafe schemes render no anchor, and `pnpm openspec:validate` pass.
