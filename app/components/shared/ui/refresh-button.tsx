import React from 'react';
import { RefreshCw } from 'react-feather';

import { refreshAnalytics } from '@/app/shared/lib/analytics';

import { Button } from './button';

type Props = {
    analyticsSection: string;
    fetching?: boolean;
    onClick: () => void;
};

export function RefreshButton({ analyticsSection, fetching = false, onClick }: Props) {
    return (
        <Button
            variant="outline"
            size="sm"
            aria-label="Refresh"
            disabled={fetching}
            onClick={() => {
                refreshAnalytics.trackButtonClicked(analyticsSection);
                onClick();
            }}
        >
            {fetching ? (
                <>
                    <span className="spinner-grow spinner-grow-sm" />
                    <span className="e-hidden md:e-inline">Loading</span>
                </>
            ) : (
                <>
                    <RefreshCw size={12} />
                    <span className="e-hidden md:e-inline">Refresh</span>
                </>
            )}
        </Button>
    );
}
