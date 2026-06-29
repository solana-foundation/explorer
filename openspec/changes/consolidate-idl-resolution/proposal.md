# Proposal: Consolidate program IDL resolution on `@solana/idl`

## Why

IDL resolution was scattered: multiple uncached per-card client fetches plus overlapping server routes (`/api/anchor`, `/api/program-metadata-idl`) with hand-rolled borsh/zlib decode, recency, and error classification. `@solana/idl` — the Foundation's resolver — already does all of that (Anchor PDA, PMP canonical → fndn-fallback authorities, format decode, RPC-error classification) via `fetchLatestIdls`. Maintaining a parallel implementation is pure liability.

Headline win: native/builtin programs (Stake, ALT, Config, …) now surface Foundation-published IDLs via the fndn fallback authority, behind one CDN-cached endpoint shared by every IDL consumer.

### Alternatives considered

- **Status quo** (per-card web3.js `Program.fetchIdl` + separate PMP/Codama fetches + client recency) — N uncached round trips, no native coverage, web3.js on a hot path we're leaving.
- **Hand-roll on low-level `fetchAnchorIdl`/`fetchPmpIdl`** — ~2× the code re-implementing `fetchLatestIdls`, and its per-source isolation diverged from the package's deliberate `Promise.all` ("a PMP outage rejects the whole call rather than silently returning Anchor-only").
- **`fetchLatestIdls` verbatim** — adopted at the core, but the explorer also needs a CDN cache, the PMP gate, native-program resilience, and a transient-vs-page Sentry policy. Thin edges, not a re-implementation.
- **Per-source URL flags (`pmp=0`/`anchor=0`)** — the `pmp` flag was the feature gate in disguise; moving it server-side lets every consumer share one cached entry.
- **Resolve everything client-side** — pulls `@solana/idl` (~40 KB gzip, measured across `/address/*` and `/tx/*`) into the bundle. Known clusters resolve server-side; only custom/localhost resolve client-side via a dynamic `import()`.
- **Keep the `codama:idl` seed + "Codama" tab** — Codama is a *format*, not a *source*; PMP `idl` content can be Codama. Format detection stays client-side.

## What Changes

- **One endpoint `GET /api/idl-latest`**, backed by shared `resolveProgramIdls` (`app/entities/idl/api/resolve-program-idls.ts`): `fetchLatestIdls` for both sources, `fetchAnchorIdl`/`fetchPmpIdl` single-source, `parseIdl` to parse. Payload `{ idls: { anchor, programMetadata, preferred } }`.
- **security.txt** is owned by the separate `consolidate-security-txt-resolution` change (which reworks `/api/security-txt` onto `@solana/security-txt`) — not specified here.
- **New `useProgramIdls` hook** replaces the per-card fetches; custom/localhost resolve client-side via `resolveProgramIdlsClient` (dynamic `import()`). Two tabs, PMP-first default.
- **PMP feature gate moves server-side** (`NEXT_PUBLIC_PMP_IDL_ENABLED`); `pmp`/`anchor` URL flags removed.
- **Native programs skip the Anchor PDA lookup** (`NON_ANCHOR_PROGRAMS`).
- **Removed:** `/api/anchor`, `/api/program-metadata-idl`, `getProgramCanonicalMetadata`, `use-program-canonical-metadata`, `use-idl-last-transaction-date`, the `codama:idl` fetch + Codama tab, hand-rolled decode + `classifySolanaError`; `program-metadata`'s bespoke client `resolve-pmp-content-client` (the program-name label now reads the shared resolver) and the duplicated per-hook `/api/idl-latest` fetches (one shared `fetchProgramIdls`).
- **Deps:** `@solana/idl` 0.1.1→0.2.0, `@solana-program/program-metadata` 0.5.1→0.7.0; `shouldUseDirectRpc` shared to `program-metadata` via the first FSD `@x` cross-entity API; the `idl` entity likewise exposes its resolvers to `program-metadata` via `@x`, so the card, the inspector, and the program-name label read one resolution.

**Out of scope:** further resolver thinning as `@solana/idl` grows.

## Impact

- **Wins:** native programs surface Foundation IDLs; one cached endpoint serves the card, the inspector, and the program-name label; transient RPC errors no longer page Sentry for builtins.
- **Accepted behaviour changes:** default tab is PMP-first (not write-recency); a transient blip on one source of a dual-IDL program fails the card (retryable) instead of showing the survivor — matches `fetchLatestIdls`'s `Promise.all`; native programs are single-fetch and unaffected.
- **Feature flag:** `NEXT_PUBLIC_PMP_IDL_ENABLED` gates PMP IDLs server- and client-side; off ⇒ Anchor only.
