import { convertToCodama } from '@explorer/idl-decode/anchor';
import type { RootNode } from 'codama';
import { describe, expect, it } from 'vitest';

import devi51Legacy from '@/app/entities/idl/mocks/anchor/anchor-0.29.0-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';

import { decodeSelfCpiEvent } from '../decode-self-cpi-event';

const [convertError, root] = convertToCodama(devi51Legacy as Parameters<typeof convertToCodama>[0]);
if (convertError || !root) throw convertError ?? new Error('conversion produced no root');
const AMM_V3 = root as RootNode;

// the 8-byte anchor-event self-CPI tag (sha256("anchor:event")[:8])
const SELF_CPI_TAG = Buffer.from('e445a52e51cb9a1d', 'hex');
// the raw devi51 CLMM SwapEvent (discriminator + borsh payload), as it rides inside the self-CPI data
const SWAP_EVENT = Buffer.from(
    'QMbN6CYIceIgV8re8lLcGQd412y3KQPFKMJxxuwQWCVw6A+3njc2amhrXrBJgGg1lD5jN33t53HALNMOChbBe5F0BzfhA1EL+/G2Z+mSUNE2uS5/CR3VQxrPJ91UR0AryUSbqQLvuTi8eCJGOEw+v3CG7mjvXo0toRvm3CotSdWVANPLoL39XZuXVwAAAAAAAAAAAAAAAAA2HQ0AAAAAAAAAAAAAAAAAAQtw9I0x3C1jAAAAAAAAAAB7L4c7HEQCAAAAAAAAAAAA6rX//w==',
    'base64',
);

describe('decodeSelfCpiEvent', () => {
    it('should decode an emit_cpi self-CPI instruction into its event through the codama root', () => {
        const selfCpiData = new Uint8Array(Buffer.concat([SELF_CPI_TAG, SWAP_EVENT]));

        const result = decodeSelfCpiEvent(selfCpiData, AMM_V3);

        expect(result?.name).toBe('swapEvent');
        expect(result?.args.map(arg => arg.name)).toEqual(
            expect.arrayContaining(['poolState', 'sender', 'tokenAccount0', 'amount0']),
        );
    });

    it('should return undefined for an instruction that is not a self-CPI', () => {
        expect(decodeSelfCpiEvent(new Uint8Array(SWAP_EVENT), AMM_V3)).toBeUndefined();
    });
});
