import { isTokenProgram } from '@explorer/parsers';

import type { SupportedCluster } from '../config.js';
import { type InspectorLogger, ns } from '../logger.js';
import { normalizeAccountProbe } from '../accounts/account-normalizer.js';
import { asRecord, asSafeNumeric, asString } from '../shared/parse-helpers.js';
import type { RpcClient } from '../rpc/rpc.js';
import type { MultisigReferenceResult } from './types.js';

export type SplMultisigDependencies = {
    fetchAccountInfo: RpcClient['fetchAccountInfo'];
    logger: InspectorLogger;
};

export async function resolveSplMultisigReference(
    address: string,
    cluster: SupportedCluster,
    dependencies: SplMultisigDependencies,
): Promise<MultisigReferenceResult> {
    const { fetchAccountInfo, logger } = dependencies;
    try {
        const envelope = await fetchAccountInfo(address, cluster);
        const account = normalizeAccountProbe(address, envelope);

        if (!account) {
            return { status: 'not_multisig' };
        }

        const { parsedProgram } = account;
        if (parsedProgram === null || !isTokenProgram(parsedProgram)) {
            return { status: 'not_multisig' };
        }

        const parsedRecord = asRecord(account.parsedData);
        if (asString(parsedRecord?.type) !== 'multisig') {
            return { status: 'not_multisig' };
        }

        const parsedInfo = asRecord(parsedRecord?.info);
        const threshold = asSafeNumeric(parsedInfo?.numRequiredSigners);
        const rawSigners = parsedInfo?.signers;
        const members = Array.isArray(rawSigners)
            ? rawSigners.flatMap(entry => {
                  const signer = asString(entry);
                  return signer ? [signer] : [];
              })
            : null;

        return {
            members,
            multisig_address: address,
            status: 'is_multisig',
            threshold,
            version: parsedProgram,
        };
    } catch (error) {
        logger.warn(ns('spl multisig resolve failed'), { address, error });
        return { reason: 'source_unavailable', status: 'unknown' };
    }
}
