import { Cluster } from '@/app/utils/cluster';
import { isEnvEnabled } from '@/app/utils/env';

import { SECURITY_TXT_SEED } from '../api/getProgramCanonicalMetadata';
import { useProgramCanonicalMetadata } from './useProgramCanonicalMetadata';

const PMP_SECURITY_TXT_ENABLED = isEnvEnabled(process.env.NEXT_PUBLIC_PMP_SECURITY_TXT_ENABLED);

export function useProgramMetadataSecurityTxt(
    programAddress: string,
    url: string,
    cluster: Cluster,
    useSuspense = false
) {
    const { programMetadata } = useProgramCanonicalMetadata(
        programAddress,
        SECURITY_TXT_SEED,
        url,
        cluster,
        PMP_SECURITY_TXT_ENABLED,
        useSuspense
    );
    return { programMetadataSecurityTxt: programMetadata };
}
