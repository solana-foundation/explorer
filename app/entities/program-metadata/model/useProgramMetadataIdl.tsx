import { Cluster } from '@/app/utils/cluster';
import { isEnvEnabled } from '@/app/utils/env';

import { IDL_SEED } from '../api/getProgramCanonicalMetadata';
import { useProgramCanonicalMetadata } from './useProgramCanonicalMetadata';

const PMP_IDL_ENABLED = isEnvEnabled(process.env.NEXT_PUBLIC_PMP_IDL_ENABLED);

export function useProgramMetadataIdl(programAddress: string, url: string, cluster: Cluster, useSuspense = false) {
    const { programMetadata } = useProgramCanonicalMetadata(
        programAddress,
        IDL_SEED,
        url,
        cluster,
        PMP_IDL_ENABLED,
        useSuspense
    );
    return { programMetadataIdl: programMetadata };
}
