/**
 * One instruction as `formatInstructionLogs` takes it: its program, plus display names when the caller
 * resolved them. `programId` is structural rather than a `PublicKey` because only the base58 address is
 * read — that keeps this entity independent of any one key representation.
 *
 * Rows must stay in transaction order and must not be filtered. `formatInstructionLogs` pairs the rows
 * with the top-level invocations in order, so dropping a row can give a later row another instruction's
 * CU figure.
 */
export type InstructionCUInput = {
    programId: { toBase58(): string };
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
