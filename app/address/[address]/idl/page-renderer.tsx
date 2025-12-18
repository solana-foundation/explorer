import { captureException } from '@sentry/nextjs';
import { ComponentType } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { ErrorCard } from '@/app/components/common/ErrorCard';

const isSentryEnabled = process.env.NEXT_PUBLIC_ENABLE_CATCH_EXCEPTIONS === '1';

export function PageRenderer({
    address,
    renderComponent: RenderComponent,
}: {
    address: string;
    renderComponent: ComponentType<{ address: string }>;
}) {
    return (
        <ErrorBoundary
            onError={(error: Error) => {
                if (isSentryEnabled) {
                    captureException(error);
                }
            }}
            fallbackRender={({ error }) => <ErrorCard text={`Failed to load: ${error.message}`} />}
        >
            <RenderComponent address={address} />
        </ErrorBoundary>
    );
}
