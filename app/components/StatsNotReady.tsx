import { useCluster } from '@providers/cluster';
import { useStatsProvider } from '@providers/stats/solanaClusterStats';
import React from 'react';
import { RefreshCw } from 'react-feather';

import { Button } from '@/app/components/shared/ui/button';
import { CardBody } from '@/app/shared/ui/Card';

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
            <CardBody ui="dashkit" className="e-text-center">
                There was a problem loading cluster stats.{' '}
                <Button
                    ui="dashkit"
                    variant="white"
                    size="sm"
                    onClick={() => {
                        retry();
                    }}
                >
                    <RefreshCw className="e-align-text-top e-mr-1.5" size={13} />
                    Try Again
                </Button>
            </CardBody>
        );
    }

    return (
        <CardBody ui="dashkit" className="e-text-center">
            <span className="e-align-text-top spinner-grow spinner-grow-sm e-mr-1.5"></span>
            Loading
        </CardBody>
    );
}
