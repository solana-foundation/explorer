import type { AnchorIdl } from '@entities/idl';
import { formatDisplayIdl, getFormattedIdl, useFormatAnchorIdl } from '@entities/idl';

import { invariant } from '@/app/shared/lib/invariant';

import { useSearchIdl } from '../model/search';
import { BaseFormattedIdl } from './BaseFormattedIdl';
import type { StandardFormattedIdlProps } from './types';

export function AnchorFormattedIdl({ idl, source, programId, searchStr = '' }: StandardFormattedIdlProps<AnchorIdl>) {
    invariant(idl, 'IDL is absent');
    const formattedIdl = getFormattedIdl(formatDisplayIdl, idl, programId);
    const anchorFormattedIdl = useFormatAnchorIdl(idl ? formattedIdl : idl);
    const searchResults = useSearchIdl(anchorFormattedIdl, searchStr);
    return (
        <BaseFormattedIdl
            idl={searchResults}
            originalIdl={idl}
            source={source}
            programId={programId}
            searchStr={searchStr}
        />
    );
}
