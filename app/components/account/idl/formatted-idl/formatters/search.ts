import Fuse, { IFuseOptions } from 'fuse.js';
import { useMemo } from 'react';

import { FormattedIdl } from './FormattedIdl';

function fieldTypeSearchKeys(key: string) {
    return [
        `${key}.name`,
        `${key}.docs`,
        `${key}.type`,
        `${key}.variants`,
        `${key}.fields.name"`,
        `${key}.fields.docs`,
    ];
}

export function searchIdl(formattedIdl: FormattedIdl, searchStr?: string): FormattedIdl | null {
    if (!searchStr) return formattedIdl;

    const commonOptions: IFuseOptions<any> = {
        isCaseSensitive: false,
        threshold: 0.1,
    };

    const ixSearcher = new Fuse(formattedIdl.instructions || [], {
        ...commonOptions,
        keys: ['name', 'docs', 'accounts.name', 'accounts.docs', 'args.name', 'args.docs'],
    });

    const accSearcher = new Fuse(formattedIdl.accounts || [], {
        ...commonOptions,
        keys: ['name', 'docs', ...fieldTypeSearchKeys('fieldType')],
    });
    const typeSearcher = new Fuse(formattedIdl.types || [], {
        ...commonOptions,
        keys: ['name', 'docs', ...fieldTypeSearchKeys('fieldType')],
    });
    const errorSearcher = new Fuse(formattedIdl.errors || [], {
        ...commonOptions,
        keys: ['name', 'code', 'message'],
    });
    const constSearcher = new Fuse(formattedIdl.constants || [], {
        ...commonOptions,
        keys: ['name', 'docs', 'type', 'value'],
    });
    const eventSearcher = new Fuse(formattedIdl.events || [], {
        ...commonOptions,
        keys: ['name', 'docs', ...fieldTypeSearchKeys('fieldType')],
    });
    const pdaSearcher = new Fuse(formattedIdl.pdas || [], {
        ...commonOptions,
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

export function useSearchIdl(formattedIdl: FormattedIdl | null, searchStr?: string): FormattedIdl | null {
    return useMemo(() => {
        if (!formattedIdl) return null;
        return searchIdl(formattedIdl, searchStr);
    }, [formattedIdl, searchStr]);
}
