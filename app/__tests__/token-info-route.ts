import type { TokenInfo } from '@entities/token-info';
import { vi } from 'vitest';

// The response must hold only the requested tokens, so a spec fails for a card that requests the wrong mint.
export function stubTokenInfoRoute(tokens: TokenInfo[]): void {
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
