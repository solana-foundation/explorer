import type { ReadonlyUint8Array } from '@solana/kit';

import type { SupportedCluster } from '../config.js';
import { consoleLogger, type InspectorLogger } from '../logger.js';
import { base64Encoder } from './codecs.js';
import { asRecord, asSafeNumeric, asString } from './parse-helpers.js';
import { isSourceUnavailableError } from './rpc.js';
import type { AccountProbeEnvelope, NormalizedAccountInfo, NormalizedProgramDataInfo } from './types.js';

export function extractRawDataBytesFromAccountData(
    data: unknown,
    logger: InspectorLogger = consoleLogger,
): ReadonlyUint8Array | null {
    if (!Array.isArray(data) || data.length < 2) {
        return null;
    }

    const [encodedData, encoding] = data;
    if (typeof encodedData !== 'string' || encoding !== 'base64') {
        return null;
    }

    try {
        return base64Encoder().encode(encodedData);
    } catch (error) {
        logger.warn('[entity-inspector] base64 decode of account data failed', { error });
        return null;
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

    return {
        address,
        executable: accountValue.executable,
        lamports: asSafeNumeric(accountValue.lamports),
        owner: accountValue.owner,
        parsedData,
        parsedProgram: parsedDataContainer?.program ?? null,
        programData: normalizedProgramData,
        programDataAddress: extractProgramDataAddress(parsedData),
        programDataStatus: normalizedProgramData ? 'resolved' : 'missing',
        rawDataBytes: extractRawDataBytesFromAccountData(data),
    };
}

type AccountFetcher = (address: string, cluster: SupportedCluster) => Promise<AccountProbeEnvelope>;

export async function enrichUpgradeableProgramData(
    account: NormalizedAccountInfo,
    cluster: SupportedCluster,
    fetchAccount: AccountFetcher,
    logger: InspectorLogger = consoleLogger,
): Promise<NormalizedAccountInfo> {
    if (account.parsedProgram !== 'bpf-upgradeable-loader') {
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
            normalizedProgramDataAccount.parsedProgram !== 'bpf-upgradeable-loader'
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
            logger.warn('[entity-inspector] program data enrichment source unavailable', {
                error,
                programAddress: account.address,
            });
            return { ...account, programDataStatus: 'source_unavailable' };
        }

        logger.warn('[entity-inspector] program data enrichment failed', {
            error,
            programAddress: account.address,
        });
        return { ...account, programDataStatus: 'source_unavailable' };
    }
}
