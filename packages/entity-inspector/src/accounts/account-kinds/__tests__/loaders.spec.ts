import { describe, expect, it } from 'vitest';

import { BPF_LOADER_2_PROGRAM_ID, BPF_LOADER_PROGRAM_ID, LOADER_V4_PROGRAM_ID } from '../../../shared/constants.js';
import type { VerificationResult } from '../../../enrichments/types.js';
import { loaderV4StateBytes } from '../../__tests__/account-fixtures.js';
import type { AccountEntityKind, AccountPayloadContext, NormalizedAccountInfo } from '../../types.js';
import { buildBpfLoader2Payload, buildBpfLoaderPayload } from '../bpf-loader.js';
import { buildLoaderV4Payload } from '../loader.js';
import type { AccountKindBuilder } from '../shared.js';

const CASES: Array<{ builder: AccountKindBuilder; kind: AccountEntityKind; ownerProgram: string }> = [
    { builder: buildBpfLoaderPayload, kind: 'bpf-loader', ownerProgram: BPF_LOADER_PROGRAM_ID },
    { builder: buildBpfLoader2Payload, kind: 'bpf-loader-2', ownerProgram: BPF_LOADER_2_PROGRAM_ID },
];

const UNKNOWN_MARKER = { reason: 'source_unavailable', status: 'unknown', value: null };
const STATE_UNDECODED_MARKER = { reason: 'loader_state_undecoded', status: 'unknown', value: null };
const AUTHORITY = 'AeLnXCBPaQHGWRLr2saFsEVfnMNuKixRAbWCT9P5twgZ';

describe.each(CASES)('$kind account kind payload', ({ builder, kind, ownerProgram }) => {
    it('should build overview fields with a resolved label and pass enrichments through', () => {
        const verificationResult: VerificationResult = { status: 'unverified' };
        const context: AccountPayloadContext = {
            account: {
                address: 'Prog111111111111111111111111111111111111111',
                executable: true,
                lamports: 12345,
                owner: ownerProgram,
                parsedData: null,
                parsedProgram: null,
                rawDataBytes: null,
            },
            kind,
            multisigReferenceResult: { status: 'not_multisig' },
            resolveProgramName: () => 'Known Program',
            verificationResult,
        };

        expect(builder(context)).toEqual({
            entity: {
                address: 'Prog111111111111111111111111111111111111111',
                address_label: 'Known Program',
                balance_lamports: 12345,
                executable: true,
                idl: UNKNOWN_MARKER,
                kind,
                multisig: { status: 'not_multisig' },
                owner_program: ownerProgram,
                security_metadata: UNKNOWN_MARKER,
                verification: verificationResult,
            },
        });
    });

    it('should default missing account fields and enrichments to null and unknown markers', () => {
        const context: AccountPayloadContext = {
            account: { owner: ownerProgram, parsedData: null, parsedProgram: null, rawDataBytes: null },
            kind,
        };

        expect(builder(context)).toEqual({
            entity: {
                address: null,
                address_label: null,
                balance_lamports: null,
                executable: null,
                idl: UNKNOWN_MARKER,
                kind,
                multisig: UNKNOWN_MARKER,
                owner_program: ownerProgram,
                security_metadata: UNKNOWN_MARKER,
                verification: UNKNOWN_MARKER,
            },
        });
    });
});

function loaderV4Account(rawDataBytes: NormalizedAccountInfo['rawDataBytes']): NormalizedAccountInfo {
    return {
        address: 'Prog111111111111111111111111111111111111111',
        executable: true,
        lamports: 12345,
        owner: LOADER_V4_PROGRAM_ID,
        parsedData: null,
        parsedProgram: null,
        rawDataBytes,
    };
}

describe('loader-v4 account kind payload', () => {
    it('should decode a deployed state into upgradeable fields', () => {
        const bytes = loaderV4StateBytes({ authority: AUTHORITY, slot: 42, status: 'deployed' });

        expect(buildLoaderV4Payload({ account: loaderV4Account(bytes), kind: 'loader-v4' })).toMatchObject({
            entity: {
                kind: 'loader-v4',
                last_state_change_slot: 42,
                owner_program: LOADER_V4_PROGRAM_ID,
                status: 'deployed',
                upgrade_authority: AUTHORITY,
                upgradeable: true,
            },
        });
    });

    it('should report a finalized state as not upgradeable with no authority', () => {
        const bytes = loaderV4StateBytes({ authority: AUTHORITY, status: 'finalized' });

        expect(buildLoaderV4Payload({ account: loaderV4Account(bytes), kind: 'loader-v4' })).toMatchObject({
            entity: {
                status: 'finalized',
                upgrade_authority: null,
                upgradeable: false,
            },
        });
    });

    it('should mark state fields undecoded when the account carries no decodable header', () => {
        expect(buildLoaderV4Payload({ account: loaderV4Account(null), kind: 'loader-v4' })).toEqual({
            entity: {
                address: 'Prog111111111111111111111111111111111111111',
                address_label: null,
                balance_lamports: 12345,
                executable: true,
                idl: UNKNOWN_MARKER,
                kind: 'loader-v4',
                last_state_change_slot: STATE_UNDECODED_MARKER,
                multisig: UNKNOWN_MARKER,
                owner_program: LOADER_V4_PROGRAM_ID,
                security_metadata: UNKNOWN_MARKER,
                status: STATE_UNDECODED_MARKER,
                upgrade_authority: STATE_UNDECODED_MARKER,
                upgradeable: STATE_UNDECODED_MARKER,
                verification: UNKNOWN_MARKER,
            },
        });
    });
});
