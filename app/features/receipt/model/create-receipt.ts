import { truncateAddress } from '@entities/address';
import { ParsedTransactionWithMeta } from '@solana/web3.js';
import { lamportsToSolString } from '@utils/index';

import { Cluster, clusterName } from '@/app/utils/cluster';
import { displayTimestampUtc } from '@/app/utils/date';

import { getTokenInfo, type TokenInfo } from '../api/get-token-info';
import { getTx } from '../api/get-tx';
import type { FormattedReceipt } from '../types';
import { createSolTransferReceipt } from './sol-transfer';
import { createTokenTransferReceipt } from './token-transfer';
import { isSolReceipt, isTokenReceipt, type Receipt } from './types';

export async function createReceipt(signature: string): Promise<FormattedReceipt | undefined> {
    const data = await getTx(signature);
    return extractReceiptData(data.transaction, data.cluster);
}

export async function extractReceiptData(
    tx: ParsedTransactionWithMeta,
    cluster: Cluster
): Promise<FormattedReceipt | undefined> {
    let receipt: Receipt | undefined = createSolTransferReceipt(tx);
    if (!receipt) {
        receipt = await createTokenTransferReceipt(tx, (mint: string | undefined) => getParsedTokenInfo(mint, cluster));
    }
    if (!receipt) return undefined;

    return formatReceiptData(receipt, cluster);
}

export function formatReceiptData(receipt: Receipt, cluster: Cluster): FormattedReceipt {
    const timestamp = receipt.date * 1000;
    const unit = isSolReceipt(receipt) ? 'SOL' : receipt.symbol || 'TOKEN';

    const base = {
        date: {
            timestamp,
            utc: displayTimestampUtc(timestamp, true),
        },
        fee: {
            formatted: lamportsToSolString(receipt.fee, 9),
            raw: receipt.fee,
        },
        logoURI: isTokenReceipt(receipt) ? receipt.logoURI : undefined,
        memo: receipt.memo,
        network: clusterName(cluster),
        receiver: {
            address: receipt.receiver,
            truncated: truncateAddress(receipt.receiver, 5),
        },
        sender: {
            address: receipt.sender,
            truncated: truncateAddress(receipt.sender, 5),
        },
        total: {
            formatted: isSolReceipt(receipt) ? lamportsToSolString(receipt.total, 9) : String(receipt.total),
            raw: receipt.total,
            unit,
        },
    };
    if (isTokenReceipt(receipt)) {
        return { ...base, mint: receipt.mint, symbol: receipt.symbol };
    }
    return base;
}

async function getParsedTokenInfo(mint: string | undefined, cluster: Cluster): Promise<TokenInfo | undefined> {
    if (!mint) return undefined;
    try {
        const tokenInfo = await getTokenInfo(mint, cluster);
        return tokenInfo;
    } catch (error) {
        console.error('Unable to get token info', error);
        return undefined;
    }
}
