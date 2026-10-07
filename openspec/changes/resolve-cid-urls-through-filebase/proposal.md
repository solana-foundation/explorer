# Proposal: Resolve every URI that contains a CID through the Filebase gateway

## Context

- `ipfs.io` stopped serving content over HTTP on 2026-09-21 ([announcement](https://gatewaychanges.ipfs.io)). It returns `429` with `Retry-After: 900`.
- [`resolve-ipfs-uris-to-http-gateway`](../archive/2026-10-07-resolve-ipfs-uris-to-http-gateway/proposal.md) rewrote `ipfs://` URIs to `ipfs.io`, and left http(s) gateway URIs unchanged.
- Many mints store `https://ipfs.io/ipfs/<cid>` on chain. pump.fun used this form for 20 of its 30 latest tokens on 2026-10-07.
- One day of proxy logs, read on 2026-10-07, averaged 16 requests per minute to IPFS gateway URLs.

## Why

`ipfs.filebase.io` returned 19 of 20 fresh pump.fun CIDs in about 0.34 s each. [Filebase](https://filebase.com/docs/ipfs/concepts/what-is-an-ipfs-gateway) limits this public gateway to 200 requests per minute. Production traffic is 8% of that limit on average.

- **A paid dedicated gateway.** It has no rate limit, but it needs a paid account. The public limit is enough for production traffic.
- **Pinata's public gateway.** It took 3.5 to 6.7 s per CID.
- **A self-hosted gateway.** A Vercel function cannot run a gateway, so the gateway needs a separate server.
- **`@helia/verified-fetch` in the browser.** It adds the Helia library to the client bundle.

Every gateway returns the same bytes for the same CID, so the rewrite ignores the host.

- **A list of hosts that stopped serving content.** Each later shutdown needs a code change. The list matched none of the 75 `<cid>.ipfs.<host>` icons in Jupiter's verified token list on 2026-10-07.
- **Retry through the gateway after the original URI fails.** A host that hangs costs the full proxy timeout. Without the proxy, an `<img src>` cannot retry.

The rewrite also moves URIs that load from their own host. In a sample of 75 such URIs on 2026-10-07, Filebase returned 12 that failed on their own host. The first Filebase fetch of 6 URIs reached a 10 s timeout. The second fetch returned all 6.

## What Changes

- `IPFS_GATEWAY` is `https://ipfs.filebase.io/ipfs`.
- `resolveIpfsUri` returns the gateway URL for `ipfs://<cid>`, for `/ipfs/<cid>` on any host, and for `<cid>.ipfs.<host>`.
- An http(s) URI whose CID does not parse stays unchanged.
- `verifyCID` uses the multibase decoder for the first character of the CID, so base16 and uppercase base32 CIDs parse.

## Impact

- Supersedes [`resolve-ipfs-uris-to-http-gateway`](../archive/2026-10-07-resolve-ipfs-uris-to-http-gateway/proposal.md). Its requirements are the base `ipfs-uri-resolution` spec, and this delta modifies them.
- `multiformats/basics` adds 1.9 kB gzipped to the client bundle.
- All IPFS traffic shares the public rate limit of `ipfs.filebase.io`. The proxy logs give the daily average, not the busiest minute.
- The first Filebase fetch of an uncached CID can reach the proxy timeout. The first viewer then sees the placeholder.
- A CID that only its original host serves stops loading.
- The Explorer does not check the bytes a gateway returns against the CID.
