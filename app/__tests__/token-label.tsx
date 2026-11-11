import { GENESIS_HASHES } from '@entities/chain-id';
import { getTokenInfoSwrKey, type TokenInfo, useTokenInfo } from '@entities/token-info';
import { act, render, waitFor } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import type { ReactElement } from 'react';
import { mutate } from 'swr';
import { expect, vi } from 'vitest';

import { connectedWithGenesisHash } from '@/app/__tests__/swr-hook';

// The response must hold only the requested tokens, so a spec fails for a card that requests the wrong mint.
export function stubTokenInfoApi(tokens: TokenInfo[]): void {
    vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string, init: RequestInit) => {
            const addresses = requestedMints(url, init);
            return Response.json({ content: tokens.filter(token => addresses.includes(token.address)) });
        }),
    );
}

function requestedMints(url: string, init: RequestInit): string[] {
    if (init.method === 'POST') {
        const { addresses } = JSON.parse(String(init.body)) as { addresses: string[] };
        return addresses;
    }
    const { pathname } = new URL(url, 'http://localhost');
    return [decodeURIComponent(pathname.slice(pathname.lastIndexOf('/') + 1))];
}

export const LABEL_CLUSTER = connectedWithGenesisHash(Cluster.MainnetBeta, GENESIS_HASHES.MAINNET);

/** The card must read `LABEL_CLUSTER` and use the global SWR cache, or the test cannot fail. */
export async function readLabelAfterFailedCardRequest(card: ReactElement, token: TokenInfo): Promise<HTMLElement> {
    vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response(null, { status: 503 })),
    );
    await mutate(getTokenInfoSwrKey(token.address, LABEL_CLUSTER.cluster, LABEL_CLUSTER.genesisHash), token, false);

    render(card);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    await act(() => new Promise(resolve => setTimeout(resolve, 0)));

    return render(<TokenLabel mint={token.address} />).container;
}

function TokenLabel({ mint }: { mint: string }) {
    const label = useTokenInfo(true, mint, LABEL_CLUSTER.cluster, LABEL_CLUSTER.genesisHash);
    return <span>{label?.symbol}</span>;
}
