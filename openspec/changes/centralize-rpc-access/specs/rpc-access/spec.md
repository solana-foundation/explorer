# rpc-access

## Purpose

One blessed way to obtain a `@solana/kit` rpc client for a cluster URL, owned by the cluster entity, so clients are shared per endpoint and referentially stable.

## ADDED Requirements

### Requirement: The cluster entity owns rpc client construction

App code that needs a kit rpc client SHALL obtain it from the cluster entity's accessor — `useSolanaRpc()` in React components and hooks, `getRpc(url)` elsewhere — rather than calling `createSolanaRpc` directly. Pre-existing direct `createSolanaRpc` call sites migrate onto the accessor as their owning features are migrated off web3.js.

#### Scenario: A React component needs the active cluster's rpc

- **WHEN** a component inside `ClusterProvider` needs an rpc client for the active cluster
- **THEN** it obtains one from `useSolanaRpc()`

#### Scenario: Non-React code needs an rpc for a known URL

- **WHEN** code outside the React tree holds a cluster URL and needs an rpc client
- **THEN** it obtains one from `getRpc(url)`

### Requirement: Clients are memoized per URL

`getRpc` MUST return the same client instance for repeated calls with the same URL, and distinct instances for distinct URLs. The returned identity MUST be stable enough to appear in a React hook dependency array without re-firing effects across renders for an unchanged URL.

#### Scenario: Repeated calls with one URL

- **WHEN** `getRpc` is called twice with the same URL
- **THEN** both calls return the same client instance

#### Scenario: Two different endpoints

- **WHEN** `getRpc` is called with two different URLs
- **THEN** it returns two distinct client instances
