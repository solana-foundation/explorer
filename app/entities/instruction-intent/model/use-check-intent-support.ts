import 'client-only';

import { useCluster } from '@entities/cluster/@x/instruction-intent';
import { useProgramIdls } from '@entities/idl/@x/instruction-intent';
import { useMemo } from 'react';

import { checkIntentSupport, type IntentSupportResult } from '../lib/intent';

/** Whether the program's Program Metadata IDL can produce intents. */
export function useCheckIntentSupport(programId: string): IntentSupportResult {
    const { cluster, url } = useCluster();
    const { programMetadataIdl, isLoading, error } = useProgramIdls(programId, url, cluster);
    const intentSupportStatus = useMemo(() => checkIntentSupport(programMetadataIdl), [programMetadataIdl]);

    // SWR retries a failed IDL fetch on its own, and the card stays failed until a retry succeeds
    if (error) return { status: 'failed' };
    if (isLoading) return { status: 'loading' };
    return intentSupportStatus;
}
