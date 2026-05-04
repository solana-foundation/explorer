'use client';

import { Skeleton } from '@shared/ui/skeleton';
import dynamic from 'next/dynamic';

export const SearchBar = dynamic(() => import('@features/search').then(mod => ({ default: mod.SearchBar })), {
    loading: () => <Skeleton className="e-h-[38px] e-w-full e-rounded-md e-bg-heavy-metal-800" />,
    ssr: false,
});
