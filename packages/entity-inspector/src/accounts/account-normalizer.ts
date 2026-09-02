import { BPF_UPGRADEABLE_LOADER_PROGRAM_LABEL } from '@explorer/parsers';
import type { ReadonlyUint8Array } from '@solana/kit';

import type { SupportedCluster } from '../config.js';
import { type InspectorLogger, ns } from '../logger.js';
import { base64Encoder } from '../rpc/codecs.js';
import { isSourceUnavailableError } from '../rpc/rpc.js';
import type { AccountProbeEnvelope } from '../rpc/types.js';
import { asRecord, asSafeNumeric, asString } from '../shared/parse-helpers.js';
import { err, ok, type Result, toError } from '../shared/result.js';
import type { NormalizedAccountInfo, NormalizedProgramDataInfo } from './types.js';

export function extractRawDataBytesFromAccountData(data: unknown): Result<ReadonlyUint8Array | null> {
    if (!Array.isArray(data) || data.length < 2) {
        return ok(null);
    }

    const [encodedData, encoding] = data;
    if (typeof encodedData !== 'string' || encoding !== 'base64') {
        return ok(null);
    }

    try {
        return ok(base64Encoder().encode(encodedData));
    } catch (error) {
        return err(toError(error));
    }
}

function extractProgramDataAddress(parsedData: unknown): string | null {
    const parsedRecord = asRecord(parsedData);
    if (asString(parsedRecord?.type) !== 'program') {
        return null;
    }
    return asString(asRecord(parsedRecord?.info)?.programData);
}

export function extractProgramDataRawBase64(parsedData: unknown): string | null {
    const parsedRecord = asRecord(parsedData);
    if (asString(parsedRecord?.type) !== 'programData') return null;
    const info = asRecord(parsedRecord?.info);
    const data = info?.data;
    if (!Array.isArray(data) || data.length < 2) return null;
    if (typeof data[0] !== 'string' || data[1] !== 'base64') return null;
    return data[0];
}

export function extractProgramDataInfo(parsedData: unknown): NormalizedProgramDataInfo | null {
    const parsedRecord = asRecord(parsedData);
    if (asString(parsedRecord?.type) !== 'programData') {
        return null;
    }

    const info = asRecord(parsedRecord?.info);
    const slot = asSafeNumeric(info?.slot);
    if (slot === null) {
        return null;
    }

    if (info?.authority === null) {
        return { authority: null, slot };
    }

    const authority = asString(info?.authority);
    if (!authority) {
        return null;
    }

    return { authority, slot };
}

// Deliberately NOT kit's parseJsonRpcAccount/MaybeAccount — payload parity with explorer-mcp requires the NormalizedAccountInfo contract.
export function normalizeAccountProbe(address: string, envelope: AccountProbeEnvelope): NormalizedAccountInfo | null {
    // Strict null on purpose: null means "account not found"; a malformed envelope (value undefined) must
    // throw on the property access below so the caller reports INTERNAL_ERROR, not NOT_FOUND.
    const accountValue = envelope.value;
    if (accountValue === null) {
        return null;
    }

    const data = accountValue.data;
    const parsedDataContainer = Array.isArray(data) ? null : data;
    const parsedData = parsedDataContainer?.parsed ?? null;
    const normalizedProgramData = extractProgramDataInfo(parsedData);
    // Malformed base64 → error branch (value undefined); treated as absent like a non-base64 shape.
    const [, rawDataBytes] = extractRawDataBytesFromAccountData(data);
    // Kept even when the byte decode fails — downstream parsers judge the string themselves.
    const [rawEncoded, rawEncoding] = Array.isArray(data) ? data : [];

    const base = {
        address,
        executable: accountValue.executable,
        lamports: asSafeNumeric(accountValue.lamports),
        owner: accountValue.owner,
        parsedData,
        parsedProgram: parsedDataContainer?.program ?? null,
        programDataAddress: extractProgramDataAddress(parsedData),
        rawDataBase64: typeof rawEncoded === 'string' && rawEncoding === 'base64' ? rawEncoded : null,
        rawDataBytes: rawDataBytes ?? null,
    };

    return normalizedProgramData
        ? { ...base, programData: normalizedProgramData, programDataStatus: 'resolved' }
        : { ...base, programDataStatus: 'missing' };
}

type AccountFetcher = (address: string, cluster: SupportedCluster) => Promise<AccountProbeEnvelope>;

export async function enrichUpgradeableProgramData(
    account: NormalizedAccountInfo,
    cluster: SupportedCluster,
    fetchAccount: AccountFetcher,
    logger: InspectorLogger,
): Promise<NormalizedAccountInfo> {
    if (account.parsedProgram !== BPF_UPGRADEABLE_LOADER_PROGRAM_LABEL) {
        return account;
    }

    if (account.programData) {
        return { ...account, programDataStatus: 'resolved' };
    }

    const programDataAddress = account.programDataAddress;
    if (!programDataAddress) {
        return { ...account, programDataStatus: 'missing' };
    }

    try {
        const programDataProbe = await fetchAccount(programDataAddress, cluster);
        const normalizedProgramDataAccount = normalizeAccountProbe(programDataAddress, programDataProbe);

        if (
            normalizedProgramDataAccount === null ||
            normalizedProgramDataAccount.parsedProgram !== BPF_UPGRADEABLE_LOADER_PROGRAM_LABEL
        ) {
            return { ...account, programDataStatus: 'missing' };
        }

        const parsedProgramData = extractProgramDataInfo(normalizedProgramDataAccount.parsedData);
        if (!parsedProgramData) {
            return { ...account, programDataStatus: 'missing' };
        }

        return {
            ...account,
            programData: parsedProgramData,
            programDataRawBase64: extractProgramDataRawBase64(normalizedProgramDataAccount.parsedData),
            programDataStatus: 'resolved',
        };
    } catch (error) {
        if (isSourceUnavailableError(error)) {
            logger.warn(ns('program data enrichment source unavailable'), {
                error,
                programAddress: account.address,
            });
            return { ...account, programDataStatus: 'source_unavailable' };
        }

        logger.warn(ns('program data enrichment failed'), {
            error,
            programAddress: account.address,
        });
        return { ...account, programDataStatus: 'source_unavailable' };
    }
}
