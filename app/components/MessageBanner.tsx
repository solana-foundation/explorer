'use client';

import { useCluster } from '@providers/cluster';
import { Cluster } from '@utils/cluster';
import { displayTimestamp } from '@utils/date';
import React from 'react';
import { AlertCircle } from 'react-feather';

import { PageContainer } from '@/app/shared/ui/page-container/PageContainer';

type Announcement = {
    message: string;
    estimate?: string;
    start?: Date;
    end?: Date;
};

const announcements = new Map<Cluster, Announcement>();
// announcements.set(Cluster.Devnet, {
//     message: 'Devnet API node is restarting',
//     start: new Date('July 25, 2020 18:00:00 GMT+8:00'),
//     estimate: '2 hours',
// });
// announcements.set(Cluster.MainnetBeta, {
//   message: "Mainnet Beta upgrade in progress. Transactions disabled until epoch 62",
//   start: new Date("August 2, 2020 00:00:00 GMT+0:00"),
//   end: new Date("August 4, 2020 00:00:00 GMT+0:00"),
// });
// announcements.set(Cluster.MainnetBeta, {
//   message:
//     "Mainnet Beta upgrade in progress. Transactions disabled until epoch 62",
// });

export function MessageBanner() {
    const cluster = useCluster().cluster;
    const announcement = announcements.get(cluster);
    if (!announcement) return null;
    const { message, start, end, estimate } = announcement;

    const now = new Date();
    if (end && now > end) return null;
    if (start && now < start) return null;

    let timeframe;
    if (estimate || start || end) {
        timeframe = (
            <div>
                <hr className="my-3 w-full text-dk-gray-500 opacity-50" />
                {estimate && (
                    <h5 className="text-dk-gray-200">
                        <span className="uppercase">Estimated Duration: </span>
                        {estimate}
                    </h5>
                )}
                {start && (
                    <h5 className="text-dk-gray-200">
                        <span className="uppercase">Started at: </span>
                        {displayTimestamp(start.getTime())}
                    </h5>
                )}
                {end && (
                    <h5 className="text-dk-gray-200">
                        <span className="uppercase">End: </span>
                        {displayTimestamp(end.getTime())}
                    </h5>
                )}
            </div>
        );
    }

    return (
        <div className="bg-dk-info text-white">
            <PageContainer>
                <div className="flex flex-col items-center justify-center py-3 text-center">
                    <h3 className="mb-0 leading-6">
                        <AlertCircle className="mr-1.5" size={15} />
                        {message}
                    </h3>
                    {timeframe}
                </div>
            </PageContainer>
        </div>
    );
}
