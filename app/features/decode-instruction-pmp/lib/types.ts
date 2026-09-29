import type { PmpDecodeConfig } from '@entities/pmp-account';
import type { Address } from '@solana/kit';
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
          payload?: PmpPayload;
      }
    | { kind: 'initialize'; config: PmpDecodeConfig; seed: string; payload: PmpPayload }
    | { kind: 'write'; offset: number; chunk: PmpBytesSource };

/** The two instructions that carry decode hints, so the only two that can produce a decoded document. */
export type PmpPayloadInstruction = Extract<PmpContentInstruction, { kind: 'setData' | 'initialize' }>;

export type PmpPayload = { dataSource: DataSource; source: PmpBytesSource };

export type PmpBytesSource =
    { kind: 'inline'; bytes: Uint8Array } | { kind: 'account'; account: Address } | { kind: 'absent' };
