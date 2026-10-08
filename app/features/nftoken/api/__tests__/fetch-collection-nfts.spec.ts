import type * as SolanaKit from '@solana/kit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@solana/kit', async () => await vi.importActual<typeof SolanaKit>('@solana/kit'));

import { toConnectableUrl } from '@/app/entities/cluster/lib/connectable-url';
import { Logger } from '@/app/shared/lib/logger';
import { UPSTREAM_TIMEOUT_MS } from '@/app/shared/lib/timeouts';

import { COLLECTION, MAINNET_NFTS } from '../../__tests__/fixtures';
import { fetchCollectionNfts } from '../fetch-collection-nfts';

const URL = toConnectableUrl('https://mock.rpc');
const NFTOKEN_PROGRAM = 'nftokf9qcHSYkVSP3P2gUMmV6d4AwjMueXgUu43HyLL';
const NFT_DISCRIMINATOR_BASE58 = '6dycNg3Aybe';

const fetchMock = vi.fn();

beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.clearAllMocks();
});

describe('fetchCollectionNfts', () => {
    it('should filter by the NFT discriminator and the collection field', async () => {
        respondWithAccounts([]);

        await fetchCollectionNfts(URL, COLLECTION);

        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
            method: 'getProgramAccounts',
            params: [
                NFTOKEN_PROGRAM,
                {
                    encoding: 'base64',
                    filters: [
                        { memcmp: { bytes: NFT_DISCRIMINATOR_BASE58, encoding: 'base58', offset: 0 } },
                        { memcmp: { bytes: COLLECTION, encoding: 'base58', offset: 74 } },
                    ],
                },
            ],
        });
    });

    it('should return no NFTs for a collection without NFT accounts', async () => {
        respondWithAccounts([]);

        await expect(fetchCollectionNfts(URL, COLLECTION)).resolves.toEqual({
            kind: 'loaded',
            nfts: [],
            undecodableCount: 0,
        });
    });

    it('should abort the request at the upstream timeout', async () => {
        const deadline = new AbortController();
        const timeout = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(deadline.signal);
        fetchMock.mockImplementationOnce(
            (_url: string, init: RequestInit) =>
                new Promise((_resolve, reject) =>
                    init.signal?.addEventListener('abort', () => reject(init.signal?.reason)),
                ),
        );

        const answer = fetchCollectionNfts(URL, COLLECTION);
        deadline.abort();

        await expect(answer).rejects.toThrow();
        expect(timeout).toHaveBeenCalledWith(UPSTREAM_TIMEOUT_MS);
    });

    it('should return the NFTs in address order without fetching their metadata', async () => {
        respondWithAccounts([...MAINNET_NFTS].reverse());

        const answer = await fetchCollectionNfts(URL, COLLECTION);

        expect(answer).toEqual({
            kind: 'loaded',
            nfts: MAINNET_NFTS.map(nft =>
                expect.objectContaining({ address: nft.pubkey, collection: COLLECTION, metadata_url: nft.metadataUrl }),
            ),
            undecodableCount: 0,
        });
        expect(fetchMock).toHaveBeenCalledOnce();
    });

    it('should count an NFT account that does not decode, and log its address', async () => {
        const [first, second] = MAINNET_NFTS;
        respondWithAccounts([first, { base64: 'IbRbNewPP2E=', pubkey: second.pubkey }]);

        const answer = await fetchCollectionNfts(URL, COLLECTION);

        expect(answer).toEqual({
            kind: 'loaded',
            nfts: [expect.objectContaining({ address: first.pubkey })],
            undecodableCount: 1,
        });
        expect(Logger.error).toHaveBeenCalledExactlyOnceWith(expect.any(Error), { address: second.pubkey });
    });

    it('should return unsupported for the method-not-found code with any node message', async () => {
        respondWithRpcError({ code: -32601, message: 'getProgramAccounts is disabled' });

        await expect(fetchCollectionNfts(URL, COLLECTION)).resolves.toEqual({ kind: 'unsupported' });
    });

    it('should throw on any other JSON-RPC error code so the caller retries', async () => {
        respondWithRpcError({ code: -32005, message: 'Node is behind by 42 slots' });

        await expect(fetchCollectionNfts(URL, COLLECTION)).rejects.toThrow();
    });

    it('should return unsupported for an internal error whose message names a missing method', async () => {
        respondWithRpcError({ code: -32603, message: 'Method not found' });

        await expect(fetchCollectionNfts(URL, COLLECTION)).resolves.toEqual({ kind: 'unsupported' });
    });

    it('should throw on an internal error with any other message so the caller retries', async () => {
        respondWithRpcError({ code: -32603, message: 'Internal error' });

        await expect(fetchCollectionNfts(URL, COLLECTION)).rejects.toThrow();
    });

    it('should throw on a transport failure so the caller retries', async () => {
        fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

        await expect(fetchCollectionNfts(URL, COLLECTION)).rejects.toThrow('Failed to fetch');
    });

    it.each([
        ['a body that is not JSON', '<html>Service Unavailable</html>'],
        ['a result that is not a list', '{"id":"0","jsonrpc":"2.0","result":null}'],
        ['an account without data', `{"id":"0","jsonrpc":"2.0","result":[{"pubkey":"${COLLECTION}"}]}`],
    ])('should throw on a 200 response with %s so the caller retries', async (_, body) => {
        fetchMock.mockResolvedValueOnce(new Response(body));

        await expect(fetchCollectionNfts(URL, COLLECTION)).rejects.toThrow();
    });

    it.each([404, 410])('should return unsupported for an HTTP %i', async status => {
        fetchMock.mockResolvedValueOnce(new Response('error', { status }));

        await expect(fetchCollectionNfts(URL, COLLECTION)).resolves.toEqual({ kind: 'unsupported' });
    });

    it.each([401, 403])('should return refused and log for an HTTP %i', async status => {
        fetchMock.mockResolvedValueOnce(new Response('Refused', { status }));

        await expect(fetchCollectionNfts(URL, COLLECTION)).resolves.toEqual({ kind: 'refused' });
        expect(Logger.warn).toHaveBeenCalledWith(expect.stringContaining('refused'), { status });
    });

    it.each([429, 500, 502, 503])('should throw on an HTTP %i so the caller retries', async status => {
        fetchMock.mockResolvedValueOnce(new Response('error', { status }));

        await expect(fetchCollectionNfts(URL, COLLECTION)).rejects.toThrow();
    });
});

function respondWithAccounts(accounts: readonly { base64: string; pubkey: string }[]) {
    const result = accounts.map(
        ({ base64, pubkey }) =>
            `{"account":{"data":["${base64}","base64"],"executable":false,"lamports":2199360,"owner":"${NFTOKEN_PROGRAM}","rentEpoch":18446744073709551615,"space":188},"pubkey":"${pubkey}"}`,
    );
    fetchMock.mockResolvedValueOnce(new Response(`{"id":"0","jsonrpc":"2.0","result":[${result.join(',')}]}`));
}

function respondWithRpcError(error: { code: number; message: string }) {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error, id: '0', jsonrpc: '2.0' })));
}
