'use client';

import '../features/verified-programs/styles.css';

import { captureException } from '@sentry/nextjs';
import { ErrorBoundary } from 'react-error-boundary';

import { ErrorCard } from '@/app/components/common/ErrorCard';
import { VerifiedProgramsCard } from '@/app/features/verified-programs';

const isSentryEnabled = process.env.NEXT_PUBLIC_ENABLE_CATCH_EXCEPTIONS === '1';

export default function ProgramsPageClient() {
    return (
        <ErrorBoundary
            onError={(error: Error) => {
                if (isSentryEnabled) {
                    captureException(error);
                }
            }}
            fallbackRender={({ error }) => <ErrorCard text={`Failed to load verified programs: ${error.message}`} />}
        >
            <div className="container e-mt-4">
                <VerifiedProgramsCard />
            </div>
        </ErrorBoundary>
    );
}
