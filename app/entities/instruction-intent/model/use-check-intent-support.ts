import 'client-only';

import { useCluster } from '@entities/cluster/@x/instruction-intent';
import { isProgramMetadataSource, useProgramIdls } from '@entities/idl/@x/instruction-intent';
import { useMemo } from 'react';

import { checkIntentSupport, type IntentSupportResult } from '../lib/intent';

export function useCheckIntentSupport(programId: string): IntentSupportResult {
    const { cluster, url } = useCluster();
    const { idls, error } = useProgramIdls(programId, url, cluster);
    const programMetadataIdl = idls?.find(isProgramMetadataSource)?.idl;
    const intentSupportStatus = useMemo(() => checkIntentSupport(programMetadataIdl), [programMetadataIdl]);

    // The error stays set while SWR retries, so the card stays failed until a retry succeeds
    if (error) return { status: 'failed' };
    if (!idls) return { status: 'loading' };
    return intentSupportStatus;
}
