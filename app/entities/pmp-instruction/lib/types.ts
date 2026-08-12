import type { PmpDecodeConfig } from '@entities/pmp-account/@x/pmp-instruction';
import type { DataSource } from '@solana-program/program-metadata';

/**
 * What a PMP instruction's DATA bytes carry, and nothing else.
 *
 * Account-derived fields (`sourceBuffer`, `metadataAccount`) are deliberately absent: they need the instruction's
 * account list, which is the caller's concern and differs between a web3.js `TransactionInstruction` and the
 * compiled instructions of a `getTransaction` response.
 */
export type PmpInstructionData =
    | {
          kind: 'setData';
          config: PmpDecodeConfig;
          /** Absent on the 4-byte header-only shape, which carries no `dataSource` byte and no payload. */
          dataSource?: DataSource;
          payload?: Uint8Array;
      }
    | { kind: 'initialize'; config: PmpDecodeConfig; dataSource: DataSource; seed: string; payload?: Uint8Array }
    | { kind: 'write'; offset: number; chunk?: Uint8Array };
