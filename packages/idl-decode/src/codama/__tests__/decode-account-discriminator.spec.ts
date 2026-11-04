import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { decodeAccountWithIdl } from '../decode-account';
import { convertToCodama } from '../../anchor/convert';
import { IDL_ERROR__ACCOUNT_DECODE_FAILED } from '../../errors';
import { type AnchorIdl, unwrap } from '../../types';
import { unwrapResult } from '../../__tests__/fixtures';

const ammV3 = JSON.parse(
    readFileSync(
        fileURLToPath(new URL('../../../test-anchor-programs/amm-v3/amm-v3.idl.json', import.meta.url)),
        'utf8',
    ),
) as AnchorIdl;

type StructField = { defaultValue?: { data?: string }; name: string; type: unknown };
type MaybeStruct = { fields?: readonly StructField[] };
type AccountNodeLike = { data: MaybeStruct & { type?: MaybeStruct }; name: string };

// The 8-byte Anchor discriminator the converter stamps onto the account's leading `discriminator` field.
function accountDiscriminator(name: string): Uint8Array {
    const root = unwrapResult(convertToCodama(ammV3));
    const accounts = (root.program.accounts ?? []) as readonly AccountNodeLike[];
    const account = accounts.find(a => a.name === name);
    const struct = account?.data.fields ? account.data : account?.data.type;
    const hex = struct?.fields?.find(f => f.name === 'discriminator')?.defaultValue?.data ?? '';
    return Uint8Array.from(hex.match(/../g) ?? [], byte => parseInt(byte, 16));
}

describe('decodeAccountWithIdl — discriminator-match decode failure', () => {
    it('decodes a well-formed account for a discriminator-bearing Anchor IDL', () => {
        const disc = accountDiscriminator('ammConfig');
        // the discriminator + a zero-filled body long enough for the fixed-size ammConfig struct
        const bytes = new Uint8Array(512);
        bytes.set(disc, 0);

        const decode = decodeAccountWithIdl(ammV3, bytes);

        expect(decode.kind).toBe('codama');
        expect(unwrap(decode).node.name).toBe('ammConfig');
    });

    it('surfaces ACCOUNT_DECODE_FAILED when the discriminator matches but the body is truncated', () => {
        // only the 8 discriminator bytes — identification matches ammConfig, but the struct body is missing
        const bytes = accountDiscriminator('ammConfig');

        const decode = decodeAccountWithIdl(ammV3, bytes);

        if (decode.kind !== 'unknown') throw new Error('expected the unknown arm');
        expect(decode.errors.map(error => error.code)).toEqual([IDL_ERROR__ACCOUNT_DECODE_FAILED]);
    });

    it('stays a plain miss (no error) when no discriminator matches', () => {
        const decode = decodeAccountWithIdl(ammV3, Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8]));

        expect(decode.kind).toBe('unknown');
        if (decode.kind !== 'unknown') throw new Error('expected the unknown arm');
        expect(decode.errors).toEqual([]);
    });
});
