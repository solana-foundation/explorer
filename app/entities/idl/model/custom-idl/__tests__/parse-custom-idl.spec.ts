import anchorModernIdl from '@entities/idl/mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import anchorLegacyIdl from '@entities/idl/mocks/anchor/anchor-legacy-0.9.4-shank-waveQX2yP3H1pVU8djGvEHmYg8uamQ84AuyGtpsrXTF.json';
import anchorNoAddressIdl from '@entities/idl/mocks/anchor/anchor-legacy-account_compression-compr6CUsB5m2jS4Y3831ztGSTnDpnKJTKS95d64XVq.json';
import codamaIdl from '@entities/idl/mocks/codama/codama-1.0.0-ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S.json';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { parseCustomIdl } from '../parse-custom-idl';

const MODERN_ADDRESS = 'devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH';
const LEGACY_ADDRESS = 'waveQX2yP3H1pVU8djGvEHmYg8uamQ84AuyGtpsrXTF';
const CODAMA_ADDRESS = 'ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S';
const OTHER_ADDRESS = 'compr6CUsB5m2jS4Y3831ztGSTnDpnKJTKS95d64XVq';

describe('parseCustomIdl', () => {
    afterEach(() => vi.doUnmock('../can-decoder-load'));

    it.each([
        ['a number', 42],
        ['a string', 'idl'],
        ['null', null],
        ['an array', []],
        ['an object with an empty instruction list', { instructions: [] }],
        ['an object with instructions that are not objects', { instructions: [1, 'x', null] }],
        ['a legacy Anchor IDL with an address that is not a string', { ...anchorLegacyIdl, address: 42 }],
        ['an Anchor 0.30 IDL with an empty address', { ...anchorModernIdl, address: '' }],
        ['a legacy Anchor IDL with the kind of a Codama root', { ...anchorNoAddressIdl, kind: 'rootNode' }],
        ['a legacy Anchor IDL with the standard of a Codama root', { ...anchorNoAddressIdl, standard: 'codama' }],
        [
            'a legacy Anchor IDL with a spec that is not a string',
            { ...anchorNoAddressIdl, metadata: { address: 'devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH', spec: 1 } },
        ],
    ])('should reject %s as not an IDL', async (_, json) => {
        expect(await parseCustomIdl(json, MODERN_ADDRESS)).toEqual({ error: { kind: 'not-an-idl' }, ok: false });
    });

    it.each([
        ['an Anchor 0.30 IDL', anchorModernIdl, MODERN_ADDRESS, 'Anchor'],
        ['a legacy Anchor IDL with an address', anchorLegacyIdl, LEGACY_ADDRESS, 'Anchor'],
        ['a legacy Anchor IDL without an address', anchorNoAddressIdl, MODERN_ADDRESS, 'Anchor'],
        [
            'a legacy Anchor IDL with an empty address',
            { ...anchorNoAddressIdl, metadata: { address: '' } },
            MODERN_ADDRESS,
            'Anchor',
        ],
        ['a Codama root', codamaIdl, CODAMA_ADDRESS, 'Codama'],
    ])('should accept %s', async (_, json, programAddress, standard) => {
        const result = await parseCustomIdl(json, programAddress);

        expect(result).toEqual({ customIdl: { idl: json, programAddress, standard }, ok: true });
    });

    it.each([
        ['an Anchor 0.30 IDL', anchorModernIdl, MODERN_ADDRESS],
        ['a legacy Anchor IDL', anchorLegacyIdl, LEGACY_ADDRESS],
        ['a Codama root', codamaIdl, CODAMA_ADDRESS],
    ])('should take the program address from %s when the caller passes none', async (_, json, declaredAddress) => {
        const result = await parseCustomIdl(json, undefined);

        expect(result).toMatchObject({ customIdl: { programAddress: declaredAddress }, ok: true });
    });

    it.each([
        ['no program address', anchorNoAddressIdl],
        ['an empty program address', { ...anchorNoAddressIdl, metadata: { address: '' } }],
    ])('should reject an IDL that declares %s when the caller passes none', async (_, json) => {
        expect(await parseCustomIdl(json, undefined)).toEqual({
            error: { kind: 'missing-address' },
            ok: false,
        });
    });

    it('should reject a program address that the caller passes when it is not base58', async () => {
        expect(await parseCustomIdl(anchorNoAddressIdl, 'not-an-address')).toEqual({
            error: { kind: 'invalid-address' },
            ok: false,
        });
    });

    it.each([
        ['passes none', undefined],
        ['passes a valid address', MODERN_ADDRESS],
    ])(
        'should reject a program address that the IDL declares when it is not base58 and the caller %s',
        async (_, programAddress) => {
            expect(await parseCustomIdl({ ...anchorModernIdl, address: 'not-an-address' }, programAddress)).toEqual({
                error: { kind: 'invalid-declared-address' },
                ok: false,
            });
        },
    );

    it.each([
        ['a legacy Anchor IDL whose program name', { ...anchorNoAddressIdl, metadata: { name: 5 } }, MODERN_ADDRESS],
        [
            'a legacy Anchor IDL whose program version',
            { ...anchorNoAddressIdl, metadata: { version: {} } },
            MODERN_ADDRESS,
        ],
        [
            'a Codama root whose program version',
            { ...codamaIdl, program: { ...codamaIdl.program, version: {} } },
            CODAMA_ADDRESS,
        ],
    ])('should reject %s is not a string as not an IDL', async (_, json, programAddress) => {
        expect(await parseCustomIdl(json, programAddress)).toEqual({ error: { kind: 'not-an-idl' }, ok: false });
    });

    it('should report JSON that is not an IDL before a missing address', async () => {
        expect(await parseCustomIdl({ instructions: [] }, undefined)).toEqual({
            error: { kind: 'not-an-idl' },
            ok: false,
        });
    });

    it.each([
        ['an Anchor IDL', anchorModernIdl, MODERN_ADDRESS],
        ['a legacy Anchor IDL', anchorLegacyIdl, LEGACY_ADDRESS],
        ['a Codama root', codamaIdl, CODAMA_ADDRESS],
    ])('should reject %s that declares another program address', async (_, json, declaredAddress) => {
        const result = await parseCustomIdl(json, OTHER_ADDRESS);

        expect(result).toEqual({
            error: { declaredAddress, kind: 'program-mismatch', programAddress: OTHER_ADDRESS },
            ok: false,
        });
    });

    it('should reject an Anchor IDL that declares another program even with a program public key', async () => {
        const json = { ...anchorModernIdl, program: { publicKey: OTHER_ADDRESS } };

        expect(await parseCustomIdl(json, OTHER_ADDRESS)).toEqual({
            error: { declaredAddress: MODERN_ADDRESS, kind: 'program-mismatch', programAddress: OTHER_ADDRESS },
            ok: false,
        });
    });

    it('should reject an Anchor IDL with an argument type that the decoder cannot load', async () => {
        const [instruction] = anchorModernIdl.instructions;
        const json = {
            ...anchorModernIdl,
            instructions: [{ ...instruction, args: [{ name: 'amount', type: 'u999' }] }],
        };

        expect(await parseCustomIdl(json, MODERN_ADDRESS)).toEqual({ error: { kind: 'cannot-load' }, ok: false });
    });

    it('should reject an Anchor IDL with an error list that the decoder cannot load', async () => {
        expect(await parseCustomIdl({ ...anchorModernIdl, errors: {} }, MODERN_ADDRESS)).toEqual({
            error: { kind: 'cannot-load' },
            ok: false,
        });
    });

    it('should reject a legacy Anchor IDL that only the Codama conversion loads and that declares no address', async () => {
        expect(await parseCustomIdl(codamaOnlyLegacyIdl(), MODERN_ADDRESS)).toEqual({
            error: { kind: 'cannot-load' },
            ok: false,
        });
    });

    it('should accept a legacy Anchor IDL that only the Codama conversion loads when it declares the program', async () => {
        const result = await parseCustomIdl(codamaOnlyLegacyIdl({ address: MODERN_ADDRESS }), MODERN_ADDRESS);

        expect(result).toMatchObject({ customIdl: { programAddress: MODERN_ADDRESS }, ok: true });
    });

    it.each([
        ['an instruction name that is not a string', minimalCodamaRoot({ name: 7 })],
        ['a discriminator outside its number format', minimalCodamaRoot({ discriminator: 300 })],
    ])('should reject a Codama root with %s', async (_, json) => {
        expect(await parseCustomIdl(json, MODERN_ADDRESS)).toEqual({ error: { kind: 'cannot-load' }, ok: false });
    });

    it('should accept the minimal Codama root that the name checks start from', async () => {
        expect(await parseCustomIdl(minimalCodamaRoot({}), MODERN_ADDRESS)).toMatchObject({ ok: true });
    });

    it('should reject a Codama root with an instruction that has no name', async () => {
        const json = {
            ...codamaIdl,
            program: { ...codamaIdl.program, instructions: [{ ...codamaIdl.program.instructions[0], name: '' }] },
        };

        expect(await parseCustomIdl(json, CODAMA_ADDRESS)).toEqual({ error: { kind: 'cannot-load' }, ok: false });
    });

    it('should return check-failed when the decoder check does not load', async () => {
        vi.resetModules();
        vi.doMock('../can-decoder-load', () => {
            throw new Error('ChunkLoadError');
        });
        const { parseCustomIdl: parseWithoutDecoders } = await import('../parse-custom-idl');
        const { Logger } = await import('@/app/shared/lib/logger');

        expect(await parseWithoutDecoders(anchorModernIdl, MODERN_ADDRESS)).toEqual({
            error: { kind: 'check-failed' },
            ok: false,
        });
        expect(Logger.error).toHaveBeenCalledWith(expect.objectContaining({ cause: expect.any(Error) }), {
            sentry: 'always',
        });
    });
});

function codamaOnlyLegacyIdl(metadata?: { address: string }) {
    return {
        instructions: [
            {
                accounts: [{ isMut: true, isSigner: false, name: 'a' }],
                args: [{ name: 'x', type: 'u64' }],
                name: 'doIt',
            },
            { accounts: [], args: [{ name: 'y', type: { defined: 'Missing' } }], name: 'other' },
        ],
        name: 'probe',
        version: '0.1.0',
        ...(metadata && { metadata }),
    };
}

function minimalCodamaRoot({ name = 'a', discriminator = 3 }: { name?: unknown; discriminator?: number }) {
    const argument = {
        defaultValue: { kind: 'numberValueNode', number: discriminator },
        defaultValueStrategy: 'omitted',
        kind: 'instructionArgumentNode',
        name: 'discriminator',
        type: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
    };
    const instruction = {
        accounts: [],
        arguments: [argument],
        discriminators: [{ kind: 'fieldDiscriminatorNode', name: 'discriminator', offset: 0 }],
        kind: 'instructionNode',
        name,
    };
    return {
        additionalPrograms: [],
        kind: 'rootNode',
        program: {
            accounts: [],
            constants: [],
            definedTypes: [],
            errors: [],
            events: [],
            instructions: [instruction],
            kind: 'programNode',
            name: 'foo',
            pdas: [],
            publicKey: MODERN_ADDRESS,
            version: '1.0.0',
        },
        standard: 'codama',
        version: '1.0.0',
    };
}
