import anchorModernIdl from '@entities/idl/mocks/anchor/anchor-0.30.1-devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH.json';
import anchorNoAddressIdl from '@entities/idl/mocks/anchor/anchor-legacy-account_compression-compr6CUsB5m2jS4Y3831ztGSTnDpnKJTKS95d64XVq.json';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { parseStoredRecord, serializeRecord, withSelection } from '../stored-record';

const PROGRAM_ADDRESS = 'devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH';
const STORED = { idl: anchorModernIdl, origin: { fileName: 'idl.json', kind: 'file' }, selected: 'custom' };
const UNREADABLE = { kind: 'unreadable', programAddress: PROGRAM_ADDRESS };

describe('parseStoredRecord', () => {
    afterEach(() => vi.doUnmock('../can-decoder-load'));

    it('should return the record with the IDL bound to the program address', async () => {
        expect(await parseStoredRecord(PROGRAM_ADDRESS, JSON.stringify(STORED))).toEqual({
            kind: 'record',
            record: {
                customIdl: { idl: anchorModernIdl, programAddress: PROGRAM_ADDRESS, standard: 'Anchor' },
                origin: STORED.origin,
                selected: 'custom',
            },
        });
    });

    it.each([
        ['text that is not JSON', '{not json'],
        ['a JSON number', '42'],
        ['a JSON array', '[]'],
        ['JSON null', 'null'],
        ['a value that is not a string', { idl: {} }],
    ])('should return unreadable for %s', async (_, value) => {
        expect(await parseStoredRecord(PROGRAM_ADDRESS, value)).toEqual(UNREADABLE);
    });

    it.each(['idl', 'origin', 'selected'])(
        'should return unreadable with %s missing, null or of the wrong type',
        async field => {
            for (const value of [undefined, null, { wrong: 'type' }]) {
                expect(await parseStoredRecord(PROGRAM_ADDRESS, JSON.stringify({ ...STORED, [field]: value }))).toEqual(
                    UNREADABLE,
                );
            }
        },
    );

    it.each([
        ['a file origin without a file name', { ...STORED, origin: { kind: 'file' } }],
        ['a selection that names an on-chain source', { ...STORED, selected: 'anchor' }],
        ['an IDL that is not an IDL', { ...STORED, idl: { instructions: [] } }],
    ])('should return unreadable for %s', async (_, stored) => {
        expect(await parseStoredRecord(PROGRAM_ADDRESS, JSON.stringify(stored))).toEqual(UNREADABLE);
    });

    it('should return unreadable for an IDL that declares another program address', async () => {
        const otherAddress = 'compr6CUsB5m2jS4Y3831ztGSTnDpnKJTKS95d64XVq';

        expect(await parseStoredRecord(otherAddress, JSON.stringify(STORED))).toEqual({
            kind: 'unreadable',
            programAddress: otherAddress,
        });
    });

    it('should return unreadable for a key that is not a program address', async () => {
        const value = JSON.stringify({ ...STORED, idl: anchorNoAddressIdl });

        expect(await parseStoredRecord('not-an-address', value)).toEqual({
            kind: 'unreadable',
            programAddress: 'not-an-address',
        });
    });

    it('should return check-failed, not unreadable, when the decoder check does not load', async () => {
        vi.resetModules();
        vi.doMock('../can-decoder-load', () => {
            throw new Error('ChunkLoadError');
        });
        const { parseStoredRecord: parseWithoutDecoders } = await import('../stored-record');

        expect(await parseWithoutDecoders(PROGRAM_ADDRESS, JSON.stringify(STORED))).toEqual({ kind: 'check-failed' });
    });
});

describe('serializeRecord', () => {
    it('should write a value that parseStoredRecord reads back', async () => {
        const parsed = await parseStoredRecord(PROGRAM_ADDRESS, JSON.stringify({ ...STORED, selected: 'onChain' }));
        if (parsed.kind !== 'record') throw new Error('fixture must parse');

        expect(await parseStoredRecord(PROGRAM_ADDRESS, serializeRecord(parsed.record))).toEqual(parsed);
    });
});

describe('withSelection', () => {
    it('should change the selection and keep the stored IDL', () => {
        const value = withSelection(JSON.stringify(STORED), 'onChain');

        expect(JSON.parse(value ?? 'null')).toEqual({ ...STORED, selected: 'onChain' });
    });

    it.each([
        ['text that is not JSON', '{not json'],
        ['a value that is not a string', STORED],
        ['a JSON array', '[]'],
        ['JSON that is not a record', JSON.stringify({ idl: {} })],
        ['a record that already has this selection', JSON.stringify({ ...STORED, selected: 'onChain' })],
    ])('should return undefined for %s', (_, value) => {
        expect(withSelection(value, 'onChain')).toBeUndefined();
    });
});
