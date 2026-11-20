/**
 * One instruction as `toInstructionCUData` takes it: its program, plus display names when the caller
 * resolved them. `programId` is structural rather than a `PublicKey` because only the base58 address is
 * read — that keeps this entity independent of any one key representation.
 *
 * Rows must stay in transaction order and must not be filtered. `toInstructionCUData` pairs the rows
 * with the top-level invocations in order, so a dropped row can give a later row no CU figure or another
 * instruction's.
 */
export type InstructionCUInput = {
    programId: { toBase58(): string };
    // The instruction data. The fixed cost of some programs depends on the instruction.
    data?: Uint8Array;
    name?: string;
    programName?: string;
};

export type InstructionCUData = {
    programId: string;
    // The figure from the logs, or the fixed cost of a builtin or a precompile. `undefined` when the
    // logs have no figure and the program has no fixed cost.
    computeUnits: number | undefined;
    // Resolved display names, when the caller knows them: the instruction name ("Transfer Checked") and
    // the program's display name ("Token Program"). Undefined when nothing named it — see
    // toInstructionCUDisplay for what the card shows instead.
    name?: string;
    programName?: string;
};
