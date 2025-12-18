import { useFormatCodamaIdl } from '@entities/idl';
import type { RootNode } from 'codama';

import { invariant } from '../lib/invariant';
import { useSearchIdl } from '../model/search';
import { BaseFormattedIdl } from './BaseFormattedIdl';

export function CodamaFormattedIdl({ idl, searchStr = '' }: { idl?: RootNode; searchStr?: string }) {
    invariant(idl, 'IDL is absent');
    const formattedIdl = useFormatCodamaIdl(idl);
    const searchResults = useSearchIdl(formattedIdl, searchStr);
    return <BaseFormattedIdl idl={searchResults} searchStr={searchStr} />;
}
