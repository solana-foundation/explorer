import { Idl } from '@coral-xyz/anchor';
import { formatDisplayIdl, getFormattedIdl, useFormatAnchorIdl } from '@entities/idl';

import { invariant } from '../lib/invariant';
import { useSearchIdl } from '../model/search';
import { BaseFormattedIdl } from './BaseFormattedIdl';
import type { StandardFormattedIdlProps } from './types';

export function AnchorFormattedIdl({ idl, programId, searchStr = '' }: StandardFormattedIdlProps<Idl>) {
    invariant(idl, 'IDL is absent');
    const formattedIdl = getFormattedIdl(formatDisplayIdl, idl, programId);
    const anchorFormattedIdl = useFormatAnchorIdl(idl ? formattedIdl : idl);
    const searchResults = useSearchIdl(anchorFormattedIdl, searchStr);
    return <BaseFormattedIdl idl={searchResults} originalIdl={idl} searchStr={searchStr} />;
}
