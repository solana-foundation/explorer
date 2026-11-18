# Proposal: Consolidate security.txt resolution on `@solana/security-txt`

## Why

security.txt is resolved two ways today: the `/api/security-txt` route reads the PMP `security` seed (via `@solana/idl`'s `fetchPmpIdl`), and a hand-rolled parser (`fromProgramData.ts`) extracts the legacy Neodyme `=BEGIN SECURITY.TXT=` block from the program binary — merged by hand in `useSecurityTxt`. `@solana/security-txt` (the Foundation's resolver, sibling to `@solana/idl`) does both in one call — `fetchSecurityTxt`: PMP canonical → Neodyme ELF — returning a `{ type, fields }` discriminated result. Owning the parser is the same liability the IDL consolidation removed.

## What Changes

- **`/api/security-txt`** resolves via `fetchSecurityTxt(rpc, id, { authority: null })` — canonical-only PMP (no fndn fallback). Payload `{ securityTxt: { type, fields } | null }`.
- **Custom/localhost** resolve client-side via the same `fetchSecurityTxt`, lazily `import()`-ed so the package stays out of the known-cluster bundle.
- **Removed:** the hand-rolled `fromProgramData.ts` Neodyme parser and `isPmpSecurityTXT` (the package's `type` discriminates); the manual PMP+Neodyme merge in `useSecurityTxt`; the now-unused `SECURITY_TXT_SEED` constant (the package derives the PDA seed internally).
- **Shared:** the route resolves the `cluster` param via the cluster entity's `serverClusterUrlFromParam`, replacing its bespoke `getMetadataEndpointUrl` — so `/api/security-txt` and `/api/idl-latest` reject the same malformed inputs (e.g. `"01"`, `" 0 "`).
- **Dep:** add `@solana/security-txt` (+ `minimumReleaseAgeExclude`, like `@solana/idl`).

**Out of scope:** IDL-seed resolution (owned by the IDL consolidation).

## Impact

- Deletes the hand-rolled ELF parser; one Foundation-maintained resolver for both formats.
- The Neodyme/ELF leg now fetches the program executable via RPC (the package exports no pure parser) — server-side and CDN-cached, so amortized; previously it parsed already-loaded client data.
- Canonical-only is preserved by passing `authority: null` — the package's fallback list is empty today but reserved for future fndn/partner authorities.
