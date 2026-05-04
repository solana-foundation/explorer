import { NextResponse } from 'next/server';
import fetch from 'node-fetch';

import { Logger } from '@/app/shared/lib/logger';

type Params = {
    params: Promise<{
        network: string;
    }>;
};

const SUPPORTED_NETWORK = 'mainnet';
const VALIDATORS_APP_LABEL = 'mainnet';

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

export async function GET(_request: Request, props: Params) {
    const { network } = await props.params;

    if (network !== SUPPORTED_NETWORK) {
        return NextResponse.json(
            { error: `Network "${network}" is not supported` },
            { headers: { 'Cache-Control': 'no-store, max-age=0' }, status: 404 },
        );
    }

    try {
        const responses = await Promise.all(
            PING_INTERVALS.map(interval =>
                fetch(
                    `https://www.validators.app/api/v1/ping-thing-stats/${VALIDATORS_APP_LABEL}.json?interval=${interval}`,
                    {
                        headers: {
                            Token: process.env.PING_API_KEY || '',
                        },
                    },
                ),
            ),
        );
        const data: { [interval: number]: ValidatorsAppPingStats[] } = {};
        await Promise.all(
            responses.map(async (response, index) => {
                if (!response.ok) {
                    await response.text().catch(() => undefined); // drain body to release socket
                    throw new Error(`Upstream API error: ${response.status} ${response.statusText}`);
                }

                const payload = await response.json();
                if (!Array.isArray(payload)) {
                    throw new Error('Upstream API returned non-array payload');
                }

                const interval = PING_INTERVALS[index];
                data[interval] = payload as ValidatorsAppPingStats[];
            }),
        );

        return NextResponse.json(data, { headers: CACHE_HEADERS });
    } catch (error) {
        const wrappedError = new Error('Ping API error', { cause: error });
        Logger.panic(wrappedError);
        return NextResponse.json(
            { error: 'Failed to fetch ping data' },
            { headers: { 'Cache-Control': 'no-store, max-age=0' }, status: 500 },
        );
    }
}
