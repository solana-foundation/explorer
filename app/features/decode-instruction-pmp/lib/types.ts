import type { PmpDecodeConfig } from '@entities/pmp-account';
import type { DataSource } from '@solana-program/program-metadata';

/**
 * The content-carrying PMP instructions. The six housekeeping instructions (allocate, setAuthority,
 * setImmutable, trim, extend, close) never produce one of these - they fall through to the IDL card.
 */
export type PmpContentInstruction =
    | {
          kind: 'setData';
          config: PmpDecodeConfig;
          /** Absent on the 4-byte header-only shape, which carries no `dataSource` byte and no payload. */
          dataSource?: DataSource;
          /** Absent on the header-only shape and when the bytes live in `sourceBuffer`, which is read on demand. */
          payload?: Uint8Array;
          /** Account index 2 when it is not the program id, meaning the bytes come from a foreign buffer. */
          sourceBuffer?: string;
      }
    | {
          kind: 'initialize';
          config: PmpDecodeConfig;
          dataSource: DataSource;
          seed: string;
          /** Absent on the in-place path, where the bytes were pre-written to the metadata PDA and are read there. */
          payload?: Uint8Array;
          /** Account index 0, the metadata PDA that the in-place path pre-wrote. */
          metadataAccount?: string;
      }
    | {
          kind: 'write';
          offset: number;
          /** Absent when the chunk was copied from `sourceBuffer`, whose bytes are not in this transaction. */
          chunk?: Uint8Array;
          sourceBuffer?: string;
      };

/** The two instructions that carry decode hints, so the only two that can produce a decoded document. */
export type PmpPayloadInstruction = Extract<PmpContentInstruction, { kind: 'setData' | 'initialize' }>;
