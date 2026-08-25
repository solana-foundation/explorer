import type { PublicKey } from '@solana/web3.js';

/**
 * A program plus the leading bytes of one of its instructions — the input every name resolver takes.
 * One field because the two only ever travel together: a resolver needs the program to decide whether
 * the instruction is its own, and the bytes to decide which one it is.
 *
 * `data` is the instruction data truncated to `MAX_DISCRIMINATOR_BYTES`. Resolvers read only a prefix,
 * usually a leading discriminator — though Serum reads a u32 instruction code after a 1-byte version
 * prefix, which is why this is not called `discriminator`.
 */
export type InstructionNameLookup = {
    programId: string;
    data: Uint8Array;
};

/**
 * The names one resolver contributed, each `undefined` when that resolver could not supply it.
 *
 * Required-but-nullable rather than optional (`name?: string`) because this type is also an *input* —
 * `applyNameSources` takes it, and `InstructionSummary` is passed straight in. With optional fields,
 * structural typing accepts any object that merely lacks them, so a caller passing a near-miss field
 * name (this type's `programName` was once called `program`) compiles clean and silently resolves to
 * `undefined`. Requiring the key turns that into a missing-property error. Excess properties cannot
 * cover it: TypeScript only checks those on fresh object literals, and the call sites pass variables.
 */
export type ResolvedNames = {
    name: string | undefined;
    programName: string | undefined;
};

/**
 * What one instruction is known to be called, with each name absent when nothing resolves it. Callers
 * that must render something substitute their own fallback: a summary row shows "Unknown Instruction",
 * the CU chart falls back to the instruction's position in the transaction.
 *
 * `nameLookup` is set instead of `name` when only a resolver can name the instruction, and is dropped
 * once one does — so `nameLookup` present always means "still unnamed". `keptLookup` in `name-sources`
 * owns that rule for every row shape, and that module is the only thing that resolves a lookup; callers
 * read `nameLookup.programId` to decide which IDLs to fetch.
 */
export type InstructionNames = ResolvedNames & {
    nameLookup?: InstructionNameLookup;
};

/** One instruction's names paired with the program they belong to, in transaction order. */
export type NamedInstruction = InstructionNames & { programId: PublicKey };

/**
 * A render-ready summary row. Both names are always a displayable string: where `InstructionNames`
 * leaves a name absent, this substitutes a sentinel, so a consumer never writes its own fallback.
 */
export type InstructionSummary = {
    name: string;
    programName: string;
    // Set only while the instruction is still unnamed — the lookup a name resolver (IDL, ZK ElGamal, …)
    // needs to resolve the real name. `name-sources` drops it from every row it names.
    nameLookup?: InstructionNameLookup;
};
