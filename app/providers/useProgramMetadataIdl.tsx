import { fetch } from 'cross-fetch';
import useSWRImmutable from 'swr/immutable';

import { isEnvEnabled } from '@/app/utils/env';
import Logger from '@/app/utils/logger';

import { getProgramMetadataIdl } from '../components/instruction/codama/getProgramMetadataIdl';
import { Cluster } from '../utils/cluster';

const PMP_IDL_ENABLED = isEnvEnabled(process.env.NEXT_PUBLIC_PMP_IDL_ENABLED);

// TODO: write tests
export function useProgramMetadataIdl(programAddress: string, url: string, cluster: Cluster, useSuspense = false) {
    const { data } = useSWRImmutable(
        `program-metadata-idl-${programAddress}-${url}`,
        async () => {
            if (!PMP_IDL_ENABLED) {
                return null;
            }

            try {
                const response = await fetch(
                    `/api/programMetadataIdl?programAddress=${programAddress}&cluster=${cluster}`
                );
                if (response.ok) {
                    const data = await response.json();
                    const { details, codamaIdl } = data;

                    // In case of 403, we have ok response but it contains {details: {error: string}} data
                    if (details?.error) {
                        Logger.error(new Error(details.error));
                        return null;
                    }

                    return codamaIdl || null;
                }
                // Only attempt to fetch client side if the url is localhost or 127.0.0.1
                const { hostname } = new URL(url);
                if (hostname === 'localhost' || hostname === '127.0.0.1') {
                    return getProgramMetadataIdl(programAddress, url);
                }
                return null;
            } catch (error) {
                Logger.error('Error fetching codama idl', error);
                return null;
            }
        },
        { suspense: useSuspense }
    );
    return { programMetadataIdl: data };
}
