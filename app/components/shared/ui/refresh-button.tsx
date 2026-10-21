// TODO(fsd): relocate this module to @shared or the appropriate feature/entity layer.
import { useEffect, useState } from 'react';
import { CheckCircle, RefreshCw } from 'react-feather';

import { refreshAnalytics } from '@/app/shared/lib/analytics';

import { Button } from './button';

type Props = {
    analyticsSection: string;
    fetching?: boolean;
    onClick: () => void;
    className?: string;
};

const COOLDOWN_MS = 2000;

export function RefreshButton({ analyticsSection, fetching = false, onClick, className }: Props) {
    const [phase, request] = useRefreshPhase(fetching);
    const refreshed = phase === 'refreshed';

    return (
        <Button
            variant="outline"
            size="sm"
            aria-label="Refresh"
            className={className}
            disabled={fetching || refreshed}
            onClick={() => {
                refreshAnalytics.trackButtonClicked(analyticsSection);
                request();
                onClick();
            }}
        >
            <RefreshButtonContent fetching={fetching} refreshed={refreshed} />
        </Button>
    );
}

function RefreshButtonContent({ fetching, refreshed }: { fetching: boolean; refreshed: boolean }) {
    if (fetching) {
        return (
            <>
                <span className="spinner-grow spinner-grow-sm" />
                <span className="hidden md:inline">Loading</span>
            </>
        );
    }
    if (refreshed) {
        return (
            <>
                <CheckCircle size={12} className="text-dk-info" />
                <span className="hidden md:inline">Refreshed</span>
            </>
        );
    }
    return (
        <>
            <RefreshCw size={12} />
            <span className="hidden md:inline">Refresh</span>
        </>
    );
}

type RefreshPhase = 'idle' | 'requested' | 'fetching' | 'refreshed';

// The fetch can start after the click, so `requested` waits for `fetching` to turn true before it can end.
function useRefreshPhase(fetching: boolean) {
    const [phase, setPhase] = useState<RefreshPhase>('idle');

    if (phase === 'requested' && fetching) setPhase('fetching');
    if (phase === 'fetching' && !fetching) setPhase('refreshed');

    useEffect(() => {
        if (phase !== 'refreshed') return;
        const timeout = setTimeout(() => setPhase('idle'), COOLDOWN_MS);
        return () => clearTimeout(timeout);
    }, [phase]);

    return [phase, () => setPhase('requested')] as const;
}
