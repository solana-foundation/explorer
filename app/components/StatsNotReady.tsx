import { StatsTableSkeleton } from '@components/common/Skeletons';
import { useStatsProvider } from '@providers/stats/solanaClusterStats';
import React from 'react';
import { RefreshCw } from 'react-feather';

export function StatsNotReady({ error }: { error: boolean }) {
    const { retry, active } = useStatsProvider();

    if (error || !active) {
        return (
            <div className="card-body text-center">
                There was a problem loading cluster stats.{' '}
                <button
                    className="btn btn-white btn-sm"
                    onClick={() => {
                        retry();
                    }}
                >
                    <RefreshCw className="align-text-top me-2" size={13} />
                    Try Again
                </button>
            </div>
        );
    }

    return <StatsTableSkeleton />;
}
