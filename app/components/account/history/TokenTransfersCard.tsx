'use client';

import ScaledUiAmountMultiplierTooltip from '@components/account/token-extensions/ScaledUiAmountMultiplierTooltip';
import { Address } from '@components/common/Address';
import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { Signature } from '@components/common/Signature';
import { TokenInstructionType, Transfer, TransferChecked } from '@components/instruction/token/types';
import { fetchTokenInfoFromApi, getTokenInfoSwrKey, toScaledUiAmount } from '@entities/token-info';
import { type TransactionWithMeta } from '@entities/transaction-data';
import { useFetchAccountHistory } from '@features/transaction-history/model/use-fetch-account-history';
import { isTokenProgramData, useAccountHistory } from '@providers/accounts';
import { getAmountMultiplier, useScaledUiAmountMultiplier } from '@providers/accounts/tokens';
import { FetchStatus } from '@providers/cache';
import { useCluster } from '@providers/cluster';
import { HistoryCardFooterContent } from '@shared/ui/HistoryCard';
import { address as toAddress } from '@solana/kit';
import { ParsedInstruction, PartiallyDecodedInstruction, PublicKey } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { InstructionContainer } from '@utils/instruction';
import React, { useMemo } from 'react';
import { create } from 'superstruct';
import useSWR from 'swr';

import { Badge } from '@/app/components/shared/ui/badge';
import { RefreshButton } from '@/app/components/shared/ui/refresh-button';
import { Logger } from '@/app/shared/lib/logger';
import { RelativeTime } from '@/app/shared/RelativeTime';
import { GridTableCard, type GridTableColumn } from '@/app/shared/ui/grid-table';

import { getTransactionRows } from '../HistoryCardComponents';
import { extractMintDetails, MintDetails } from './common';

type IndexedTransfer = {
    index: number;
    childIndex?: number;
    transfer: Transfer | TransferChecked;
};

type RawAmount = { decimals: number; rawAmount: string | number };

type TransferData = RawAmount & {
    blockTime: number | undefined;
    childIndex?: number;
    index: number;
    signature: string;
    statusClass: string;
    statusText: string;
    transfer: Transfer | TransferChecked;
};

async function fetchTokenInfo([_, address, cluster, url]: ['get-token-info', string, Cluster, string]) {
    return await fetchTokenInfoFromApi(new PublicKey(address), cluster, url);
}

function AmountCell({
    decimals,
    rawAmount,
    tokenAddress,
    units,
}: RawAmount & {
    tokenAddress: string;
    units: string;
}) {
    const scaledUiAmountMultiplier = useScaledUiAmountMultiplier(tokenAddress);
    const multiplier = getAmountMultiplier(scaledUiAmountMultiplier);

    return (
        <>
            {toScaledUiAmount({ decimals, multiplier, rawAmount }).toFixed()} {units}
            <ScaledUiAmountMultiplierTooltip
                rawAmount={toScaledUiAmount({ decimals, multiplier: '1', rawAmount }).toFixed()}
                scaledUiAmountMultiplier={scaledUiAmountMultiplier}
            />
        </>
    );
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

    const { allTransfers, hasTimestamps } = React.useMemo(() => {
        const detailedHistoryMap = history?.data?.transactionMap || new Map<string, TransactionWithMeta>();
        const hasTimestamps = transactionRows.some(element => element.blockTime);
        const mintMap = new Map<string, MintDetails>();
        const allTransfers: TransferData[] = [];

        transactionRows.forEach(({ signature, blockTime, statusText, statusClass }) => {
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
                allTransfers.push({
                    ...getRawAmount({ mintMap, tokenInfoDecimals: tokenInfo?.decimals, transfer }),
                    blockTime: blockTime || undefined,
                    childIndex,
                    index,
                    signature,
                    statusClass,
                    statusText,
                    transfer,
                });
            });
        });

        return {
            allTransfers,
            hasTimestamps,
        };
    }, [history, transactionRows, tokenInfo, pubkey, address, cluster]);

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
    const tokenAddress = pubkey.toBase58();
    const units = tokenInfo?.symbol || (tokenInfoLoading ? '' : 'Tokens');

    const columns: GridTableColumn<TransferData>[] = [
        {
            cell: { wrap: 'nowrap' },
            header: 'Transaction Signature',
            render: ({ signature }) => <Signature signature={signature} link />,
        },
        {
            cell: { wrap: 'nowrap' },
            header: 'Source',
            render: ({ transfer }) => <Address pubkey={transfer.source} link />,
        },
        {
            cell: { wrap: 'nowrap' },
            header: 'Destination',
            render: ({ transfer }) => <Address pubkey={transfer.destination} link />,
        },
        {
            cell: { wrap: 'nowrap' },
            header: 'Amount',
            render: ({ decimals, rawAmount }) => (
                <AmountCell decimals={decimals} rawAmount={rawAmount} tokenAddress={tokenAddress} units={units} />
            ),
        },
        {
            cell: { wrap: 'nowrap' },
            header: 'Result',
            render: ({ statusClass, statusText }) => (
                <Badge ui="dashkit" variant={statusClass as 'success' | 'warning'}>
                    {statusText}
                </Badge>
            ),
        },
    ];

    if (hasTimestamps) {
        columns.splice(1, 0, {
            cell: { wrap: 'nowrap' },
            cellClassName: 'text-dk-gray-700',
            header: 'Age',
            render: ({ blockTime }) => (blockTime ? <RelativeTime date={blockTime * 1000} /> : null),
        });
    }

    const gridTemplate = hasTimestamps
        ? 'grid-cols-[auto_auto_auto_auto_auto_auto]'
        : 'grid-cols-[auto_auto_auto_auto_auto]';

    return (
        <GridTableCard
            actions={
                <RefreshButton
                    analyticsSection="token_transfers_header"
                    failed={history.status === FetchStatus.FetchFailed}
                    fetching={fetching}
                    onClick={() => refresh()}
                />
            }
            ariaLabel="Token transfers"
            collapsible={false}
            columns={columns}
            empty={null}
            footer={
                <div className="mt-2 w-full">
                    <HistoryCardFooterContent
                        fetching={fetching}
                        foundOldest={history.data.foundOldest}
                        loadMore={() => loadMore()}
                    />
                </div>
            }
            getRowKey={transferData => transferData.signature + transferData.index + (transferData.childIndex || '')}
            gridTemplate={gridTemplate}
            mobile="stack"
            rows={allTransfers}
            title="Token Transfers"
        />
    );
}

// A `transfer` instruction holds no decimals, so they come from the token info or from a token balance.
function getRawAmount({
    transfer,
    tokenInfoDecimals,
    mintMap,
}: {
    transfer: Transfer | TransferChecked;
    tokenInfoDecimals: number | null | undefined;
    mintMap: Map<string, MintDetails>;
}): RawAmount {
    if ('tokenAmount' in transfer) {
        return { decimals: transfer.tokenAmount.decimals, rawAmount: transfer.tokenAmount.amount };
    }
    const decimals =
        tokenInfoDecimals ||
        mintMap.get(transfer.source.toBase58())?.decimals ||
        mintMap.get(transfer.destination.toBase58())?.decimals ||
        0;
    return { decimals, rawAmount: transfer.amount };
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
