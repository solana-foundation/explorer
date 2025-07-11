import { fetch } from 'cross-fetch';
import useSWRImmutable from 'swr/immutable';

import { getProgramMetadataIdl } from '../components/instruction/codama/getProgramMetadataIdl';
import { Cluster } from '../utils/cluster';

const PMP_IDL_ENABLED = process.env.NEXT_PUBLIC_PMP_IDL_ENABLED === 'true';

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
                    return response.json().then(data => data.codamaIdl);
                }
                // Only attempt to fetch client side if the url is localhost or 127.0.0.1
                if (new URL(url).hostname === 'localhost' || new URL(url).hostname === '127.0.0.1') {
                    return getProgramMetadataIdl(programAddress, url);
                }
                return null;
            } catch (error) {
                console.error('Error fetching codama idl', error);
                return null;
            }
        },
        { suspense: useSuspense }
    );
    return { programMetadataIdl: data };
}
