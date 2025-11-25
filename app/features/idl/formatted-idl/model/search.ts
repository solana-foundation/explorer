import Fuse, { type IFuseOptions } from 'fuse.js';
import { useMemo } from 'react';

import type { FormattedIdl } from '@/app/entities/idl/formatters/formatted-idl';

export function useSearchIdl(formattedIdl: FormattedIdl | null, searchStr?: string): FormattedIdl | null {
    return useMemo(() => {
        if (!formattedIdl) return null;
        return searchIdl(formattedIdl, (searchStr || '').trim());
    }, [formattedIdl, searchStr]);
}

export function contains(text: string, searchTerm: string): boolean {
    const options = commonOptions();
    const searcher = new Fuse([text], options);
    return searcher.search(searchTerm).length > 0;
}

function searchIdl(formattedIdl: FormattedIdl, searchStr?: string): FormattedIdl | null {
    if (!searchStr) return formattedIdl;

    const options = commonOptions();
    const ixSearcher = new Fuse(formattedIdl.instructions || [], {
        ...options,
        keys: ['name', 'docs', 'accounts.name', 'accounts.docs', 'args.name', 'args.docs'],
    });

    const accSearcher = new Fuse(formattedIdl.accounts || [], {
        ...options,
        keys: ['name', 'docs', ...fieldTypeSearchKeys('fieldType')],
    });
    const typeSearcher = new Fuse(formattedIdl.types || [], {
        ...options,
        keys: ['name', 'docs', ...fieldTypeSearchKeys('fieldType')],
    });
    const errorSearcher = new Fuse(formattedIdl.errors || [], {
        ...options,
        keys: ['name', 'code', 'message'],
    });
    const constSearcher = new Fuse(formattedIdl.constants || [], {
        ...options,
        keys: ['name', 'docs', 'type', 'value'],
    });
    const eventSearcher = new Fuse(formattedIdl.events || [], {
        ...options,
        keys: ['name', 'docs', ...fieldTypeSearchKeys('fieldType')],
    });
    const pdaSearcher = new Fuse(formattedIdl.pdas || [], {
        ...options,
        keys: ['name', 'docs', ...fieldTypeSearchKeys('seeds')],
    });

    const searchResult = {
        accounts: accSearcher.search(searchStr).map(r => r.item),
        constants: constSearcher.search(searchStr).map(r => r.item),
        errors: errorSearcher.search(searchStr).map(r => r.item),
        events: eventSearcher.search(searchStr).map(r => r.item),
        instructions: ixSearcher.search(searchStr).map(r => r.item),
        pdas: pdaSearcher.search(searchStr).map(r => r.item),
        types: typeSearcher.search(searchStr).map(r => r.item),
    };

    return searchResult;
}

function fieldTypeSearchKeys(key: string) {
    return [`${key}.name`, `${key}.docs`, `${key}.type`, `${key}.variants`, `${key}.fields.name`, `${key}.fields.docs`];
}

function commonOptions(): IFuseOptions<unknown> {
    return {
        isCaseSensitive: false,
        threshold: 0.2,
    };
}
