/**
 * Rows past this collapse into one "and N more instructions" line, and only the programs above it get an
 * IDL fetch - resolving an IDL for a row nobody sees is pure latency.
 */
export const MAX_INSTRUCTION_ROWS = 3;
