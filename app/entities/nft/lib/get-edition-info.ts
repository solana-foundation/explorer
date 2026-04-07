import {
    deserializeEdition,
    deserializeMasterEdition,
    fetchMasterEdition,
    findMasterEditionPda,
    Key,
    type Metadata,
} from '@metaplex-foundation/mpl-token-metadata';

import type { EditionInfo } from './types';
import { getUmi } from './umi';

export default async function getEditionInfo(metadata: Metadata, rpcEndpoint: string): Promise<EditionInfo> {
    try {
        const umi = getUmi(rpcEndpoint);
        const editionPda = findMasterEditionPda(umi, { mint: metadata.mint });
        const editionAccount = await umi.rpc.getAccount(editionPda[0]);

        if (editionAccount.exists) {
            if (editionAccount.data[0] === Key.MasterEditionV1 || editionAccount.data[0] === Key.MasterEditionV2) {
                return {
                    edition: undefined,
                    masterEdition: deserializeMasterEdition(editionAccount),
                };
            } else if (editionAccount.data[0] === Key.EditionV1) {
                const editionData = deserializeEdition(editionAccount);
                return {
                    edition: editionData,
                    masterEdition: await fetchMasterEdition(umi, editionData.parent),
                };
            }
        }
    } catch {
        /* ignore */
    }

    return {
        edition: undefined,
        masterEdition: undefined,
    };
}
