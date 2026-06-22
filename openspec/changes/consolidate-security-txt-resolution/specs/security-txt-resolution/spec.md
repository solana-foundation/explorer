# security-txt-resolution

## Purpose

One resolver for a program's security.txt — PMP `security` seed (canonical-only) then legacy Neodyme ELF — via `@solana/security-txt`. Known clusters resolve server-side behind a cached endpoint; custom/localhost resolve in the browser via the same function, lazily loaded.

## ADDED Requirements

### Requirement: security.txt resolves via `@solana/security-txt`, canonical-only

security.txt SHALL be resolved by `@solana/security-txt`'s `fetchSecurityTxt` — PMP `security` seed first, then the legacy Neodyme ELF format — not a hand-rolled parser. The PMP leg MUST pass `authority: null` (canonical only; no fndn fallback, even if the package's fallback list becomes non-empty). Known clusters resolve via `GET /api/security-txt`; custom/localhost resolve client-side via the same function behind a dynamic `import()`. When neither source is present the route MUST return `200` with a null result (never cached as an error).

#### Scenario: PMP present

- **WHEN** a program publishes a PMP `security`-seed security.txt
- **THEN** the result MUST have `type: 'pmp'` with its parsed fields

#### Scenario: Neodyme ELF fallback

- **WHEN** there is no PMP security.txt but the program binary embeds a Neodyme one
- **THEN** the result MUST have `type: 'elf'` with its parsed fields

#### Scenario: None published

- **WHEN** neither source is present
- **THEN** the route MUST return `200` with a null result

### Requirement: RPC-error policy never caches a false-negative

The route MUST share `/api/idl-latest`'s error policy: a transient RPC error (`isTransientRpcError`) returns a retryable, uncached `502` without paging Sentry; any other error returns a `502` with a Sentry page. An absent or unparseable security.txt is a value (not a throw) and returns a cacheable `200`, so a false-negative is never cached.

#### Scenario: Transient upstream error

- **WHEN** the resolver throws a transient RPC error
- **THEN** the route MUST respond `502` with no success caching, log a warning, and MUST NOT page Sentry

#### Scenario: Misconfiguration

- **WHEN** the resolver throws a non-transient error
- **THEN** the route MUST respond `502` and page Sentry
