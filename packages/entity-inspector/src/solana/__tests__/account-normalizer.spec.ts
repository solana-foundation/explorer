import { describe, expect, it, vi } from 'vitest';

import type { InspectorLogger } from '../../logger.js';
import {
    enrichUpgradeableProgramData,
    extractProgramDataInfo,
    extractProgramDataRawBase64,
    extractRawDataBytesFromAccountData,
    normalizeAccountProbe,
} from '../account-normalizer.js';
import { SourceUnavailableError } from '../rpc.js';
import {
    notFoundAccountProbe,
    parsedAccountProbe,
    rawAccountProbe,
    upgradeableProgramAccount,
    upgradeableProgramDataProbe,
} from './account-fixtures.js';

const BASE64_BYTES = btoa(String.fromCharCode(1, 2, 3, 4));

function createLoggerMock(): InspectorLogger {
    return { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() };
}

describe('inspect-entity account normalizer', () => {
    it('should extract raw data bytes from same-response base64 tuple', () => {
        const rawBytes = extractRawDataBytesFromAccountData([BASE64_BYTES, 'base64']);

        expect(rawBytes).toEqual(new Uint8Array([1, 2, 3, 4]));
        expect(extractRawDataBytesFromAccountData(['abc', 'jsonParsed'])).toBeNull();
    });

    it('should return null for non-tuple account data shapes', () => {
        expect(extractRawDataBytesFromAccountData(null)).toBeNull();
        expect(extractRawDataBytesFromAccountData(['only-one'])).toBeNull();
        expect(extractRawDataBytesFromAccountData([42, 'base64'])).toBeNull();
    });

    it('should warn and return null when base64 decoding fails', () => {
        const logger = createLoggerMock();

        expect(extractRawDataBytesFromAccountData(['@@invalid@@', 'base64'], logger)).toBeNull();
        expect(logger.warn).toHaveBeenCalledWith(
            '[entity-inspector] base64 decode of account data failed',
            expect.objectContaining({ error: expect.any(Error) }),
        );
    });

    it('should warn through the console logger by default', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        expect(extractRawDataBytesFromAccountData(['@@invalid@@', 'base64'])).toBeNull();
        expect(warnSpy).toHaveBeenCalled();

        warnSpy.mockRestore();
    });

    it('should return null when envelope value is null', () => {
        expect(normalizeAccountProbe('addr', notFoundAccountProbe())).toBeNull();
    });

    it('should normalize account probes with parsed and raw fields', () => {
        const parsedEnvelope = parsedAccountProbe({
            executable: true,
            lamports: 99,
            owner: 'Owner111111111111111111111111111111111111',
            parsed: {
                info: { programData: 'ProgramData1111111111111111111111111111111111' },
                type: 'program',
            },
            program: 'bpf-upgradeable-loader',
        });

        expect(normalizeAccountProbe('addr', parsedEnvelope)).toMatchObject({
            address: 'addr',
            executable: true,
            lamports: 99,
            owner: 'Owner111111111111111111111111111111111111',
            parsedProgram: 'bpf-upgradeable-loader',
            programDataAddress: 'ProgramData1111111111111111111111111111111111',
            programDataStatus: 'missing',
        });

        const rawEnvelope = rawAccountProbe({
            bytes: new Uint8Array([1, 2, 3, 4]),
            owner: 'Owner111111111111111111111111111111111111',
        });

        expect(normalizeAccountProbe('addr', rawEnvelope)).toMatchObject({
            rawDataBytes: new Uint8Array([1, 2, 3, 4]),
        });
    });

    it('should preserve large BigInt lamports as string', () => {
        const envelope = rawAccountProbe({
            bytes: new Uint8Array(0),
            lamports: 9_007_199_254_740_993n,
            owner: 'Owner111111111111111111111111111111111111',
        });

        const result = normalizeAccountProbe('addr', envelope);
        expect(result?.lamports).toBe('9007199254740993');
    });

    it('should extract programData info for authority and authority-null branches', () => {
        expect(
            extractProgramDataInfo({
                info: { authority: 'Authority1111111111111111111111111111111111', slot: 7 },
                type: 'programData',
            }),
        ).toEqual({ authority: 'Authority1111111111111111111111111111111111', slot: 7 });

        expect(
            extractProgramDataInfo({
                info: { authority: null, slot: 8 },
                type: 'programData',
            }),
        ).toEqual({ authority: null, slot: 8 });
    });

    it('should return null for invalid programData payloads', () => {
        expect(extractProgramDataInfo({ info: {}, type: 'program' })).toBeNull();
        expect(
            extractProgramDataInfo({
                info: { authority: 'Authority1111111111111111111111111111111111' },
                type: 'programData',
            }),
        ).toBeNull();
        expect(extractProgramDataInfo({ info: { authority: '', slot: 9 }, type: 'programData' })).toBeNull();
    });

    it('should extract raw base64 only from complete programData payloads', () => {
        expect(
            extractProgramDataRawBase64({
                info: { data: [BASE64_BYTES, 'base64'] },
                type: 'programData',
            }),
        ).toBe(BASE64_BYTES);

        expect(extractProgramDataRawBase64({ info: {}, type: 'program' })).toBeNull();
        expect(extractProgramDataRawBase64({ info: {}, type: 'programData' })).toBeNull();
        expect(extractProgramDataRawBase64({ info: { data: ['only-one'] }, type: 'programData' })).toBeNull();
        expect(extractProgramDataRawBase64({ info: { data: [42, 'base64'] }, type: 'programData' })).toBeNull();
        expect(
            extractProgramDataRawBase64({ info: { data: [BASE64_BYTES, 'base58'] }, type: 'programData' }),
        ).toBeNull();
    });

    it('should pass through accounts that are not upgradeable programs', async () => {
        const account = upgradeableProgramAccount({ parsedProgram: 'spl-token' });
        const fetchAccount = vi.fn();

        const enriched = await enrichUpgradeableProgramData(account, 'mainnet-beta', fetchAccount);

        expect(enriched).toBe(account);
        expect(fetchAccount).not.toHaveBeenCalled();
    });

    it('should mark accounts with already-parsed programData as resolved without fetching', async () => {
        const account = upgradeableProgramAccount({
            programData: { authority: null, slot: 5 },
        });
        const fetchAccount = vi.fn();

        const enriched = await enrichUpgradeableProgramData(account, 'mainnet-beta', fetchAccount);

        expect(enriched.programDataStatus).toBe('resolved');
        expect(fetchAccount).not.toHaveBeenCalled();
    });

    it('should mark accounts without a programData address as missing', async () => {
        const account = upgradeableProgramAccount({ programDataAddress: null });

        const enriched = await enrichUpgradeableProgramData(account, 'mainnet-beta', vi.fn());

        expect(enriched.programDataStatus).toBe('missing');
    });

    it('should preserve programDataRawBase64 when enriching upgradeable program data', async () => {
        const account = upgradeableProgramAccount();
        const fetchAccount = vi.fn().mockResolvedValue(
            upgradeableProgramDataProbe({
                authority: 'Auth11111111111111111111111111111111111111111',
                dataBase64: BASE64_BYTES,
                slot: 100,
            }),
        );

        const enriched = await enrichUpgradeableProgramData(account, 'mainnet-beta', fetchAccount);

        expect(enriched.programDataRawBase64).toBe(BASE64_BYTES);
        expect(enriched.programDataStatus).toBe('resolved');
    });

    it('should mark programData as missing when the fetched account does not exist', async () => {
        const account = upgradeableProgramAccount();
        const fetchAccount = vi.fn().mockResolvedValue(notFoundAccountProbe());

        const enriched = await enrichUpgradeableProgramData(account, 'mainnet-beta', fetchAccount);

        expect(enriched.programDataStatus).toBe('missing');
    });

    it('should mark programData as missing when the fetched account is not owned by the loader', async () => {
        const account = upgradeableProgramAccount();
        const fetchAccount = vi.fn().mockResolvedValue(
            parsedAccountProbe({
                owner: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                parsed: { info: {}, type: 'programData' },
                program: 'spl-token',
            }),
        );

        const enriched = await enrichUpgradeableProgramData(account, 'mainnet-beta', fetchAccount);

        expect(enriched.programDataStatus).toBe('missing');
    });

    it('should mark programData as missing when the fetched payload is incomplete', async () => {
        const account = upgradeableProgramAccount();
        const fetchAccount = vi.fn().mockResolvedValue(
            parsedAccountProbe({
                owner: 'BPFLoaderUpgradeab1e11111111111111111111111',
                parsed: { info: { authority: null }, type: 'programData' },
                program: 'bpf-upgradeable-loader',
            }),
        );

        const enriched = await enrichUpgradeableProgramData(account, 'mainnet-beta', fetchAccount);

        expect(enriched.programDataStatus).toBe('missing');
    });

    it('should log a warning when fetchAccount throws SourceUnavailableError', async () => {
        const logger = createLoggerMock();
        const account = upgradeableProgramAccount({
            address: 'Program111111111111111111111111111111111111',
        });
        const rpcError = new SourceUnavailableError('RPC down');
        const fetchAccount = vi.fn().mockRejectedValue(rpcError);

        const enriched = await enrichUpgradeableProgramData(account, 'mainnet-beta', fetchAccount, logger);

        expect(enriched.programDataStatus).toBe('source_unavailable');
        expect(logger.warn).toHaveBeenCalledWith('[entity-inspector] program data enrichment source unavailable', {
            error: rpcError,
            programAddress: 'Program111111111111111111111111111111111111',
        });
    });

    it('should return source_unavailable when fetchAccount throws non-SourceUnavailableError', async () => {
        const logger = createLoggerMock();
        const account = upgradeableProgramAccount();
        const fetchAccount = vi.fn().mockRejectedValue(new TypeError('unexpected shape'));

        const enriched = await enrichUpgradeableProgramData(account, 'mainnet-beta', fetchAccount, logger);

        expect(enriched.programDataStatus).toBe('source_unavailable');
        expect(logger.warn).toHaveBeenCalledWith(
            '[entity-inspector] program data enrichment failed',
            expect.objectContaining({ error: expect.any(TypeError) }),
        );
    });
});
