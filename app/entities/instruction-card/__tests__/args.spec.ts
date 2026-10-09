import { address, getBase58Decoder, none, some } from '@solana/kit';
import { describe, expect, it } from 'vitest';

import { parseCodamaArgs } from '../model/args';

const KEY = '2W7rVWpiRMzex7sGBnww6sozQp94xFBzCGYUzUKZw2X4';

describe('parseCodamaArgs', () => {
    it('should drop the discriminator and the enum and option tag keys', () => {
        expect(parseCodamaArgs({ __discriminator: 0, __kind: 'A', __option: 'Some', discriminator: 3 })).toEqual([]);
    });

    it('should parse a decoded enum as its variant without the discriminator tag', () => {
        const [data, scalar] = parseCodamaArgs({
            data: { __discriminator: 2, __kind: 'Lamports', value: 2 },
            scalar: { __discriminator: 1, __kind: 'Burning' },
        });

        expect(scalar).toEqual(textLeaf('scalar', 'enum', 'Burning'));
        expect(data).toEqual({
            children: [textLeaf('value', 'number', '2')],
            kind: 'group',
            name: 'data',
            type: 'Lamports',
        });
    });

    it('should keep field order', () => {
        const data = Object.fromEntries([
            ['b', 1],
            ['discriminator', 0],
            ['a', 2],
        ]);
        const names = parseCodamaArgs(data).map(arg => arg.name);

        expect(names).toEqual(['b', 'a']);
    });

    it('should parse an address as a pubkey and any other string as a string', () => {
        const [key, text, word] = parseCodamaArgs({ key: KEY, text: '>=', word: 'Buy' });

        expect(key).toEqual({
            kind: 'leaf',
            name: 'key',
            type: 'pubkey',
            value: { address: address(KEY), kind: 'address' },
        });
        expect(text).toEqual({ kind: 'leaf', name: 'text', type: 'string', value: { kind: 'string', value: '>=' } });
        expect(word).toEqual({ kind: 'leaf', name: 'word', type: 'string', value: { kind: 'string', value: 'Buy' } });
    });

    it('should parse any string of 32 base58 bytes as a pubkey', () => {
        const hash = getBase58Decoder().decode(new Uint8Array(32).fill(7));

        expect(parseCodamaArgs({ hash })).toMatchObject([{ name: 'hash', type: 'pubkey' }]);
    });

    it('should label numbers, bigints, booleans and null by their runtime type', () => {
        expect(parseCodamaArgs({ a: 4, b: 40305008n, c: true, d: null })).toEqual([
            textLeaf('a', 'number', '4'),
            textLeaf('b', 'bignum', '40305008'),
            textLeaf('c', 'boolean', 'true'),
            textLeaf('d', 'null', 'null'),
        ]);
    });

    it('should keep every digit of a bigint above Number.MAX_SAFE_INTEGER', () => {
        expect(parseCodamaArgs({ amount: 2n ** 64n - 1n })).toEqual([
            textLeaf('amount', 'bignum', '18446744073709551615'),
        ]);
    });

    it('should label an enum by its variant, an option by its state and a plain struct as object', () => {
        const [option, struct, variant] = parseCodamaArgs({
            option: some(1),
            struct: { x: 1 },
            variant: { __kind: 'Lamports', value: 2 },
        });

        expect(variant).toMatchObject({ kind: 'group', type: 'Lamports' });
        expect(option).toMatchObject({ kind: 'group', type: 'Option(Some)' });
        expect(struct).toMatchObject({ kind: 'group', type: 'object' });
        expect(variant).toMatchObject({ children: [textLeaf('value', 'number', '2')] });
    });

    it('should keep a nested field named discriminator', () => {
        const [config] = parseCodamaArgs({ config: { discriminator: 7 }, discriminator: 1 });

        expect(config).toEqual({
            children: [textLeaf('discriminator', 'number', '7')],
            kind: 'group',
            name: 'config',
            type: 'object',
        });
    });

    it('should name array and byte array items by position', () => {
        const [bytes, list] = parseCodamaArgs({ bytes: new Uint8Array([7, 8]), list: [{ __kind: 'A', value: 1 }] });

        expect(list).toEqual({
            children: [{ children: [textLeaf('value', 'number', '1')], kind: 'group', name: '#0', type: 'A' }],
            kind: 'group',
            name: 'list',
            type: 'Array[1]',
        });
        expect(bytes).toEqual({
            children: [textLeaf('#0', 'number', '7'), textLeaf('#1', 'number', '8')],
            kind: 'group',
            name: 'bytes',
            type: 'Array[2]',
        });
    });

    it('should parse a value with nothing to expand as an empty row', () => {
        expect(
            parseCodamaArgs({
                empty: [],
                map: new Map(),
                none: none(),
            }),
        ).toEqual([
            { kind: 'empty', name: 'empty', type: 'Array[0]' },
            { kind: 'empty', name: 'map', type: 'Map[0]' },
            { kind: 'empty', name: 'none', type: 'Option(None)' },
        ]);
    });

    it('should parse an enum variant without a payload as an enum value', () => {
        expect(parseCodamaArgs({ list: [{ __kind: 'Arm' }], unit: { __kind: 'A' } })).toEqual([
            { children: [textLeaf('#0', 'enum', 'Arm')], kind: 'group', name: 'list', type: 'Array[1]' },
            textLeaf('unit', 'enum', 'A'),
        ]);
    });

    it('should parse each map entry as a row that holds its key and value', () => {
        const [map] = parseCodamaArgs({ map: new Map([[KEY, 5n]]) });

        expect(map).toEqual({
            children: [
                {
                    children: [
                        {
                            kind: 'leaf',
                            name: 'key',
                            type: 'pubkey',
                            value: { address: address(KEY), kind: 'address' },
                        },
                        textLeaf('value', 'bignum', '5'),
                    ],
                    kind: 'group',
                    name: '#0',
                    type: 'object',
                },
            ],
            kind: 'group',
            name: 'map',
            type: 'Map[1]',
        });
    });

    it('should parse a struct map key as a group', () => {
        const [map] = parseCodamaArgs({ map: new Map([[{ mint: KEY }, 5n]]) });

        expect(map).toMatchObject({
            children: [
                {
                    children: [
                        {
                            children: [{ name: 'mint', type: 'pubkey' }],
                            kind: 'group',
                            name: 'key',
                            type: 'object',
                        },
                        textLeaf('value', 'bignum', '5'),
                    ],
                },
            ],
        });
    });

    it('should return no rows when there is no data', () => {
        expect(parseCodamaArgs(undefined)).toEqual([]);
    });

    it('should show data that is not a struct as a single row', () => {
        expect(parseCodamaArgs(null)).toEqual([textLeaf('data', 'null', 'null')]);
        expect(parseCodamaArgs([1])).toMatchObject([{ kind: 'group', name: 'data', type: 'Array[1]' }]);
    });
});

function textLeaf(name: string, type: string, value: string) {
    return { kind: 'leaf', name, type, value: { kind: 'text', value } };
}
