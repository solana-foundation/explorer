import { enums } from 'superstruct';

// Specimens — the RPC jsonParsed `program` discriminators, individually importable.
// *_PROGRAM_LABEL (not *_PROGRAM_ID) on purpose: these are RPC discriminator labels, not base58 addresses.
export const ADDRESS_LOOKUP_TABLE_PROGRAM_LABEL = 'address-lookup-table';
export const BPF_UPGRADEABLE_LOADER_PROGRAM_LABEL = 'bpf-upgradeable-loader';
export const CONFIG_PROGRAM_LABEL = 'config';
export const NONCE_PROGRAM_LABEL = 'nonce';
export const SPL_TOKEN_PROGRAM_LABEL = 'spl-token';
export const SPL_TOKEN_2022_PROGRAM_LABEL = 'spl-token-2022';
export const STAKE_PROGRAM_LABEL = 'stake';
export const SYSVAR_PROGRAM_LABEL = 'sysvar';
export const VOTE_PROGRAM_LABEL = 'vote';

export const TOKEN_PROGRAMS = [SPL_TOKEN_PROGRAM_LABEL, SPL_TOKEN_2022_PROGRAM_LABEL] as const;
export type TokenProgram = (typeof TOKEN_PROGRAMS)[number];
export const tokenProgram = enums(TOKEN_PROGRAMS);
export function isTokenProgram(value: string): value is TokenProgram {
    return TOKEN_PROGRAMS.some(program => program === value);
}

// `data.program` discriminators the RPC emits on jsonParsed accounts.
// Composed from specimens (not ...TOKEN_PROGRAMS) — rollup keeps identifier spreads, breaking the treeshake gate.
export const RPC_PARSED_ACCOUNT_PROGRAMS = [
    SPL_TOKEN_PROGRAM_LABEL,
    SPL_TOKEN_2022_PROGRAM_LABEL,
    ADDRESS_LOOKUP_TABLE_PROGRAM_LABEL,
    BPF_UPGRADEABLE_LOADER_PROGRAM_LABEL,
    CONFIG_PROGRAM_LABEL,
    NONCE_PROGRAM_LABEL,
    STAKE_PROGRAM_LABEL,
    SYSVAR_PROGRAM_LABEL,
    VOTE_PROGRAM_LABEL,
] as const;
export type RpcParsedAccountProgram = (typeof RPC_PARSED_ACCOUNT_PROGRAMS)[number];
export const rpcParsedAccountProgram = enums(RPC_PARSED_ACCOUNT_PROGRAMS);
export function isRpcParsedAccountProgram(value: string): value is RpcParsedAccountProgram {
    return RPC_PARSED_ACCOUNT_PROGRAMS.some(program => program === value);
}
