export { ADDRESS_LOOKUP_TABLE_PROGRAM_ADDRESS as ADDRESS_LOOKUP_TABLE_PROGRAM_ID } from '@solana-program/address-lookup-table';
export { LOADER_V3_PROGRAM_ADDRESS as BPF_UPGRADEABLE_LOADER_PROGRAM_ID } from '@solana-program/loader-v3';
export { TOKEN_PROGRAM_ADDRESS as TOKEN_PROGRAM_ID } from '@solana-program/token';
export { TOKEN_2022_PROGRAM_ADDRESS as TOKEN_2022_PROGRAM_ID } from '@solana-program/token-2022';
export { SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS as SOLANA_ATTESTATION_SERVICE_PROGRAM_ID } from 'sas-lib';

// No @solana-program/* client is published for the addresses below — kept as literals.
export const BPF_LOADER_PROGRAM_ID = 'BPFLoader1111111111111111111111111111111111';
export const BPF_LOADER_2_PROGRAM_ID = 'BPFLoader2111111111111111111111111111111111';
export const LOADER_V4_PROGRAM_ID = 'LoaderV411111111111111111111111111111111111';
export const NFTOKEN_ADDRESS = 'nftokf9qcHSYkVSP3P2gUMmV6d4AwjMueXgUu43HyLL';
export const FEATURE_PROGRAM_ID = 'Feature111111111111111111111111111111111111';

// Squads clients exist but are deliberately not imported — third-party supply-chain surface for one string each.
export const SQUADS_V3_ADDRESS = 'SMPLecH534NA9acpos4G6x7uf3LWbCAwZQE9e8ZekMu'; // https://github.com/Squads-Protocol/squads-mpl
export const SQUADS_V4_ADDRESS = 'SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf'; // https://github.com/Squads-Protocol/v4
export const SQUADS_LAMBDA_URL = 'https://4fnetmviidiqkjzenwxe66vgoa0soerr.lambda-url.us-east-1.on.aws/isSquadV2';

export const RPC_REQUEST_TIMEOUT_MS = 5000;
export const DAS_REQUEST_TIMEOUT_MS = 3000;
