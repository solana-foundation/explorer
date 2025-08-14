import useSWRImmutable from 'swr/immutable';

import { fetchProgramMetadataIdl } from '../components/instruction/codama/getProgramMetadataIdl';
import { Cluster } from '../utils/cluster';

export function useProgramMetadataIdl(programAddress: string, url: string, cluster: Cluster, useSuspense = false) {
    const { data } = useSWRImmutable(
        `program-metadata-idl-${programAddress}-${url}`,
        async () => fetchProgramMetadataIdl(programAddress, url, cluster),
        { suspense: useSuspense }
    );
    return { programMetadataIdl: data };
}
