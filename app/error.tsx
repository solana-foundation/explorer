'use client';

import { ErrorCard } from '@components/common/ErrorCard';
import { useEffect } from 'react';

import { Logger } from '@/app/shared/lib/logger';
import { PageContainer } from '@/app/shared/ui/page-container/PageContainer';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        Logger.panic(error);
    }, [error]);

    return (
        <PageContainer className="mt-6">
            <ErrorCard text="Something went wrong" retry={reset} />
        </PageContainer>
    );
}
