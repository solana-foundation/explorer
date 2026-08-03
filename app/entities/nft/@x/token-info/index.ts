// Cross-entity public API (FSD `@x` notation): the slice of the `nft` entity that the
// `token-info` entity is allowed to consume. Resolving an unlisted mint means reading the same
// Metaplex metadata account an NFT does, so both paths share one Umi client and one off-chain
// JSON reader rather than growing a second copy.
export { getMetadataJson } from '../../lib/get-metadata-json';
export type { GetMetadataJsonDeps } from '../../lib/get-metadata-json';
export { getUmi } from '../../lib/umi';
