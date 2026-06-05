# Proposal: Scheme-guard every external link sourced from on-chain data

## Context

- The Explorer renders many third-party URLs that originate **on-chain** — i.e. supplied by arbitrary token/program/NFT authors — directly into anchor `href`s. A browser runs a `javascript:` (or `data:`/`vbscript:`) URL placed in an `href` when the link is clicked; `rel="noopener noreferrer"` and `target="_blank"` only affect the opened window's context, not whether the scheme executes. So any of these sinks is a stored-XSS vector in the Explorer origin.
- The `add-metadata-proxy` change introduced the first guarded sink and, with it, the reusable building blocks this follow-up depends on:
    - `getSafeExternalHref` / `parseUrl` (`app/shared/lib/url.ts`) — parses with `new URL` and accepts only absolute `http:`/`https:` URLs (the same normalisation the browser applies, so embedded tabs/newlines and case tricks are caught). Unit-tested.
    - `ExternalLink` (`app/components/shared/ui/external-link.tsx`) — a safe-by-default anchor that applies the guard and owns `target="_blank"` + `rel="noopener noreferrer"` (those attributes are omitted from its props type, so a call site cannot drop them) and renders nothing for an unsafe href. `ExternalResourceLink` already composes it; `getProxiedUri` routes through the helper.
- So the primitive **and** the component exist; what remains is that **other** sinks still render on-chain URLs through raw `<a>` tags. Audit of `href={…}` surfaced these unguarded, clearly on-chain-sourced sinks:
    - `app/components/account/CompressedNftCard.tsx` — `content.links.external_url`
    - `app/components/account/TokenAccountSection.tsx` — `extensions.website`, `extensions.bridgeContract` (×2; one also uses `rel="noreferrer"` without `noopener`), `nftData.json.external_url`, `extension.uri`
    - `app/components/account/ConfigAccountSection.tsx` — `configData.website`
    - `app/components/account/TokenExtensionsSection.tsx` — `link.url`
    - `app/features/security-txt/ui/common.tsx` — the website field and `url`
    - `app/components/account/VerifiedBuildCard.tsx` — a metadata `value` rendered as a link
- A handful of other dynamic `href`s (token-verification-badge `source.url`, feature-gate `simd_link`, `DeveloperResources`, `ExplorerLink`) need provenance checked before deciding whether they are untrusted; the template-prefixed `mailto:`/`t.me/`/`twitter.com/` links in `security-txt/ui/common.tsx` hardcode the scheme and are lower risk.
- The proxy route `app/api/metadata/proxy/route.ts` also carries its own private `parseUrl` plus an `isHTTPProtocol` check — a third copy of the same parse-and-check-scheme logic now centralised in `app/shared/lib/url.ts`. The route is already safe (it rejects non-http(s)), so this is a de-duplication tidy-up rather than a fix.

## Why

The metadata-proxy PR is intentionally scoped to enabling the proxy, so it fixes only its own sink while shipping the reusable guard and component. Hardening the rest is a cross-cutting UI-security sweep that touches several unrelated features (token accounts, config accounts, security.txt, verified builds) and is better reviewed on its own.

With `ExternalLink` already in place, the design decision is settled: untrusted external links render through that one component rather than each site re-deriving the guard and the `rel`/`target` attributes. This change is therefore mechanical per sink — replace the raw `<a>` with `ExternalLink` and let it decide whether to render — and the only judgement left is provenance: which of the ambiguous sinks are actually fed by untrusted data.

## What Changes

- Migrate the on-chain-sourced sinks enumerated in Context from raw `<a>` to `ExternalLink` (`@shared/ui/external-link`), which omits the link when the URL is not safe http(s).
- Audit the provenance of the ambiguous sinks (verification sources, feature-gate links, developer resources, explorer link) and migrate those fed by untrusted data; leave constant/template-scheme links as-is.
- Where a sink renders inside a table cell or needs specific markup that `ExternalLink`'s passthrough props don't cover, adapt the call site rather than widen the component.
- Consolidate `route.ts`'s local `parseUrl`/`isHTTPProtocol` onto the shared `app/shared/lib/url.ts`, keeping a thin wrapper so the existing invalid-URL `Logger.error` is preserved. Behaviour-preserving.
- Add/extend tests asserting `javascript:`/`data:` values produce no anchor at the migrated sinks.
- No change to `app/shared/lib/url.ts`, `ExternalLink`, `ExternalResourceLink`, or `getProxiedUri` — those land with `add-metadata-proxy`.

## Impact

- **Files** — edits to `CompressedNftCard`, `TokenAccountSection`, `ConfigAccountSection`, `TokenExtensionsSection`, `VerifiedBuildCard`, and `security-txt/ui/common.tsx`; possible edits to the ambiguous sinks pending the provenance audit. No new shared code (the component and helper already exist).
- **Behaviour** — links with non-http(s) schemes stop rendering as clickable anchors (today they render and are an XSS risk). Valid http(s) links are unchanged. The two `bridgeContract` anchors gain `noopener`.
- **Security** — closes the residual stored-XSS class left after the metadata-proxy PR; `ExternalLink` becomes the single, hard-to-skip rendering path for untrusted external links.
- **Dependency** — builds on the `getSafeExternalHref` helper and `ExternalLink` component shipped by `add-metadata-proxy`; this change should land after that PR merges.
