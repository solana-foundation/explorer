import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { getLastNodeFromPath } from 'codama';
import { describe, expect, it } from 'vitest';

import { IdlStandard, type AnchorIdl } from '../../types.js';
import { decodeEventWithIdl } from '../decode-event.js';

const ammV3 = JSON.parse(
    readFileSync(
        fileURLToPath(new URL('../../../test-anchor-programs/amm-v3/amm-v3.idl.json', import.meta.url)),
        'utf8',
    ),
) as AnchorIdl;

// Real `Program data:` log from devnet tx 2ZmKhx… (raydium-clmm devi51), the CLMM SwapEvent.
const SWAP_EVENT = Buffer.from(
    'QMbN6CYIceIgV8re8lLcGQd412y3KQPFKMJxxuwQWCVw6A+3njc2amhrXrBJgGg1lD5jN33t53HALNMOChbBe5F0BzfhA1EL+/G2Z+mSUNE2uS5/CR3VQxrPJ91UR0AryUSbqQLvuTi8eCJGOEw+v3CG7mjvXo0toRvm3CotSdWVANPLoL39XZuXVwAAAAAAAAAAAAAAAAA2HQ0AAAAAAAAAAAAAAAAAAQtw9I0x3C1jAAAAAAAAAAB7L4c7HEQCAAAAAAAAAAAA6rX//w==',
    'base64',
);

describe('decodeEventWithIdl', () => {
    it('decodes a real legacy Anchor program event through the codama pipeline', () => {
        const result = decodeEventWithIdl(ammV3, SWAP_EVENT);

        expect(result.kind).toBe(IdlStandard.Codama);
        if (result.kind !== IdlStandard.Codama) throw new Error('expected codama arm');

        const node = getLastNodeFromPath(result.decoded.path);
        expect(node.kind).toBe('eventNode');
        expect('name' in node && node.name.toLowerCase()).toBe('swapevent');

        // the CLMM SwapEvent fields (see the IDL Events tab / production decode)
        const data = result.decoded.data as Record<string, unknown>;
        expect(Object.keys(data)).toEqual(
            expect.arrayContaining(['poolState', 'sender', 'tokenAccount0', 'tokenAccount1', 'amount0', 'zeroForOne']),
        );
    });

    it('returns the unknown arm (plain miss, no error) for bytes no event matches', () => {
        const result = decodeEventWithIdl(ammV3, new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]));

        expect(result.kind).toBe('unknown');
        if (result.kind !== 'unknown') throw new Error('expected unknown arm');
        expect(result.errors).toEqual([]);
    });
});
