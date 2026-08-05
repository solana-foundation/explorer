import type { AccountMeta, Instruction, InstructionWithAccounts, InstructionWithData } from '@solana/kit';

// `data` is `Uint8Array` (mutable) rather than `ReadonlyUint8Array` because
// some downstream kit-shape parsers (e.g. lighthouse) require the mutable type.
// `@solana-program/*` parsers accept either, so this is the least-common-denominator.
export type KitInstruction = Instruction<string> &
    InstructionWithAccounts<AccountMeta[]> &
    InstructionWithData<Uint8Array>;
