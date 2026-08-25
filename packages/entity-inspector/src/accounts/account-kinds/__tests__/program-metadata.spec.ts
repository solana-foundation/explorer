import {
    Compression,
    DataSource,
    Encoding,
    Format,
    getBufferEncoder,
    getMetadataEncoder,
    PROGRAM_METADATA_PROGRAM_ADDRESS,
} from '@solana-program/program-metadata';
import { address, none, some } from '@solana/kit';
import { describe, expect, it } from 'vitest';

import { asRecord } from '../../../shared/parse-helpers.js';
import type { AccountEntityKind, AccountPayloadContext } from '../../types.js';
import { buildProgramMetadataPayload } from '../program-metadata.js';

const PDA = 'FgsH6dRAER4htJGQFvBDw6x6rBvx4yCsWBwwh3zhdpzL';
const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const FNDN_AUTHORITY = 'fndnu15PLXELbLsTqrfbiweBvsBj2o12RoVfkeCCbX2';

// Encoded through the client's own encoder — a hand-built byte fixture could drift from the real layout.
function metadataBytes(overrides: Record<string, unknown> = {}) {
    return new Uint8Array(
        getMetadataEncoder().encode({
            authority: some(address(FNDN_AUTHORITY)),
            canonical: false,
            compression: Compression.Zlib,
            data: new Uint8Array([1, 2, 3]),
            dataLength: 3,
            dataSource: DataSource.Direct,
            encoding: Encoding.None,
            format: Format.Json,
            mutable: true,
            program: address(TOKEN_PROGRAM),
            seed: 'idl',
            ...overrides,
        }),
    );
}

function contextFor(kind: AccountEntityKind, rawDataBytes: Uint8Array | null): AccountPayloadContext {
    return {
        account: {
            address: PDA,
            owner: PROGRAM_METADATA_PROGRAM_ADDRESS,
            parsedData: null,
            parsedProgram: null,
            rawDataBytes,
        },
        kind,
    };
}

function entityOf(kind: AccountEntityKind, rawDataBytes: Uint8Array | null): Record<string, unknown> {
    const entity = asRecord(buildProgramMetadataPayload(contextFor(kind, rawDataBytes)).entity);
    if (!entity) {
        throw new Error('payload.entity is not a record');
    }
    return entity;
}

describe('buildProgramMetadataPayload', () => {
    it('should expose the metadata header including the program it describes', () => {
        expect(entityOf('program-metadata:metadata', metadataBytes())).toMatchObject({
            address: PDA,
            authority: FNDN_AUTHORITY,
            canonical: false,
            compression: 'zlib',
            data_length: 3,
            data_source: 'direct',
            encoding: 'none',
            format: 'json',
            kind: 'program-metadata:metadata',
            mutable: true,
            owner: PROGRAM_METADATA_PROGRAM_ADDRESS,
            program: TOKEN_PROGRAM,
            seed: 'idl',
        });
    });

    it('should report a null authority when the metadata declares none', () => {
        const entity = entityOf('program-metadata:metadata', metadataBytes({ authority: none() }));

        expect(entity.authority).toBeNull();
    });

    it('should expose the buffer header without the metadata-only fields', () => {
        const bytes = new Uint8Array(
            getBufferEncoder().encode({
                authority: some(address(FNDN_AUTHORITY)),
                canonical: true,
                data: new Uint8Array([7, 7]),
                program: some(address(TOKEN_PROGRAM)),
                seed: 'idl',
            }),
        );

        const entity = entityOf('program-metadata:buffer', bytes);

        expect(entity).toMatchObject({
            authority: FNDN_AUTHORITY,
            canonical: true,
            data_length: 2,
            kind: 'program-metadata:buffer',
            program: TOKEN_PROGRAM,
            seed: 'idl',
        });
        expect(entity).not.toHaveProperty('format');
        expect(entity).not.toHaveProperty('mutable');
    });

    it('should carry only the base fields for the empty subtype', () => {
        const entity = entityOf('program-metadata:empty', new Uint8Array([0]));

        expect(entity).toEqual({
            address: PDA,
            address_label: null,
            kind: 'program-metadata:empty',
            owner: PROGRAM_METADATA_PROGRAM_ADDRESS,
        });
    });

    it('should degrade to the base fields when the header cannot be decoded', () => {
        // Truncated mid-header: the account still classifies, only the decoded fields are lost.
        const entity = entityOf('program-metadata:metadata', metadataBytes().slice(0, 12));

        expect(entity).toEqual({
            address: PDA,
            address_label: null,
            kind: 'program-metadata:metadata',
            owner: PROGRAM_METADATA_PROGRAM_ADDRESS,
        });
    });

    it('should null the base fields the normalizer did not resolve', () => {
        const entity = asRecord(
            buildProgramMetadataPayload({
                account: { owner: null, parsedData: null, parsedProgram: null, rawDataBytes: null },
                kind: 'program-metadata:empty',
            }).entity,
        );

        expect(entity).toEqual({
            address: null,
            address_label: null,
            kind: 'program-metadata:empty',
            owner: null,
        });
    });

    it('should degrade to the base fields when the account carries no data', () => {
        expect(entityOf('program-metadata:metadata', null)).toEqual({
            address: PDA,
            address_label: null,
            kind: 'program-metadata:metadata',
            owner: PROGRAM_METADATA_PROGRAM_ADDRESS,
        });
    });
});
