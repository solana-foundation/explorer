'use client';

import ScaledUiAmountMultiplierTooltip from '@components/account/token-extensions/ScaledUiAmountMultiplierTooltip';
import { Address } from '@components/common/Address';
import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { Signature } from '@components/common/Signature';
import { TokenInstructionType, Transfer, TransferChecked } from '@components/instruction/token/types';
import { isTokenProgramData, useAccountHistory } from '@providers/accounts';
import { useFetchAccountHistory } from '@providers/accounts/history';
import { useScaledUiAmountForMint } from '@providers/accounts/tokens';
import { FetchStatus } from '@providers/cache';
import { useCluster } from '@providers/cluster';
import { ParsedInstruction, ParsedTransactionWithMeta, PartiallyDecodedInstruction, PublicKey } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { normalizeTokenAmount } from '@utils/index';
import { InstructionContainer } from '@utils/instruction';
import React, { useMemo } from 'react';
import { create } from 'superstruct';
import useSWR from 'swr';

import { Badge } from '@/app/components/shared/ui/badge';
import { Logger } from '@/app/shared/lib/logger';
import { RelativeTime } from '@/app/shared/RelativeTime';
import { Card } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';
import { getTokenInfo, getTokenInfoSwrKey } from '@/app/utils/token-info';

import { getTransactionRows, HistoryCardFooter, HistoryCardHeader } from '../HistoryCardComponents';
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

async function fetchTokenInfo([_, address, cluster, url]: ['get-token-info', string, Cluster, string]) {
    return await getTokenInfo(new PublicKey(address), cluster, url);
}

function TransferRow({
    data,
    hasTimestamps,
    tokenAddress,
}: {
    data: TransferData;
    hasTimestamps: boolean;
    tokenAddress: string | undefined;
}) {
    const { signature, blockTime, statusText, statusClass, transfer, index, childIndex, amountString, units } = data;
    const [amountWithScaledUiAmountMultiplier, scaledUiAmountMultiplier] = useScaledUiAmountForMint(
        tokenAddress,
        amountString,
    );

    return (
        <BaseTable.Row key={signature + index + (childIndex || '')}>
            <BaseTable.Cell>
                <Signature signature={signature} link />
            </BaseTable.Cell>

            {hasTimestamps && (
                <BaseTable.Cell className="text-muted">
                    {blockTime && <RelativeTime date={blockTime * 1000} />}
                </BaseTable.Cell>
            )}

            <BaseTable.Cell>
                <Address pubkey={transfer.source} link />
            </BaseTable.Cell>

            <BaseTable.Cell>
                <Address pubkey={transfer.destination} link />
            </BaseTable.Cell>

            <BaseTable.Cell>
                {amountWithScaledUiAmountMultiplier} {units}
                <ScaledUiAmountMultiplierTooltip
                    rawAmount={amountString}
                    scaledUiAmountMultiplier={scaledUiAmountMultiplier}
                />
            </BaseTable.Cell>

            <BaseTable.Cell>
                <Badge ui="dashkit" variant={statusClass as 'success' | 'warning'}>
                    {statusText}
                </Badge>
            </BaseTable.Cell>
        </BaseTable.Row>
    );
}

export function TokenTransfersCard({ address }: { address: string }) {
    const { cluster, url } = useCluster();
    const pubkey = useMemo(() => new PublicKey(address), [address]);
    const history = useAccountHistory(address);
    const fetchAccountHistory = useFetchAccountHistory();
    const refresh = () => fetchAccountHistory(pubkey, true, true);
    const loadMore = () => fetchAccountHistory(pubkey, true);
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
        const detailedHistoryMap = history?.data?.transactionMap || new Map<string, ParsedTransactionWithMeta>();
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
    return (
        <Card ui="dashkit">
            <HistoryCardHeader
                fetching={fetching}
                refresh={() => refresh()}
                title="Token Transfers"
                analyticsSection="token_transfers_header"
            />
            <BaseTable ui="dashkit" variant="card" nowrap>
                <BaseTable.Head>
                    <BaseTable.Row>
                        <BaseTable.HeaderCell className="text-muted">Transaction Signature</BaseTable.HeaderCell>
                        {hasTimestamps && <BaseTable.HeaderCell className="text-muted">Age</BaseTable.HeaderCell>}
                        <BaseTable.HeaderCell className="text-muted">Source</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="text-muted">Destination</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="text-muted">Amount</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="text-muted">Result</BaseTable.HeaderCell>
                    </BaseTable.Row>
                </BaseTable.Head>
                <BaseTable.Body className="list">
                    {allTransfers.map(transferData => (
                        <TransferRow
                            key={transferData.signature + transferData.index + (transferData.childIndex || '')}
                            data={transferData}
                            hasTimestamps={hasTimestamps}
                            tokenAddress={pubkey.toBase58()}
                        />
                    ))}
                </BaseTable.Body>
            </BaseTable>
            <HistoryCardFooter fetching={fetching} foundOldest={history.data.foundOldest} loadMore={() => loadMore()} />
        </Card>
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
