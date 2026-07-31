import { enums } from 'superstruct';

// Specimens — the RPC jsonParsed `program` discriminators, individually importable.
// *_PROGRAM_LABEL (not *_PROGRAM_ID) on purpose: these are RPC discriminator labels, not base58 addresses.
export const ADDRESS_LOOKUP_TABLE_PROGRAM_LABEL = 'address-lookup-table';
export const BPF_LOADER_PROGRAM_LABEL = 'bpf-loader';
export const BPF_UPGRADEABLE_LOADER_PROGRAM_LABEL = 'bpf-upgradeable-loader';
export const CONFIG_PROGRAM_LABEL = 'config';
export const NONCE_PROGRAM_LABEL = 'nonce';
export const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_LABEL = 'spl-associated-token-account';
export const SPL_MEMO_PROGRAM_LABEL = 'spl-memo';
export const SPL_TOKEN_PROGRAM_LABEL = 'spl-token';
export const SPL_TOKEN_2022_PROGRAM_LABEL = 'spl-token-2022';
export const STAKE_PROGRAM_LABEL = 'stake';
export const SYSTEM_PROGRAM_LABEL = 'system';
export const SYSVAR_PROGRAM_LABEL = 'sysvar';
export const VOTE_PROGRAM_LABEL = 'vote';

/**
 * The set of `programLabel` values a decoder slice (`InstructionParser`) may
 * declare. For programs the RPC pre-parses this is the RPC `parsed.program`
 * discriminator used to guard `fromParsed` (e.g. `'spl-token'`); for programs
 * the RPC does not pre-parse (MPL Token Metadata) it is a stable synthetic
 * label carried in `UnparsedInstruction` for program-aware fallback cards.
 *
 * Adding a slice for a new program extends this union, so a slice that declares
 * a label not listed here fails to compile — keeping slice labels and the RPC
 * guards they are compared against from drifting.
 */
export type ParserProgramLabel =
    | typeof BPF_UPGRADEABLE_LOADER_PROGRAM_LABEL
    | 'lighthouse'
    | 'mpl-token-metadata'
    | typeof SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_LABEL
    | typeof SPL_TOKEN_PROGRAM_LABEL
    | typeof SPL_TOKEN_2022_PROGRAM_LABEL
    | typeof SYSTEM_PROGRAM_LABEL;

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

// `parsed.program` labels the RPC emits on parsed transaction instructions.
/**
 * Narrows a jsonParsed account envelope by its `program` discriminator. `D` is
 * inferred from the call site (e.g. the app's `ParsedData` union), so a match
 * narrows to the exact member — parsers never imports the consumer's union.
 *
 * @example
 * if (isParsedAccountProgram(parsedData, VOTE_PROGRAM_LABEL)) parsedData.parsed; // narrowed
 */
export function isParsedAccountProgram<D extends { program: string }, K extends D['program']>(
    data: D | undefined | null,
    kind: K,
): data is Extract<D, { program: K }> {
    return data?.program === kind;
}

/**
 * Narrows an RPC-parsed instruction by its `program` label. Intersects rather
 * than `Extract`s: web3.js `ParsedInstruction.program` is `string`, not a
 * discriminated union, so `Extract` would collapse to `never` — the
 * union-narrowing sibling is {@link isParsedAccountProgram}.
 */
export function isParsedInstructionProgram<D extends { program: string }, K extends string>(
    instruction: D,
    program: K,
): instruction is D & { program: K } {
    return instruction.program === program;
}

export const RPC_PARSED_INSTRUCTION_PROGRAMS = [
    SPL_TOKEN_PROGRAM_LABEL,
    SPL_TOKEN_2022_PROGRAM_LABEL,
    ADDRESS_LOOKUP_TABLE_PROGRAM_LABEL,
    BPF_LOADER_PROGRAM_LABEL,
    BPF_UPGRADEABLE_LOADER_PROGRAM_LABEL,
    SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_LABEL,
    SPL_MEMO_PROGRAM_LABEL,
    STAKE_PROGRAM_LABEL,
    SYSTEM_PROGRAM_LABEL,
    VOTE_PROGRAM_LABEL,
] as const;
export type RpcParsedInstructionProgram = (typeof RPC_PARSED_INSTRUCTION_PROGRAMS)[number];
export const rpcParsedInstructionProgram = enums(RPC_PARSED_INSTRUCTION_PROGRAMS);
export function isRpcParsedInstructionProgram(value: string): value is RpcParsedInstructionProgram {
    return RPC_PARSED_INSTRUCTION_PROGRAMS.some(program => program === value);
}
