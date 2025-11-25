import type { RootNode } from 'codama';

// TODO: Move to entities/feature
import { useFormatCodamaIdl } from '@/app/components/account/idl/formatted-idl/formatters/codama';

import { useSearchIdl } from '../model/search';
import { BaseFormattedIdl } from './BaseFormattedIdl';

export function CodamaFormattedIdl({ idl, searchStr = '' }: { idl?: RootNode; searchStr?: string }) {
    const formattedIdl = useFormatCodamaIdl(idl);
    const searchResults = useSearchIdl(formattedIdl, searchStr);
    return <BaseFormattedIdl idl={searchResults} searchStr={searchStr} />;
}
