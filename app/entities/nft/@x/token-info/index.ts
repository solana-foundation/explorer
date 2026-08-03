// Cross-entity public API (FSD `@x` notation): the slice of the `nft` entity that the
// `token-info` entity is allowed to consume. Resolving an unlisted mint means reading the same
// Metaplex metadata account an NFT does, so both paths share one cached Umi client.
//
// `getMetadataJson` is deliberately not exported here: it is browser-only, and the server-side
// token-info fallback reads off-chain JSON through the metadata proxy's hardened fetcher.
export { getUmi } from '../../lib/umi';
