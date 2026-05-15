import { truncateAddress } from '@entities/address';
import { ParsedTransactionWithMeta } from '@solana/web3.js';
import { lamportsToSolString } from '@utils/index';

import { Logger } from '@/app/shared/lib/logger';
import { Cluster, clusterName } from '@/app/utils/cluster';
import { displayTimestampUtc } from '@/app/utils/date';

import { getTokenInfo, type TokenInfo } from '../api/get-token-info';
import { getTx } from '../api/get-tx';
import type { FormattedReceipt } from '../types';
import { type QueryCluster } from './cluster';
import { createSolTransferReceipt } from './sol-transfer';
import { createTokenTransferReceipt } from './token-transfer';
import { hasTransfers, isSolReceipt, isTokenReceipt, type Receipt } from './types';

export type ReceiptUnavailabilityReason = 'inner-instructions' | 'mixed-mint' | 'no-transfers';

export type ReceiptResult =
    | { kind: 'ok'; receipt: FormattedReceipt }
    | { kind: 'unavailable'; reason: ReceiptUnavailabilityReason };

export async function createReceipt(signature: string, cluster?: QueryCluster): Promise<ReceiptResult> {
    const data = await getTx(signature, undefined, cluster);
    return extractReceiptData(data.transaction, data.cluster);
}

export async function extractReceiptData(tx: ParsedTransactionWithMeta, cluster: Cluster): Promise<ReceiptResult> {
    if (tx.meta?.innerInstructions?.length) {
        return { kind: 'unavailable', reason: 'inner-instructions' };
    }

    const tokenOutcome = await createTokenTransferReceipt(tx, (mint: string | undefined) =>
        getParsedTokenInfo(mint, cluster),
    );
    if (tokenOutcome.kind === 'ok') {
        return { kind: 'ok', receipt: formatReceiptData(tokenOutcome.receipt, cluster) };
    }
    if (tokenOutcome.kind === 'rejected') {
        return { kind: 'unavailable', reason: tokenOutcome.reason };
    }

    const solReceipt = createSolTransferReceipt(tx);
    if (solReceipt) {
        return { kind: 'ok', receipt: formatReceiptData(solReceipt, cluster) };
    }

    return { kind: 'unavailable', reason: 'no-transfers' };
}

export function formatReceiptData(receipt: Receipt, cluster: Cluster): FormattedReceipt {
    const timestamp = receipt.date * 1000;
    const unit = isSolReceipt(receipt) ? 'SOL' : receipt.symbol || 'TOKEN';

    const transfers = hasTransfers(receipt)
        ? receipt.transfers.map(t => ({
              amount: {
                  formatted: isSolReceipt(receipt) ? lamportsToSolString(t.total, 9) : String(t.total),
                  raw: t.total,
                  unit,
              },
              receiver: { address: t.receiver, truncated: truncateAddress(t.receiver, 5) },
              sender: { address: t.sender, truncated: truncateAddress(t.sender, 5) },
          }))
        : undefined;

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
        transfers,
    };
    if (isTokenReceipt(receipt)) {
        return { ...base, kind: 'token' as const, mint: receipt.mint, symbol: receipt.symbol };
    }
    return { ...base, kind: 'sol' as const };
}

async function getParsedTokenInfo(mint: string | undefined, cluster: Cluster): Promise<TokenInfo | undefined> {
    if (!mint) return undefined;
    try {
        const tokenInfo = await getTokenInfo(mint, cluster);
        return tokenInfo;
    } catch (error) {
        Logger.error(error);
        return undefined;
    }
}
