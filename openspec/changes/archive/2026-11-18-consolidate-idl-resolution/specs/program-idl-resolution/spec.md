# program-idl-resolution

## Purpose

One resolution layer for a program's on-chain IDLs (legacy Anchor account + PMP `idl` seed), backed by `@solana/idl`. Known clusters resolve server-side behind a CDN-cached endpoint; custom/localhost resolve in the browser via the same resolver, lazily loaded.

## ADDED Requirements

### Requirement: Single IDL-resolution endpoint backed by `@solana/idl`

Known-cluster IDL resolution SHALL go through `GET /api/idl-latest`, implemented by the shared `resolveProgramIdls` over `@solana/idl`. The route MUST validate `programAddress` and `cluster` (400 on missing/invalid), set CDN cache headers on a 200, and return `{ idls: { anchor, programMetadata, preferred } }` — each IDL parsed JSON, or omitted (`undefined`, never `null`) when absent. The IDL card, the inspector's `useAnchorProgram`, and the program-name label MUST consume this endpoint (or the client resolver below), not fetch IDL accounts themselves.

#### Scenario: Both IDLs present

- **WHEN** a program has an Anchor IDL and a PMP `idl` IDL and the PMP feature is enabled
- **THEN** the response MUST include both `idls.anchor` and `idls.programMetadata` as parsed JSON
- **AND** carry a `Cache-Control` header with `max-age`

#### Scenario: A source is absent

- **WHEN** a program has no Anchor IDL account
- **THEN** `idls.anchor` MUST be absent/`undefined` (never `null`)

### Requirement: PMP IDLs are gated server-side by the feature flag

The route SHALL include the PMP `idl` IDL only when `NEXT_PUBLIC_PMP_IDL_ENABLED` is enabled (read in the handler); there MUST be no `pmp`/`anchor` URL flag. Custom/localhost resolution applies the same gate.

#### Scenario: Feature flag off

- **WHEN** `NEXT_PUBLIC_PMP_IDL_ENABLED` is unset or disabled
- **THEN** the resolver MUST run with PMP off, and only an Anchor IDL can appear

#### Scenario: Feature flag on

- **WHEN** `NEXT_PUBLIC_PMP_IDL_ENABLED` is enabled
- **THEN** the resolver MUST resolve the PMP `idl` IDL (canonical, then fndn fallback authorities)

### Requirement: Native/builtin programs skip the Anchor PDA lookup

A program in `NON_ANCHOR_PROGRAMS` MUST NOT trigger an Anchor PDA lookup (it has no Anchor IDL, and some RPCs — e.g. SIMD-296 — return a transient error instead of `null` for the derived PDA). Its PMP IDL MUST still resolve.

#### Scenario: System program

- **WHEN** `/api/idl-latest` resolves a `NON_ANCHOR_PROGRAMS` address
- **THEN** no Anchor PDA lookup is performed
- **AND** its PMP IDL, if published, MUST still be returned

### Requirement: RPC-error policy never caches a false-negative

The route MUST return a retryable, uncached `502` on a transient RPC error (`isTransientRpcError`) without paging Sentry, and a `502` with a Sentry page on any other error. A genuine RPC failure MUST NOT be cached as "no IDLs"; absent IDLs (a value, not a throw) return a cacheable `200`.

#### Scenario: Transient upstream error

- **WHEN** the resolver throws a transient RPC error
- **THEN** the route MUST respond `502` with no success caching, log a warning, and MUST NOT page Sentry

#### Scenario: Misconfiguration

- **WHEN** the resolver throws a non-transient error
- **THEN** the route MUST respond `502` and page Sentry

#### Scenario: No IDL published

- **WHEN** both sources resolve as absent with no RPC error
- **THEN** the route MUST respond `200` with empty IDL slots and cache headers

### Requirement: The resolver does not validate IDL shape

Both sources MUST be parsed identically — to a JSON object or `undefined` — with no IDL-shape check beyond `parseIdl` (JSON-object-ness). It MUST NOT assert a top-level `instructions` array: PMP content may be Anchor-format or Codama (where `instructions` nest under `program`), so a single shape check would drop a valid format. Format detection is the client's job.

#### Scenario: Non-IDL-shaped JSON

- **WHEN** either source holds a valid JSON object lacking a top-level `instructions` array
- **THEN** that IDL MUST still be returned

### Requirement: Default tab is PMP-first

The first-shown tab SHALL be Program Metadata whenever a PMP IDL is present, and Anchor only when Anchor is the sole source. Resolution does not compute write recency.

#### Scenario: Both sources present

- **WHEN** both an Anchor and a PMP IDL resolve
- **THEN** `idls.preferred` MUST be `program-metadata`

#### Scenario: Anchor only

- **WHEN** only an Anchor IDL resolves
- **THEN** `idls.preferred` MUST be `anchor`

### Requirement: Custom and local-RPC endpoints resolve client-side

Resolution MUST happen in the browser, against the user-supplied RPC URL, exactly when the server can't reach the endpoint: the **Custom** cluster, or **any cluster whose RPC URL is `localhost`/`127.0.0.1`** (a known cluster pointed at a local validator). This is owned by `shouldUseDirectRpc`. All other clusters MUST resolve server-side and MUST NOT resolve in the browser. The client path uses the same `resolveProgramIdls`, reached only via a dynamic `import()` so `@solana/idl` stays out of the server-resolved bundle.

#### Scenario: Custom cluster

- **WHEN** the IDL card renders for the Custom cluster
- **THEN** it MUST resolve client-side against the user RPC URL and MUST NOT call `/api/idl-latest`

#### Scenario: Known cluster pointed at a local validator

- **WHEN** the cluster is known public but its RPC URL is `localhost`/`127.0.0.1`
- **THEN** resolution MUST happen client-side against that URL and MUST NOT call `/api/idl-latest`

#### Scenario: Known public cluster keeps the package out of the bundle

- **WHEN** the program page loads for a known public cluster on a non-local RPC URL
- **THEN** resolution MUST happen on the server route
- **AND** `@solana/idl` MUST reach client code only through the dynamic-import loader
