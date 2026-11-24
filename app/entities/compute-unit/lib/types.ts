// Rows must stay in transaction order and unfiltered to pair each row with its top-level invocation.
export type InstructionCUInput = {
    programId: { toBase58(): string };
    data?: Uint8Array;
    name?: string;
    programName?: string;
};

export type TransactionOutcome =
    { status: 'succeeded' } | { status: 'failed'; failedInstructionIndex: number | undefined };

export type InstructionComputeUnits = number | 'not-executed' | undefined;

export type InstructionCUData = {
    programId: string;
    computeUnits: InstructionComputeUnits;
    // Resolved display names, when the caller knows them: the instruction name ("Transfer Checked") and
    // the program's display name ("Token Program"). Undefined when nothing named it — see
    // toInstructionCUDisplay for what the card shows instead.
    name?: string;
    programName?: string;
};
