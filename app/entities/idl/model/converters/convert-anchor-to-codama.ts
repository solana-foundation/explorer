import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';

import { type AnchorIdl, type CodamaIdl } from '../../lib/types';

export function convertAnchorToCodama(idl: AnchorIdl): CodamaIdl | undefined {
    try {
        // `rootNodeFromAnchor`'s node types are version-skewed from our `codama` import, hence the bridge casts.
        return rootNodeFromAnchor(idl as unknown as Parameters<typeof rootNodeFromAnchor>[0]) as unknown as CodamaIdl;
    } catch {
        return undefined;
    }
}
