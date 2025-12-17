import type { Idl } from '@coral-xyz/anchor';
import type { RootNode } from 'codama';

import { getIdlSpecType as getSerdeIdlSpecType } from './converters/convert-legacy-idl';

export type IdlVersion = 'Legacy' | '0.30.1' | RootNode['version'];

export function getIdlVersion(idl: RootNode | Idl): IdlVersion {
    const spec = getSerdeIdlSpecType(idl);
    switch (spec) {
        case 'legacy':
            return 'Legacy';
        case 'codama':
            return (idl as RootNode).version;
        default:
            return '0.30.1';
    }
}
