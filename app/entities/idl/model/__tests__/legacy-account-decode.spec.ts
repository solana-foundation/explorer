import { parseCodamaArgs } from '@entities/instruction-card';
import { IdlStandard } from '@explorer/idl-decode';
import { decodeAccountWithIdl } from '@explorer/idl-decode/codama';
import { describe, expect, it } from 'vitest';

import { normalizeAnchorIdl } from '../normalize-anchor-idl';

function hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    return bytes;
}

// A minimal legacy (pre-0.30, no `metadata.spec`) Anchor IDL with one account.
const legacyCounterIdl = {
    accounts: [
        {
            name: 'Counter',
            type: {
                fields: [
                    { name: 'count', type: 'u64' },
                    { name: 'authority', type: 'publicKey' },
                ],
                kind: 'struct',
            },
        },
    ],
    instructions: [],
    name: 'counter_program',
    version: '0.1.0',
};

const PROGRAM_ADDRESS = 'devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH';

describe('legacy-program account decoding through the Codama pipeline', () => {
    it('should decode a legacy-program account via decodeAccountWithIdl and parse renderable fields', () => {
        // The load boundary converts the legacy IDL to a Codama root node (what AnchorAccountCard receives).
        const root = normalizeAnchorIdl(legacyCounterIdl, PROGRAM_ADDRESS);
        expect(root).toBeDefined();

        const accountNode = (root as any).program.accounts.find((a: any) => a.name === 'counter');
        // Anchor account layout: 8-byte discriminator, then the struct fields.
        const discriminator = hexToBytes(accountNode.data.fields[0].defaultValue.data);
        const count = new Uint8Array(8);
        new DataView(count.buffer).setBigUint64(0, 42n, true);
        const authority = new Uint8Array(32); // all-zero pubkey → '111…1'
        const data = new Uint8Array([...discriminator, ...count, ...authority]);

        const decode = decodeAccountWithIdl(root as unknown as Parameters<typeof decodeAccountWithIdl>[0], data);
        expect(decode.kind).toBe(IdlStandard.Codama);
        if (decode.kind !== IdlStandard.Codama) throw new Error('expected the codama arm');
        expect((decode.decoded.data as { count: bigint }).count).toBe(42n);

        // The exact transform AnchorAccountCard → CodamaAccountCard applies to render the fields.
        const rows = parseCodamaArgs(decode.decoded.data);
        const byName = Object.fromEntries(rows.map(row => [row.name, row]));
        expect(Object.keys(byName)).toEqual(expect.arrayContaining(['count', 'authority']));
        // the 8-byte discriminator is not a user-facing field
        expect(byName.discriminator).toBeUndefined();
        expect(byName.count).toMatchObject({ kind: 'leaf', value: { kind: 'text', value: '42' } });
    });
});
