'use client';

import { Skeleton } from '@components/shared/ui/skeleton';
import dynamic from 'next/dynamic';

export const SearchBar = dynamic(() => import('@features/search').then(mod => ({ default: mod.SearchBar })), {
    loading: () => <Skeleton className="h-[38px] w-full rounded-md bg-heavy-metal-800" />,
    ssr: false,
});
