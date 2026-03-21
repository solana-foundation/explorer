import { NextResponse } from 'next/server';
import fetch from 'node-fetch';

import { Logger } from '@/app/shared/lib/logger';

type Params = {
    params: {
        network: 'mainnet';
    };
};

export type ValidatorsAppPingStats = {
    interval: number;
    max: number;
    median: number;
    min: number;
    network: string;
    num_of_records: number;
    time_from: string;
    average_slot_latency: number;
    tps: number;
};

const CACHE_HEADERS = { 'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=30' };

const PING_INTERVALS: number[] = [1, 3, 12];

export async function GET(_request: Request, { params: { network } }: Params) {
    try {
        const responses = await Promise.all(
            PING_INTERVALS.map(interval =>
                fetch(`https://www.validators.app/api/v1/ping-thing-stats/${network}.json?interval=${interval}`, {
                    headers: {
                        Token: process.env.PING_API_KEY || '',
                    },
                }),
            ),
        );
        const data: { [interval: number]: ValidatorsAppPingStats[] } = {};
        await Promise.all(
            responses.map(async (response, index) => {
                if (!response.ok) {
                    await response.text().catch(() => undefined); // drain body to release socket
                    throw new Error(`Upstream API error: ${response.status} ${response.statusText}`);
                }

                const interval = PING_INTERVALS[index];
                data[interval] = (await response.json()) as ValidatorsAppPingStats[];
            }),
        );

        return NextResponse.json(data, { headers: CACHE_HEADERS });
    } catch (error) {
        const wrappedError = new Error('Ping API error', { cause: error });
        Logger.error(wrappedError, { sentry: true });
        return NextResponse.json(
            { error: 'Failed to fetch ping data' },
            { headers: { 'Cache-Control': 'no-store, max-age=0' }, status: 500 },
        );
    }
}
