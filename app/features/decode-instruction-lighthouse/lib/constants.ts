import type { ParserProgramLabel } from '@entities/instruction-parser';
import { LIGHTHOUSE_PROGRAM_ADDRESS } from 'lighthouse-sdk';

// Sourced from the program's own generated client so the address can't drift.
export const LIGHTHOUSE_ADDRESS: string = LIGHTHOUSE_PROGRAM_ADDRESS;

/**
 * Synthetic `programLabel` for Lighthouse. The RPC never pre-parses Lighthouse,
 * so (like MPL Token Metadata) this is a stable id used by the dispatcher to
 * route the byte path — not an RPC `parsed.program` discriminator.
 */
export const LIGHTHOUSE_PROGRAM_LABEL = 'lighthouse' satisfies ParserProgramLabel;
