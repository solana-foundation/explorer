import 'client-only';

import { type ConnectableUrl, getRpc } from '@entities/cluster';
import {
    type Address,
    type Base58EncodedBytes,
    getBase58Decoder,
    getBase64Encoder,
    isSolanaError,
    SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR,
} from '@solana/kit';

import { Logger } from '@/app/shared/lib/logger';
import { asJsonRpcError, isMethodNotFound } from '@/app/shared/lib/rpc-errors';
import { UPSTREAM_TIMEOUT_MS } from '@/app/shared/lib/timeouts';

import {
    NFT_ACCOUNT_DISCRIMINATOR,
    NFT_COLLECTION_OFFSET,
    NFTOKEN_ADDRESS,
    type NftokenNftAccount,
    parseNftokenNftAccount,
} from '../lib/nftoken-accounts';

export type CollectionNftsAnswer =
    | { kind: 'loaded'; nfts: NftokenNftAccount[]; undecodableCount: number }
    | { kind: 'unsupported' }
    | { kind: 'refused' };

const BASE58_DECODER = getBase58Decoder();
const BASE64_ENCODER = getBase64Encoder();

export async function fetchCollectionNfts(url: ConnectableUrl, collection: Address): Promise<CollectionNftsAnswer> {
    let accounts;
    try {
        accounts = await getRpc(url)
            .getProgramAccounts(NFTOKEN_ADDRESS, {
                encoding: 'base64',
                filters: [
                    {
                        memcmp: {
                            bytes: BASE58_DECODER.decode(NFT_ACCOUNT_DISCRIMINATOR) as Base58EncodedBytes,
                            encoding: 'base58',
                            offset: 0n,
                        },
                    },
                    {
                        memcmp: {
                            bytes: collection as Base58EncodedBytes,
                            encoding: 'base58',
                            offset: BigInt(NFT_COLLECTION_OFFSET),
                        },
                    },
                ],
            })
            .send({ abortSignal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
    } catch (error) {
        const decline = classifyDecline(error);
        if (decline === undefined) throw error;
        return decline;
    }

    const nfts = accounts.flatMap(
        ({ account, pubkey }) => parseNftokenNftAccount(pubkey, BASE64_ENCODER.encode(account.data[0])) ?? [],
    );
    return { kind: 'loaded', nfts: nfts.sort(byAddress), undecodableCount: accounts.length - nfts.length };
}

const UNSUPPORTED_STATUSES = [404, 410];
const REFUSED_STATUSES = [401, 403];

function classifyDecline(error: unknown): CollectionNftsAnswer | undefined {
    if (isMethodNotFound(asJsonRpcError(error))) return { kind: 'unsupported' };
    if (!isSolanaError(error, SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR)) return undefined;

    const { statusCode } = error.context;
    if (UNSUPPORTED_STATUSES.includes(statusCode)) return { kind: 'unsupported' };
    if (REFUSED_STATUSES.includes(statusCode)) {
        Logger.warn('[nftoken] getProgramAccounts was refused at this endpoint', { status: statusCode });
        return { kind: 'refused' };
    }
    return undefined;
}

function byAddress(a: NftokenNftAccount, b: NftokenNftAccount) {
    return a.address < b.address ? -1 : 1;
}
