## RENAMED Requirements

- FROM: `### Requirement: getProxiedUri SHALL rewrite ipfs:// URIs to an HTTP gateway URL before proxying or passthrough`
- TO: `### Requirement: getProxiedUri SHALL rewrite a URI that contains a CID to IPFS_GATEWAY before proxying or passthrough`

## MODIFIED Requirements

### Requirement: getProxiedUri SHALL rewrite a URI that contains a CID to IPFS_GATEWAY before proxying or passthrough

`getProxiedUri` SHALL rewrite a URI that contains a CID to `<IPFS_GATEWAY>/<cid><subpath><query><fragment>`.

A URI contains a CID in one of four forms: `ipfs://<cid>`, `ipfs://ipfs/<cid>`, `https://<host>/ipfs/<cid>`, or `https://<cid>.ipfs.<host>`. `<host>` can be any host. `getTokenInfosFromMetaplex` SHALL apply the same rewrite before it calls `fetchResource`.

#### Scenario: ipfs:// URI with proxy disabled

- **WHEN** `getProxiedUri` receives `ipfs://ipfs/<valid-CID>/image.png` and `NEXT_PUBLIC_METADATA_ENABLED` is not `'true'`
- **THEN** it SHALL return `<IPFS_GATEWAY>/<valid-CID>/image.png`

#### Scenario: ipfs:// URI with proxy enabled

- **WHEN** `getProxiedUri` receives `ipfs://<valid-CID>` and `NEXT_PUBLIC_METADATA_ENABLED` is `'true'`
- **THEN** it SHALL return `/api/metadata/proxy?uri=<encoded-gateway-url>`

#### Scenario: /ipfs/ path on any host

- **WHEN** `getProxiedUri` receives `https://<any-host>/ipfs/<valid-CID>/meta.json`
- **THEN** it SHALL return `<IPFS_GATEWAY>/<valid-CID>/meta.json`

#### Scenario: CID in the host

- **WHEN** `getProxiedUri` receives `https://<valid-CIDv1>.ipfs.<any-host>/`
- **THEN** it SHALL return `<IPFS_GATEWAY>/<valid-CIDv1>`

#### Scenario: CID in the host and an /ipfs/ path

- **WHEN** `getProxiedUri` receives `https://<valid-CIDv1>.ipfs.<any-host>/ipfs/image.png`
- **THEN** it SHALL return `<IPFS_GATEWAY>/<valid-CIDv1>/ipfs/image.png`

#### Scenario: Server-side metadata read

- **WHEN** `getTokenInfosFromMetaplex` reads a mint whose `uri` is `https://ipfs.io/ipfs/<valid-CID>/meta.json`
- **THEN** it SHALL call `fetchResource` with `<IPFS_GATEWAY>/<valid-CID>/meta.json`

### Requirement: resolveIpfsUri SHALL validate the CID with multiformats before constructing the gateway URL

`resolveIpfsUri` SHALL parse the CID with `CID.parse()` and the multibase decoder for the first character of the CID.

`getProxiedUri` SHALL return an empty string and log a warning for an `ipfs:` URI with a malformed CID. `getProxiedUri` SHALL keep any other URI with a malformed CID unchanged.

#### Scenario: Malformed CID in an ipfs:// URI

- **WHEN** `getProxiedUri` receives `ipfs://not-a-valid-cid`
- **THEN** it SHALL return an empty string
- **AND** SHALL log a warning that contains the malformed CID

#### Scenario: /ipfs/ path without a CID

- **WHEN** `getProxiedUri` receives `https://example.com/ipfs/report.pdf` and `NEXT_PUBLIC_METADATA_ENABLED` is `'true'`
- **THEN** it SHALL return `/api/metadata/proxy?uri=<encoded-original-uri>`

#### Scenario: Base16 CID

- **WHEN** `getProxiedUri` receives `https://ipfs.io/ipfs/<valid-base16-CIDv1>`
- **THEN** it SHALL return `<IPFS_GATEWAY>/<valid-base16-CIDv1>`
