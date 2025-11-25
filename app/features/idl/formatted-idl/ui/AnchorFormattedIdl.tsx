import { Idl } from '@coral-xyz/anchor';

// TODO: Move to entities/feature
import { useFormatAnchorIdl } from '@/app/components/account/idl/formatted-idl/formatters/anchor';
import { formatDisplayIdl, getFormattedIdl } from '@/app/utils/convertLegacyIdl';

import { useSearchIdl } from '../model/search';
import { BaseFormattedIdl } from './BaseFormattedIdl';
import type { StandardFormattedIdlProps } from './types';

export function AnchorFormattedIdl({ idl, programId, searchStr = '' }: StandardFormattedIdlProps<Idl>) {
    const formattedIdl = getFormattedIdl(formatDisplayIdl, idl, programId);
    const anchorFormattedIdl = useFormatAnchorIdl(idl ? formattedIdl : idl);
    const searchResults = useSearchIdl(anchorFormattedIdl, searchStr);
    return <BaseFormattedIdl idl={searchResults} searchStr={searchStr} />;
}
