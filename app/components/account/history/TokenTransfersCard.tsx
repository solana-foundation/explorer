'use client';

import ScaledUiAmountMultiplierTooltip from '@components/account/token-extensions/ScaledUiAmountMultiplierTooltip';
import { Address } from '@components/common/Address';
import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { Signature } from '@components/common/Signature';
import { TokenInstructionType, Transfer, TransferChecked } from '@components/instruction/token/types';
import { useUnbatchedTokenInfo } from '@entities/token-info';
import { type TransactionWithMeta } from '@entities/transaction-data';
import { useFetchAccountHistory } from '@features/transaction-history/model/use-fetch-account-history';
import { isTokenProgramData, useAccountHistory } from '@providers/accounts';
import { useScaledUiAmountForMint } from '@providers/accounts/tokens';
import { FetchStatus } from '@providers/cache';
import { useCluster } from '@providers/cluster';
import { HistoryCardFooterContent } from '@shared/ui/HistoryCard';
import { address as toAddress } from '@solana/kit';
import { ParsedInstruction, PartiallyDecodedInstruction, PublicKey } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { normalizeTokenAmount } from '@utils/index';
import { InstructionContainer } from '@utils/instruction';
import React, { useMemo } from 'react';
import { create } from 'superstruct';

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

type TransferData = {
    amountString: string;
    blockTime: number | undefined;
    childIndex?: number;
    index: number;
    signature: string;
    statusClass: string;
    statusText: string;
    transfer: Transfer | TransferChecked;
    units: string;
};

function AmountCell({
    amountString,
    tokenAddress,
    units,
}: {
    amountString: string;
    tokenAddress: string;
    units: string;
}) {
    const [amountWithScaledUiAmountMultiplier, scaledUiAmountMultiplier] = useScaledUiAmountForMint(
        tokenAddress,
        amountString,
    );

    return (
        <>
            {amountWithScaledUiAmountMultiplier} {units}
            <ScaledUiAmountMultiplierTooltip
                rawAmount={amountString}
                scaledUiAmountMultiplier={scaledUiAmountMultiplier}
            />
        </>
    );
}

export function TokenTransfersCard({ address }: { address: string }) {
    const { cluster, genesisHash } = useCluster();
    const pubkey = useMemo(() => new PublicKey(address), [address]);
    const history = useAccountHistory(address);
    const fetchAccountHistory = useFetchAccountHistory();
    const refresh = () => fetchAccountHistory(toAddress(address), true, true);
    const loadMore = () => fetchAccountHistory(toAddress(address), true);
    const { isLoading: tokenInfoLoading, tokenInfo } = useUnbatchedTokenInfo({ cluster, genesisHash, mint: address });

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
                let units = 'Tokens';
                let amountString = '';

                // Loading token info, just don't show units
                if (tokenInfoLoading) {
                    units = '';
                }

                // Loaded symbol, use it
                if (tokenInfo?.symbol) {
                    units = tokenInfo.symbol;
                }

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
                    amountString,
                    blockTime: blockTime || undefined,
                    childIndex,
                    index,
                    signature,
                    statusClass,
                    statusText,
                    transfer,
                    units,
                });
            });
        });

        return {
            allTransfers,
            hasTimestamps,
        };
    }, [history, transactionRows, tokenInfo, pubkey, address, cluster, tokenInfoLoading]);

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
            render: ({ amountString, units }) => (
                <AmountCell amountString={amountString} tokenAddress={tokenAddress} units={units} />
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
            if (cluster === Cluster.MainnetBeta) {
                Logger.error(error, {
                    signature,
                });
            }
        }
    }
    return undefined;
}
