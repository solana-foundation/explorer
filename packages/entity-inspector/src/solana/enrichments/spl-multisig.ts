import type { SupportedCluster } from '../../config.js';
import { type InspectorLogger, ns } from '../../logger.js';
import { normalizeAccountProbe } from '../account-normalizer.js';
import { asRecord, asSafeNumeric, asString } from '../parse-helpers.js';
import type { RpcClient } from '../rpc.js';
import type { MultisigReferenceResult } from '../types.js';

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
        if (parsedProgram !== 'spl-token' && parsedProgram !== 'spl-token-2022') {
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
            version: parsedProgram === 'spl-token' ? 'spl-token' : 'spl-token-2022',
        };
    } catch (error) {
        logger.warn(ns('spl multisig resolve failed'), { address, error });
        return { reason: 'source_unavailable', status: 'unknown' };
    }
}
