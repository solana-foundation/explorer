/**
 * One instruction as `formatInstructionLogs` takes it: its program, plus display names when the caller
 * resolved them. `programId` is structural rather than a `PublicKey` because only the base58 address is
 * read — that keeps this entity independent of any one key representation.
 *
 * Rows must stay in transaction order and must not be filtered. `formatInstructionLogs` pairs row `i`
 * with the `i`th top-level invocation in the logs, so dropping a row shifts every later one onto
 * another instruction's CU figure.
 */
export type InstructionCUInput = {
    programId: { toBase58(): string };
    name?: string;
    programName?: string;
};

export type InstructionCUData = {
    programId: string;
    // What the logs reported. 0 means the logs said nothing, not that the instruction consumed nothing.
    computeUnits: number;
    // A builtin's fixed cost, and 0 for any program that is not a builtin. A real cost rather than a
    // guess, so `toInstructionCUDisplay` does not mark it an estimate.
    defaultUnits: number;
    // The schedule's reserve for this program at this epoch — a guess, so the card prefixes it with ~.
    // Never 0: the schedule reserves 200k for a BPF program and 3k for a builtin. That is what makes
    // `computeUnits || defaultUnits || scheduledUnits` total, so no consumer needs a floor of its own.
    scheduledUnits: number;
    // Resolved display names, when the caller knows them: the instruction name ("Transfer Checked") and
    // the program's display name ("Token Program"). Undefined when nothing named it — see
    // toInstructionCUDisplay for what the card shows instead.
    name?: string;
    programName?: string;
};
