## ADDED Requirements

### Requirement: getProxiedUri SHALL rewrite ipfs:// URIs to an HTTP gateway URL before proxying or passthrough

When `getProxiedUri` receives a URI with the `ipfs:` protocol, it SHALL rewrite it to `https://ipfs.io/ipfs/<cid><subpath>` — stripping any redundant `ipfs/` path prefix, splitting the CID from any subpath, and preserving the subpath in the gateway URL — and then route the rewritten URI through the existing proxy-or-passthrough logic. The rewrite is a pre-proxy resolution step; callers and downstream code see an ordinary `https://` URL.

#### Scenario: ipfs:// URI with a valid CIDv0 and proxy disabled

- **WHEN** `getProxiedUri` receives `ipfs://<valid-CIDv0>` and `NEXT_PUBLIC_METADATA_ENABLED` is not `'true'`
- **THEN** it SHALL return `https://ipfs.io/ipfs/<valid-CIDv0>`

#### Scenario: ipfs:// URI with a valid CIDv1 and proxy enabled

- **WHEN** `getProxiedUri` receives `ipfs://<valid-CIDv1>` and `NEXT_PUBLIC_METADATA_ENABLED` is `'true'`
- **THEN** it SHALL return the proxy path `/api/metadata/proxy?uri=<encoded-gateway-url>`

#### Scenario: ipfs:// URI with redundant ipfs/ path prefix

- **WHEN** `getProxiedUri` receives `ipfs://ipfs/<valid-CID>`
- **THEN** it SHALL strip the redundant `ipfs/` prefix and rewrite to `https://ipfs.io/ipfs/<valid-CID>`

#### Scenario: ipfs:// URI with a subpath

- **WHEN** `getProxiedUri` receives `ipfs://<valid-CID>/image.png`
- **THEN** it SHALL validate only the CID portion and preserve the subpath, returning `https://ipfs.io/ipfs/<valid-CID>/image.png`

### Requirement: resolveIpfsUri SHALL validate the CID with multiformats before constructing the gateway URL

The CID extracted from an `ipfs://` URI SHALL be parsed with `CID.parse()` from the `multiformats` package. If parsing fails, `resolveIpfsUri` SHALL return an empty string and log a warning via `Logger.warn`, rather than constructing a gateway URL with a malformed CID.

#### Scenario: Malformed CID in an ipfs:// URI

- **WHEN** `getProxiedUri` receives `ipfs://not-a-valid-cid`
- **THEN** it SHALL return an empty string
- **AND** SHALL log a warning identifying the malformed CID
