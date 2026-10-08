'use client';

import { ErrorCard } from '@components/common/ErrorCard';
import { useEffect } from 'react';
import { type Cache, type ScopedMutator, useSWRConfig } from 'swr';

import { Logger } from '@/app/shared/lib/logger';

export default function AddressTabError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    const { cache, mutate } = useSWRConfig();

    useEffect(() => {
        Logger.error(error);
    }, [error]);

    const retry = () => {
        clearFailedEntries(cache, mutate);
        reset();
    };

    return <ErrorCard text="Something went wrong" retry={retry} />;
}

function clearFailedEntries(cache: Cache, mutate: ScopedMutator) {
    for (const key of Array.from(cache.keys())) {
        const entry = cache.get(key);
        if (entry?.error && entry.data === undefined) void mutate(key, undefined);
    }
}
