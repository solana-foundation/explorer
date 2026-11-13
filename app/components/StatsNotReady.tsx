import { useCluster } from '@providers/cluster';
import { useStatsProvider } from '@providers/stats/solanaClusterStats';
import React from 'react';
import { RefreshCw } from 'react-feather';

import { Button } from '@/app/components/shared/ui/button';

const CLUSTER_STATS_TIMEOUT = 5000;

export function StatsNotReady({ error }: { error: boolean }) {
    const { setTimedOut, retry, active } = useStatsProvider();
    const { cluster } = useCluster();

    React.useEffect(() => {
        let timedOut: NodeJS.Timeout;
        if (!error) {
            timedOut = setTimeout(setTimedOut, CLUSTER_STATS_TIMEOUT);
        }
        return () => {
            if (timedOut) {
                clearTimeout(timedOut);
            }
        };
    }, [setTimedOut, cluster, error]);

    if (error || !active) {
        return (
            <div className="flex flex-wrap items-center justify-center gap-3 p-6 text-center text-sm">
                There was a problem loading cluster stats.
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        retry();
                    }}
                >
                    <RefreshCw />
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center gap-2 p-6 text-sm text-outer-space-300">
            <span className="spinner-grow spinner-grow-sm shrink-0" />
            Loading
        </div>
    );
}
