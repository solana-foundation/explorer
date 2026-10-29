import type { InstructionArg } from './args';

/** A program event from the transaction logs. An event the IDL cannot decode keeps only its bytes. */
export type InstructionEvent =
    | { kind: 'decoded'; name: string; args: readonly InstructionArg[]; data: Uint8Array }
    | { kind: 'unknown'; data: Uint8Array };
