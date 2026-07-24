import { describe, expect, it } from 'vitest';

import { BPF_LOADER_2_PROGRAM_ID, BPF_LOADER_PROGRAM_ID, LOADER_V4_PROGRAM_ID } from '../../constants.js';
import type { AccountEntityKind, AccountPayloadContext, VerificationResult } from '../../types.js';
import { buildBpfLoader2Payload, buildBpfLoaderPayload } from '../bpf-loader.js';
import { buildLoaderV4Payload } from '../loader.js';
import type { AccountKindBuilder } from '../shared.js';

const CASES: Array<{ builder: AccountKindBuilder; kind: AccountEntityKind; ownerProgram: string }> = [
    { builder: buildBpfLoaderPayload, kind: 'bpf-loader', ownerProgram: BPF_LOADER_PROGRAM_ID },
    { builder: buildBpfLoader2Payload, kind: 'bpf-loader-2', ownerProgram: BPF_LOADER_2_PROGRAM_ID },
    { builder: buildLoaderV4Payload, kind: 'loader-v4', ownerProgram: LOADER_V4_PROGRAM_ID },
];

const UNKNOWN_MARKER = { reason: 'source_unavailable', status: 'unknown', value: null };

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
