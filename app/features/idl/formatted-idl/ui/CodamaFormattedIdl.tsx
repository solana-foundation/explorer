import type { CodamaIdl } from '@entities/idl';
import { useFormatCodamaIdl } from '@entities/idl';

import { invariant } from '../lib/invariant';
import { useSearchIdl } from '../model/search';
import { BaseFormattedIdl } from './BaseFormattedIdl';
import type { StandardFormattedIdlProps } from './types';

export function CodamaFormattedIdl({ idl, searchStr = '' }: StandardFormattedIdlProps<CodamaIdl>) {
    invariant(idl, 'IDL is absent');
    const formattedIdl = useFormatCodamaIdl(idl);
    const searchResults = useSearchIdl(formattedIdl, searchStr);
    return <BaseFormattedIdl idl={searchResults} originalIdl={idl} searchStr={searchStr} />;
}
