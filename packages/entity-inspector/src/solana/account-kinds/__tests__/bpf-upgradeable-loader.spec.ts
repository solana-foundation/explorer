import { describe, expect, it } from 'vitest';

import { TOKEN_2022_PROGRAM_ID } from '../../constants.js';
import { asRecord } from '../../parse-helpers.js';
import { buildBpfUpgradeableLoaderPayload } from '../bpf-upgradeable-loader.js';

// Stub for the injected registry lookup (app wiring lands in Step 5).
function resolveProgramName(address: string): string | undefined {
    return address === TOKEN_2022_PROGRAM_ID ? 'Token-2022 Program' : undefined;
}

function entityOf(payload: Record<string, unknown>): Record<string, unknown> {
    const entity = asRecord(payload.entity);
    if (!entity) {
        throw new Error('payload.entity is not a record');
    }
    return entity;
}

describe('bpf-upgradeable-loader account kind payload', () => {
    it('should build resolved programData payload with deployment fields', () => {
        const executableDataAddress = 'DoU57AYuPfu2QU514RktNPG220AhpEjnKxnBcu4HDTY';
        const upgradeAuthority = 'AeLnXCBPaQHGWRLr2saFsEVfnMNuKixRAbWCT9P5twgZ';
        const result = buildBpfUpgradeableLoaderPayload({
            account: {
                address: TOKEN_2022_PROGRAM_ID,
                executable: true,
                lamports: 567591537,
                owner: 'owner',
                parsedData: { info: { programData: executableDataAddress }, type: 'program' },
                parsedProgram: 'bpf-upgradeable-loader',
                programData: { authority: upgradeAuthority, slot: 395847597 },
                programDataAddress: executableDataAddress,
                programDataStatus: 'resolved',
                rawDataBytes: null,
            },
            kind: 'bpf-upgradeable-loader',
            resolveProgramName,
        });

        expect(result).toMatchObject({
            entity: {
                address: TOKEN_2022_PROGRAM_ID,
                address_label: 'Token-2022 Program',
                balance_lamports: 567591537,
                executable: true,
                executable_data: executableDataAddress,
                idl: { status: 'unknown' },
                kind: 'bpf-upgradeable-loader',
                last_deployed_slot: 395847597,
                security_metadata: { status: 'unknown' },
                upgrade_authority: upgradeAuthority,
                upgradeable: true,
                verification: { status: 'unknown' },
            },
        });

        expect(new Set(Object.keys(entityOf(result)))).toEqual(
            new Set([
                'address',
                'address_label',
                'balance_lamports',
                'executable',
                'executable_data',
                'idl',
                'kind',
                'last_deployed_slot',
                'multisig',
                'owner_program',
                'security_metadata',
                'upgrade_authority',
                'upgradeable',
                'verification',
            ]),
        );
    });

    it('should build source-unavailable markers deterministically', () => {
        expect(
            buildBpfUpgradeableLoaderPayload({
                account: {
                    address: TOKEN_2022_PROGRAM_ID,
                    executable: true,
                    lamports: 123,
                    owner: 'owner',
                    parsedData: {
                        info: { programData: 'ProgramData1111111111111111111111111111111111' },
                        type: 'program',
                    },
                    parsedProgram: 'bpf-upgradeable-loader',
                    programData: null,
                    programDataAddress: 'ProgramData1111111111111111111111111111111111',
                    programDataStatus: 'source_unavailable',
                    rawDataBytes: null,
                },
                kind: 'bpf-upgradeable-loader',
                resolveProgramName,
            }),
        ).toMatchObject({
            entity: {
                address_label: 'Token-2022 Program',
                executable_data: 'ProgramData1111111111111111111111111111111111',
                kind: 'bpf-upgradeable-loader',
                owner_program: 'BPFLoaderUpgradeab1e11111111111111111111111',
                upgradeable: { reason: 'source_unavailable', status: 'unknown' },
            },
        });
    });

    it('should build frozen program payload with upgradeable false', () => {
        const executableDataAddress = 'DoU57AYuPfu2QU514RktNPG220AhpEjnKxnBcu4HDTY';
        expect(
            buildBpfUpgradeableLoaderPayload({
                account: {
                    address: 'FrozenProg111111111111111111111111111111111',
                    executable: true,
                    lamports: 1000000,
                    owner: 'BPFLoaderUpgradeab1e11111111111111111111111',
                    parsedData: { info: { programData: executableDataAddress }, type: 'program' },
                    parsedProgram: 'bpf-upgradeable-loader',
                    programData: { authority: null, slot: 100000 },
                    programDataAddress: executableDataAddress,
                    programDataStatus: 'resolved',
                    rawDataBytes: null,
                },
                kind: 'bpf-upgradeable-loader',
                resolveProgramName,
            }),
        ).toMatchObject({
            entity: {
                address: 'FrozenProg111111111111111111111111111111111',
                address_label: null,
                balance_lamports: 1000000,
                executable: true,
                executable_data: executableDataAddress,
                kind: 'bpf-upgradeable-loader',
                last_deployed_slot: 100000,
                upgrade_authority: null,
                upgradeable: false,
            },
        });
    });

    it('should return null address_label when no resolver is injected', () => {
        const executableDataAddress = 'PdataAddr111111111111111111111111111111111';
        const result = buildBpfUpgradeableLoaderPayload({
            account: {
                address: TOKEN_2022_PROGRAM_ID,
                executable: true,
                lamports: 5000,
                owner: 'BPFLoaderUpgradeab1e11111111111111111111111',
                parsedData: { info: { programData: executableDataAddress }, type: 'program' },
                parsedProgram: 'bpf-upgradeable-loader',
                programData: { authority: null, slot: 200000 },
                programDataAddress: executableDataAddress,
                programDataStatus: 'resolved',
                rawDataBytes: null,
            },
            kind: 'bpf-upgradeable-loader',
        });

        expect(entityOf(result).address_label).toBeNull();
    });

    it('should pass verificationResult through to entity when present in context', () => {
        const executableDataAddress = 'DoU57AYuPfu2QU514RktNPG220AhpEjnKxnBcu4HDTY';
        const upgradeAuthority = 'AeLnXCBPaQHGWRLr2saFsEVfnMNuKixRAbWCT9P5twgZ';
        const verificationResult = {
            evidence: {
                executable_hash: 'def456',
                is_frozen: false,
                last_verified_at: '2026-01-15T00:00:00Z',
                message: 'Verification information provided by a trusted signer.',
                on_chain_hash: 'abc123',
                repo_url: 'https://github.com/example/repo/tree/abc',
                signer: '5vJwnLeyjV8uNJSp1zn7VLW8GwiQbcsQbGaVSwRmkE4r',
                signer_label: 'Foundation',
            },
            status: 'verified' as const,
        };

        const result = buildBpfUpgradeableLoaderPayload({
            account: {
                address: TOKEN_2022_PROGRAM_ID,
                executable: true,
                lamports: 567591537,
                owner: 'owner',
                parsedData: { info: { programData: executableDataAddress }, type: 'program' },
                parsedProgram: 'bpf-upgradeable-loader',
                programData: { authority: upgradeAuthority, slot: 395847597 },
                programDataAddress: executableDataAddress,
                programDataStatus: 'resolved',
                rawDataBytes: null,
            },
            kind: 'bpf-upgradeable-loader',
            verificationResult,
        });

        expect(entityOf(result).verification).toEqual(verificationResult);
    });

    it('should pass securityMetadataResult through to entity when present in context', () => {
        const securityMetadataResult = {
            data: {
                acknowledgements: null,
                auditors: null,
                contacts: 'email:a@b.com',
                encryption: null,
                expiry: null,
                name: 'Test',
                policy: 'policy',
                preferred_languages: null,
                project_url: 'https://example.com',
                source_code: null,
                source_release: null,
                source_revision: null,
            },
            source_type: 'embedded_security_txt' as const,
            status: 'present' as const,
        };

        const result = buildBpfUpgradeableLoaderPayload({
            account: {
                owner: 'owner',
                parsedData: null,
                parsedProgram: 'bpf-upgradeable-loader',
                programData: null,
                programDataAddress: null,
                programDataStatus: 'missing',
                rawDataBytes: null,
            },
            kind: 'bpf-upgradeable-loader',
            securityMetadataResult,
        });

        expect(entityOf(result).security_metadata).toEqual(securityMetadataResult);
    });

    it('should fall back to unknownMarker when securityMetadataResult is absent', () => {
        const result = buildBpfUpgradeableLoaderPayload({
            account: {
                owner: 'owner',
                parsedData: null,
                parsedProgram: 'bpf-upgradeable-loader',
                programData: null,
                programDataAddress: null,
                programDataStatus: 'missing',
                rawDataBytes: null,
            },
            kind: 'bpf-upgradeable-loader',
        });

        expect(entityOf(result).security_metadata).toEqual({
            reason: 'source_unavailable',
            status: 'unknown',
            value: null,
        });
    });

    it('should output null deployment fields when programData is missing', () => {
        expect(
            buildBpfUpgradeableLoaderPayload({
                account: {
                    owner: 'owner',
                    parsedData: null,
                    parsedProgram: 'bpf-upgradeable-loader',
                    programData: null,
                    programDataAddress: null,
                    programDataStatus: 'missing',
                    rawDataBytes: null,
                },
                kind: 'bpf-upgradeable-loader',
            }),
        ).toMatchObject({
            entity: {
                address: null,
                address_label: null,
                executable_data: null,
                kind: 'bpf-upgradeable-loader',
                last_deployed_slot: null,
                upgrade_authority: null,
                upgradeable: null,
            },
        });
    });

    it('should pass multisigReferenceResult through to entity when present in context', () => {
        const multisigReferenceResult = {
            members: [
                'Mem111111111111111111111111111111111111111',
                'Mem222222222222222222222222222222222222222',
                'Mem333333333333333333333333333333333333333',
            ],
            multisig_address: 'MSIG1111111111111111111111111111111111111111',
            status: 'is_multisig' as const,
            threshold: 2,
            version: 'v3' as const,
        };

        const result = buildBpfUpgradeableLoaderPayload({
            account: {
                owner: 'owner',
                parsedData: null,
                parsedProgram: 'bpf-upgradeable-loader',
                programData: null,
                programDataAddress: null,
                programDataStatus: 'missing',
                rawDataBytes: null,
            },
            kind: 'bpf-upgradeable-loader',
            multisigReferenceResult,
        });

        expect(entityOf(result).multisig).toEqual(multisigReferenceResult);
    });

    it('should pass not_multisig result through to entity', () => {
        const result = buildBpfUpgradeableLoaderPayload({
            account: {
                owner: 'owner',
                parsedData: null,
                parsedProgram: 'bpf-upgradeable-loader',
                programData: null,
                programDataAddress: null,
                programDataStatus: 'missing',
                rawDataBytes: null,
            },
            kind: 'bpf-upgradeable-loader',
            multisigReferenceResult: { status: 'not_multisig' },
        });

        expect(entityOf(result).multisig).toEqual({ status: 'not_multisig' });
    });

    it('should fall back to unknownMarker when multisigReferenceResult is absent', () => {
        const result = buildBpfUpgradeableLoaderPayload({
            account: {
                owner: 'owner',
                parsedData: null,
                parsedProgram: 'bpf-upgradeable-loader',
                programData: null,
                programDataAddress: null,
                programDataStatus: 'missing',
                rawDataBytes: null,
            },
            kind: 'bpf-upgradeable-loader',
        });

        expect(entityOf(result).multisig).toEqual({
            reason: 'source_unavailable',
            status: 'unknown',
            value: null,
        });
    });

    it('should pass idlDiscoveryResult through to entity when present in context', () => {
        const idlDiscoveryResult = {
            data: {
                address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                instructions: [],
                metadata: { name: 'test_program', spec: '0.1.0' },
            },
            idl_type: 'anchor' as const,
            program_name: 'test_program',
            source_type: 'pmp_canonical' as const,
            status: 'found' as const,
        };

        const result = buildBpfUpgradeableLoaderPayload({
            account: {
                owner: 'owner',
                parsedData: null,
                parsedProgram: 'bpf-upgradeable-loader',
                programData: null,
                programDataAddress: null,
                programDataStatus: 'missing',
                rawDataBytes: null,
            },
            idlDiscoveryResult,
            kind: 'bpf-upgradeable-loader',
        });

        expect(entityOf(result).idl).toEqual(idlDiscoveryResult);
    });

    it('should fall back to unknownMarker when idlDiscoveryResult is absent', () => {
        const result = buildBpfUpgradeableLoaderPayload({
            account: {
                owner: 'owner',
                parsedData: null,
                parsedProgram: 'bpf-upgradeable-loader',
                programData: null,
                programDataAddress: null,
                programDataStatus: 'missing',
                rawDataBytes: null,
            },
            kind: 'bpf-upgradeable-loader',
        });

        expect(entityOf(result).idl).toEqual({
            reason: 'source_unavailable',
            status: 'unknown',
            value: null,
        });
    });
});
