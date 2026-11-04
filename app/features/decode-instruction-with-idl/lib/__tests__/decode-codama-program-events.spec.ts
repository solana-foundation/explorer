import { convertToCodama } from '@explorer/idl-decode/anchor';
import type { RootNode } from 'codama';
import { describe, expect, it } from 'vitest';

import devi51Legacy from '@/app/entities/idl/mocks/anchor/anchor-0.29.0-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';

import { decodeCodamaProgramEvents } from '../decode-codama-program-events';

const [convertError, root] = convertToCodama(devi51Legacy as Parameters<typeof convertToCodama>[0]);
if (convertError || !root) throw convertError ?? new Error('conversion produced no root');
const AMM_V3 = root as RootNode;

// Real `Program data:` log from devnet tx 2ZmKhx… (raydium-clmm devi51), the CLMM SwapEvent.
const SWAP_EVENT_B64 =
    'QMbN6CYIceIgV8re8lLcGQd412y3KQPFKMJxxuwQWCVw6A+3njc2amhrXrBJgGg1lD5jN33t53HALNMOChbBe5F0BzfhA1EL+/G2Z+mSUNE2uS5/CR3VQxrPJ91UR0AryUSbqQLvuTi8eCJGOEw+v3CG7mjvXo0toRvm3CotSdWVANPLoL39XZuXVwAAAAAAAAAAAAAAAAA2HQ0AAAAAAAAAAAAAAAAAAQtw9I0x3C1jAAAAAAAAAAB7L4c7HEQCAAAAAAAAAAAA6rX//w==';
const undecodable = Buffer.from([9, 9, 9, 9, 9, 9, 9, 9, 0, 0, 0, 0]).toString('base64');

describe('decodeCodamaProgramEvents', () => {
    it('should decode a real legacy-program event through the codama root (no anchor Program)', () => {
        const [event] = decodeCodamaProgramEvents([{ data: SWAP_EVENT_B64, kind: 'data' }], AMM_V3);

        if (event.kind !== 'decoded') throw new Error('expected a decoded event');
        expect(event.name).toBe('Swap Event');
        // codama keeps the raw field names (camelCase), same as the codama instruction/account display
        expect(event.args.map(arg => arg.name)).toEqual(
            expect.arrayContaining(['poolState', 'sender', 'tokenAccount0', 'amount0']),
        );
    });

    it('should keep the bytes of a Program data payload that no event decodes', () => {
        expect(decodeCodamaProgramEvents([{ data: undecodable, kind: 'data' }], AMM_V3)).toEqual([
            { data: new Uint8Array(Buffer.from(undecodable, 'base64')), kind: 'unknown' },
        ]);
    });

    it('should drop a Program log payload that no event decodes', () => {
        expect(decodeCodamaProgramEvents([{ data: undecodable, kind: 'log' }], AMM_V3)).toEqual([]);
    });
});
