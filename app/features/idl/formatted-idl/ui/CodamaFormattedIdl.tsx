import type { CodamaIdl } from '@entities/idl';
import { useFormatCodamaIdl } from '@entities/idl';

import { invariant } from '@/app/shared/lib/invariant';

import { useSearchIdl } from '../model/search';
import { BaseFormattedIdl } from './BaseFormattedIdl';
import type { StandardFormattedIdlProps } from './types';

export function CodamaFormattedIdl({ idl, source, searchStr = '' }: StandardFormattedIdlProps<CodamaIdl>) {
    invariant(idl, 'IDL is absent');
    const formattedIdl = useFormatCodamaIdl(idl);
    const searchResults = useSearchIdl(formattedIdl, searchStr);
    return <BaseFormattedIdl idl={searchResults} originalIdl={idl} source={source} searchStr={searchStr} />;
}
