# Proposal: Vendor SNS name derivation instead of depending on `@bonfida/spl-name-service`

## Context

Explorer resolves `.sol` domains through `@bonfida/spl-name-service` 0.1.30, but uses only three of its exports:

- `getHashedName(name)` — SHA-256 over `"SPL Name Service" + name`
- `getNameAccountKey(hashedName, nameClass, nameParent)` — a 3-seed program-derived address
- `NameRegistryState` — a 96-byte header of three raw pubkeys, of which only `owner` is read

That surface is ~40 lines of logic. The package it arrives in pulls `ethers` (used solely for its `sha256`), `bn.js`, `borsh`, `@solana/web3.js`, and `@solana/spl-token`.

The dependency became actively harmful while removing Explorer's direct `@solana/spl-token` 0.1.8 dependency (kit-migration task 0.2). `@bonfida/spl-name-service` declares `@solana/spl-token` as a **peer**, satisfied by our direct 0.1.8 pin. Dropping that pin let the peer re-resolve to 0.4.14, which drags in `@solana/spl-token-group` and `@solana/spl-token-metadata`. Because `app/features/search/model/domain-search-provider.ts` reaches `resolve-domain.ts` through the `@entities/domain` barrel, all of it lands in a **client** chunk: measured clean builds went from 8644 KB to 8844 KB of client JS, a 200 KB regression on a PR whose entire purpose was removing a dependency.

## Why

The functionality is small, frozen, and fully specified by on-chain behavior. Reimplementing it against `@solana/kit` codecs removes a transitive dependency cluster that costs far more than the code it supplies, and it removes the peer-resolution coupling that made an unrelated dependency removal regress the bundle.

Correctness is pinned by equivalence testing against the SDK being replaced: hashing, PDA derivation, and registry decoding were compared across six name vectors (including a unicode and an empty label) plus a registry account with trailing data. `app/entities/domain/lib/__tests__/sns-name-service.spec.ts` keeps those derived addresses as literal vectors, so a future change to the derivation fails loudly without needing the SDK present.

Alternatives considered:

- **Keep the SDK and stop the barrel leak** (move `ResolvedDomainInfoSchema` to a leaf module so the client stops importing `resolve-domain.ts`) — rejected as the primary fix: it hides ~200 KB from the client bundle but keeps `ethers`, `borsh`, `bn.js`, and a second `@solana/spl-token` major in the server graph and the lockfile, and leaves the peer coupling in place to resurface at the next dependency change.
- **Pin the peer back to 0.1.8 with a pnpm override** — attempted and rejected: `@solana/spl-token` is a peer of `@bonfida/spl-name-service`, and a scoped `"@bonfida/spl-name-service>@solana/spl-token"` override does not bind it (verified: resolution stayed at 0.4.14). It would also preserve the dependency this migration exists to delete.
- **Adopt the official kit-native SNS SDK, `@solana-name-service/sns-sdk-kit`** (1.0.1, the successor to `@bonfida/spl-name-service`) — rejected on footprint, not availability. It declares a peer of `@solana/kit` `^6.9.0` while this repo is on 6.5.0, so adopting it forces a kit bump as a prerequisite. It also depends on `@solana-program/token` `^0.14.0` against our 0.13.0 — a second major of a package we already ship — plus `borsh` 2, `@scure/base`, `punycode`, and `ipaddr.js`. It is a full-surface SDK (~95 exports covering registration, records, Pyth feeds, and the Metaplex tokenizer) and Explorer needs three primitives from it. Worth revisiting when Explorer moves to kit ≥ 6.9 and `@solana-program/token` 0.14, at which point the calculus changes; it is recorded in the migration plan as the follow-up to reconsider.
- **Also drop `borsh` in the same change** — rejected: `@onsol/tldparser` (the ANS path, still in use) needs the 0.x `deserializeUnchecked` API, and our direct `borsh: 0.7.0` pin is what holds its transitive resolution there. Removing the pin silently re-resolved tldparser to borsh 2.0.0 and broke ANS resolution. The pin stays; untangling it belongs to plan task 0.5.

## What Changes

- **New** `app/entities/domain/lib/sns-name-service.ts` — `getHashedName` (`@noble/hashes/sha256`, already a dependency), `getNameAccountKey` (kit `getProgramDerivedAddress`), and `decodeNameRegistryOwner` (kit `getStructDecoder` over three `getAddressDecoder()` fields, fixed size 96, ignoring trailing account data).
- `app/entities/domain/api/constants.ts` — `SOL_TLD_AUTHORITY` becomes a kit `Address`; adds `NAME_PROGRAM_ADDRESS`.
- `app/entities/domain/api/{resolve-domain,fetch-sns-domains}.ts` — call the local module; the derived key is already a base58 `Address`, so `.toBase58()` / `.toString()` conversions drop out.
- `resolve-domain.ts` no longer imports `borsh`; a registry account shorter than the 96-byte header now resolves to `null` rather than throwing an uncaught deserialization error out of the API route.
- `__tests__/fetch-sns-domains.test.ts` drops its `vi.mock('@bonfida/spl-name-service', …)`; the real derivation is now cheap and dependency-free, so the test exercises it.
- `@bonfida/spl-name-service` removed from `package.json`.

## Impact

- **Bundle:** client JS 8644 KB → 8244 KB against the pre-change baseline (measured with clean builds), i.e. 400 KB lighter rather than 200 KB heavier.
- **Dependencies removed:** `@bonfida/spl-name-service`, and transitively `ethers` and `bn.js` from this path. `@solana/spl-token` no longer reaches the client through the domain entity.
- **Behavior:** `.sol` resolution output is unchanged for all valid accounts. The one deliberate difference is the short-account guard described above. `registry.owner ? … : null` is preserved as-is — it is effectively always truthy in both the old and new code, and a zeroed owner still yields the system-program address rather than `null`; changing that would be a separate behavior decision.
- **Revisit trigger:** if Explorer moves to `@solana/kit` ≥ 6.9 and `@solana-program/token` 0.14, re-evaluate `@solana-name-service/sns-sdk-kit` against this vendored module. The module is small and its behavior is pinned by vectors, so swapping later is cheap.
- **Not addressed:** `resolve-domain.ts` still uses a web3.js `Connection` for `getAccountInfo`, which kit-migration task 1.8 owns. The `@entities/domain` barrel still exports `resolveDomain`, so the client still imports a module that transitively imports web3.js — smaller now, but the leak itself is unchanged.
- **Risk:** the derivation is frozen on-chain behavior, and vectors are locked in tests. The realistic failure mode is a future edit to the codec silently changing derivation, which the vector tests catch.
