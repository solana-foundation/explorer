'use client';

import { ErrorCard } from '@components/common/ErrorCard';
import { useEffect } from 'react';

import { Logger } from '@/app/shared/lib/logger';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        Logger.panic(error);
    }, [error]);

    return (
        <div className="container mt-4">
            <ErrorCard text={error.message} retry={reset} />
        </div>
    );
}
