'use client';

import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { TokenInstructionType, Transfer, TransferChecked } from '@components/instruction/token/types';
import { fetchTokenInfoFromApi, getTokenInfoSwrKey } from '@entities/token-info';
import { type TransactionWithMeta } from '@entities/transaction-data';
import { useFetchAccountHistory } from '@features/transaction-history/model/use-fetch-account-history';
import { isTokenProgramData, useAccountHistory } from '@providers/accounts';
import { toScaledUiAmountString, useScaledUiAmountMultiplier } from '@providers/accounts/tokens';
import { FetchStatus } from '@providers/cache';
import { useCluster } from '@providers/cluster';
import { address as toAddress } from '@solana/kit';
import { ParsedInstruction, PartiallyDecodedInstruction, PublicKey } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { normalizeTokenAmount } from '@utils/index';
import { InstructionContainer } from '@utils/instruction';
import React, { useMemo } from 'react';
import { create } from 'superstruct';
import useSWR from 'swr';

import { Logger } from '@/app/shared/lib/logger';

import { getTransactionRows } from '../HistoryCardComponents';
import { BaseTokenTransfersCard, type TokenTransferRowView } from './BaseTokenTransfersCard';
import { extractMintDetails, MintDetails } from './common';

type IndexedTransfer = {
    index: number;
    childIndex?: number;
    transfer: Transfer | TransferChecked;
};

async function fetchTokenInfo([_, address, cluster, url]: ['get-token-info', string, Cluster, string]) {
    return await fetchTokenInfoFromApi(new PublicKey(address), cluster, url);
}

export function TokenTransfersCard({ address }: { address: string }) {
    const { cluster, url } = useCluster();
    const pubkey = useMemo(() => new PublicKey(address), [address]);
    const history = useAccountHistory(address);
    const fetchAccountHistory = useFetchAccountHistory();
    const refresh = () => fetchAccountHistory(toAddress(address), true, true);
    const loadMore = () => fetchAccountHistory(toAddress(address), true);
    const swrKey = useMemo(() => getTokenInfoSwrKey(address, cluster, url), [address, cluster, url]);
    const { data: tokenInfo, isLoading: tokenInfoLoading } = useSWR(swrKey, fetchTokenInfo);
    const scaledUiAmountMultiplier = useScaledUiAmountMultiplier(address);

    const transactionRows = React.useMemo(() => {
        if (history?.data?.fetched) {
            return getTransactionRows(history.data.fetched);
        }
        return [];
    }, [history]);

    React.useEffect(() => {
        if (!history || !history.data?.transactionMap?.size) {
            refresh();
        }
    }, [address]); // eslint-disable-line react-hooks/exhaustive-deps

    const rows = React.useMemo(() => {
        const detailedHistoryMap = history?.data?.transactionMap || new Map<string, TransactionWithMeta>();
        const mintMap = new Map<string, MintDetails>();
        const allTransfers: TokenTransferRowView[] = [];

        transactionRows.forEach(({ signature, blockTime, err }) => {
            const transactionWithMeta = detailedHistoryMap.get(signature);
            if (!transactionWithMeta) return;

            // Extract mint information from token deltas
            // (used to filter out non-checked tokens transfers not belonging to this mint)
            extractMintDetails(transactionWithMeta, mintMap);

            // Extract all transfers from transaction
            let transfers: IndexedTransfer[] = [];
            InstructionContainer.create(transactionWithMeta).instructions.forEach(({ instruction, inner }, index) => {
                const transfer = getTransfer(instruction, cluster, signature);
                if (transfer) {
                    transfers.push({
                        index,
                        transfer,
                    });
                }
                inner.forEach((instruction, childIndex) => {
                    const transfer = getTransfer(instruction, cluster, signature);
                    if (transfer) {
                        transfers.push({
                            childIndex,
                            index,
                            transfer,
                        });
                    }
                });
            });

            // Filter out transfers not belonging to this mint
            transfers = transfers.filter(({ transfer }) => {
                const sourceKey = transfer.source.toBase58();
                const destinationKey = transfer.destination.toBase58();

                if ('tokenAmount' in transfer && transfer.mint.equals(pubkey)) {
                    return true;
                } else if (mintMap.has(sourceKey) && mintMap.get(sourceKey)?.mint === address) {
                    return true;
                } else if (mintMap.has(destinationKey) && mintMap.get(destinationKey)?.mint === address) {
                    return true;
                }

                return false;
            });

            transfers.forEach(({ transfer, index, childIndex }) => {
                // `undefined` while the token info loads: the card holds the symbol's place until it arrives.
                const units = tokenInfo?.symbol || (tokenInfoLoading ? undefined : 'Tokens');
                let amountString = '';

                if ('tokenAmount' in transfer) {
                    amountString = transfer.tokenAmount.uiAmountString;
                } else {
                    let decimals = 0;

                    if (tokenInfo?.decimals) {
                        decimals = tokenInfo.decimals;
                    } else if (mintMap.has(transfer.source.toBase58())) {
                        decimals = mintMap.get(transfer.source.toBase58())?.decimals || 0;
                    } else if (mintMap.has(transfer.destination.toBase58())) {
                        decimals = mintMap.get(transfer.destination.toBase58())?.decimals || 0;
                    }

                    amountString = new Intl.NumberFormat('en-US', {
                        maximumFractionDigits: decimals,
                        minimumFractionDigits: decimals,
                    }).format(normalizeTokenAmount(transfer.amount, decimals));
                }

                allTransfers.push({
                    amount: toScaledUiAmountString(amountString, scaledUiAmountMultiplier),
                    blockTime: blockTime || undefined,
                    destination: transfer.destination,
                    key: `${signature}:${index}:${childIndex ?? '-'}`,
                    rawAmount: amountString,
                    scaledUiAmountMultiplier,
                    signature,
                    source: transfer.source,
                    status: err ? 'failed' : 'success',
                    units,
                });
            });
        });

        return allTransfers;
    }, [history, transactionRows, tokenInfo, pubkey, address, cluster, tokenInfoLoading, scaledUiAmountMultiplier]);

    if (!history) {
        return null;
    }

    if (history?.data === undefined) {
        if (history.status === FetchStatus.Fetching) {
            return <LoadingCard message="Loading token transfers" />;
        }

        return <ErrorCard retry={refresh} text="Failed to fetch token transfers" />;
    }

    const fetching = history.status === FetchStatus.Fetching;

    if (fetching && rows.length === 0) {
        return <LoadingCard message="Loading token transfers" />;
    }

    return (
        <BaseTokenTransfersCard
            rows={rows}
            fetching={fetching}
            failed={history.status === FetchStatus.FetchFailed}
            foundOldest={history.data.foundOldest}
            onRefresh={refresh}
            onLoadMore={loadMore}
        />
    );
}

function getTransfer(
    instruction: ParsedInstruction | PartiallyDecodedInstruction,
    cluster: Cluster,
    signature: string,
): Transfer | TransferChecked | undefined {
    if ('parsed' in instruction && isTokenProgramData(instruction)) {
        try {
            const { type: rawType } = instruction.parsed;
            const type = create(rawType, TokenInstructionType);

            if (type === 'transferChecked') {
                return create(instruction.parsed.info, TransferChecked);
            } else if (type === 'transfer') {
                return create(instruction.parsed.info, Transfer);
            }
        } catch (error) {
            if (cluster === Cluster.Mainnet) {
                Logger.error(error, {
                    signature,
                });
            }
        }
    }
    return undefined;
}
