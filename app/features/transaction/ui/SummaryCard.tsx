import { Address } from '@components/common/Address';
import { ErrorCard } from '@components/common/ErrorCard';
import { InfoTooltip } from '@components/common/InfoTooltip';
import { LoadingCard } from '@components/common/LoadingCard';
import { Signature } from '@components/common/Signature';
import { Slot } from '@components/common/Slot';
import { SolBalance } from '@components/common/SolBalance';
import { Badge } from '@components/shared/ui/badge';
import { Button } from '@components/shared/ui/button';
import { RefreshButton } from '@components/shared/ui/refresh-button';
import { cn } from '@components/shared/utils';
import { estimateRequestedComputeUnitsForParsedTransaction } from '@entities/compute-unit';
import { ViewReceiptButton } from '@features/receipt';
import { FetchStatus } from '@providers/cache';
import { useCluster } from '@providers/cluster';
import {
    TransactionStatusInfo,
    useFetchTransactionStatus,
    useTransactionDetails,
    useTransactionStatus,
} from '@providers/transactions';
import { ParsedTransaction, SystemInstruction, SystemProgram } from '@solana/web3.js';
import { Cluster, ClusterStatus } from '@utils/cluster';
import { displayTimestamp } from '@utils/date';
import { SignatureProps } from '@utils/index';
import { getTransactionInstructionError } from '@utils/program-err';
import { intoTransactionInstruction } from '@utils/tx';
import { useClusterPath } from '@utils/url';
import Link from 'next/link';
import React, { useEffect, useMemo } from 'react';
import { ZoomIn } from 'react-feather';

import { useFetchRawTransaction, useRawTransactionDetails } from '@/app/providers/transactions/raw';
import { DownloadDropdown } from '@/app/shared/components/DownloadDropdown';
import { AUTO_REFRESH_INTERVAL, AutoRefresh, WithAutoRefreshProp } from '@/app/shared/lib/use-auto-refresh';
import { Card } from '@/app/shared/ui/Card';
import { getEpochForSlot } from '@/app/utils/epoch-schedule';

type RowProps = React.HTMLAttributes<HTMLDivElement> & { divider?: boolean };
export function Row({ children, className, divider, ...props }: RowProps) {
    return (
        <div
            className={cn(
                'grid min-h-9 grid-cols-[clamp(100px,25%,200px)_1fr] items-baseline gap-2 px-3 py-2.5 md:px-4',
                divider && 'border-1 border-b border-white/10 [border-bottom-style:solid]',
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
}

function Label({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('flex flex-wrap items-center gap-1 overflow-hidden text-sm text-outer-space-300', className)}
            {...props}
        >
            {children}
        </div>
    );
}

function Value({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('break-all font-mono text-sm text-white', className)} {...props}>
            {children}
        </div>
    );
}

function getTransactionErrorReason(
    info: TransactionStatusInfo,
    tx: ParsedTransaction | undefined,
): { errorReason: string; errorLink?: string } {
    if (typeof info.result.err === 'string') {
        return { errorReason: `Runtime Error: "${info.result.err}"` };
    }

    const programError = getTransactionInstructionError(info.result.err);
    if (programError !== undefined) {
        return { errorReason: `Program Error: "Instruction #${programError.index + 1} Failed"` };
    }

    const { InsufficientFundsForRent } = info.result.err as { InsufficientFundsForRent?: { account_index: number } };
    if (InsufficientFundsForRent !== undefined) {
        const address = tx?.message.accountKeys[InsufficientFundsForRent.account_index]?.pubkey;
        if (address) {
            return { errorLink: `/address/${address}`, errorReason: `Insufficient Funds For Rent: ${address}` };
        }
        return { errorReason: `Insufficient Funds For Rent: Account #${InsufficientFundsForRent.account_index + 1}` };
    }

    return { errorReason: `Unknown Error: "${JSON.stringify(info.result.err)}"` };
}

export function SummaryCard({ signature, autoRefresh }: SignatureProps & WithAutoRefreshProp) {
    const fetchStatus = useFetchTransactionStatus();
    const fetchRaw = useFetchRawTransaction();
    const status = useTransactionStatus(signature);
    const details = useTransactionDetails(signature);
    const rawDetails = useRawTransactionDetails(signature);
    const { cluster, clusterInfo, name: clusterName, status: clusterStatus, url: clusterUrl } = useCluster();
    const inspectPath = useClusterPath({ pathname: `/tx/${signature}/inspect` });
    const receiptPath = useClusterPath({
        additionalParams: new URLSearchParams({ view: 'receipt' }),
        pathname: `/tx/${signature}`,
    });

    const rawMessage = rawDetails?.data?.raw?.message;
    const serializedRawData = useMemo(() => rawMessage?.serialize(), [rawMessage]);

    useEffect(() => {
        if (!rawDetails && clusterStatus === ClusterStatus.Connected) {
            fetchRaw(signature);
        }
    }, [signature, clusterStatus]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!status && clusterStatus === ClusterStatus.Connected) {
            fetchStatus(signature);
        }
    }, [signature, clusterStatus]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (autoRefresh === AutoRefresh.Active) {
            const intervalHandle: NodeJS.Timeout = setInterval(() => fetchStatus(signature), AUTO_REFRESH_INTERVAL);
            return () => {
                clearInterval(intervalHandle);
            };
        }
    }, [autoRefresh, fetchStatus, signature]);

    if (!status || (status.status === FetchStatus.Fetching && autoRefresh === AutoRefresh.Inactive)) {
        return <LoadingCard />;
    } else if (status.status === FetchStatus.FetchFailed) {
        return <ErrorCard retry={() => fetchStatus(signature)} text="Fetch Failed" />;
    } else if (!status.data?.info) {
        if (clusterInfo && clusterInfo.firstAvailableBlock > 0) {
            return (
                <ErrorCard
                    retry={() => fetchStatus(signature)}
                    text="Not Found"
                    subtext={`Note: Transactions processed before block ${clusterInfo.firstAvailableBlock} are not available at this time`}
                />
            );
        }
        return <ErrorCard retry={() => fetchStatus(signature)} text="Not Found" />;
    }

    const { info } = status.data;

    const transactionWithMeta = details?.data?.transactionWithMeta;
    const fee = transactionWithMeta?.meta?.fee;
    const costUnits = transactionWithMeta?.meta?.costUnits;
    const computeUnitsConsumed = transactionWithMeta?.meta?.computeUnitsConsumed;
    const reservedCUs = transactionWithMeta?.transaction
        ? estimateRequestedComputeUnitsForParsedTransaction(
              transactionWithMeta.transaction,
              clusterInfo ? getEpochForSlot(clusterInfo.epochSchedule, BigInt(info.slot)) : undefined,
              cluster,
          )
        : undefined;
    const transaction = transactionWithMeta?.transaction;
    const blockhash = transaction?.message.recentBlockhash;
    const version = transactionWithMeta?.version;
    const feePayer = transaction?.message.accountKeys[0]?.pubkey;

    const isNonce = (() => {
        if (!transaction || transaction.message.instructions.length < 1) return false;
        const ix = intoTransactionInstruction(transaction, transaction.message.instructions[0]);
        return (
            ix &&
            SystemProgram.programId.equals(ix.programId) &&
            SystemInstruction.decodeInstructionType(ix) === 'AdvanceNonceAccount'
        );
    })();

    let statusClass: 'success' | 'warning' = 'success';
    let statusText = 'Success';
    let statusFinality = 'Finalized (MAX Confirmations)';
    let errorReason = undefined;
    let errorLink = undefined;

    if (info.result.err) {
        statusClass = 'warning';
        statusText = 'Error';

        const err = getTransactionErrorReason(info, transaction);
        errorReason = err.errorReason;
        if (err.errorLink !== undefined) {
            errorLink =
                cluster === Cluster.MainnetBeta
                    ? err.errorLink
                    : `${err.errorLink}?cluster=${clusterName.toLowerCase()}${cluster === Cluster.Custom ? `&customUrl=${clusterUrl}` : ''}`;
        }
    } else if (info.confirmations !== 'max') {
        statusFinality = `${info.confirmations ?? 0} confirmation${info.confirmations === 1 ? '' : 's'}`;
    }

    return (
        <section id="summary" className="flex flex-col gap-3">
            <div className="flex justify-between">
                <h2 className="m-0 text-lg font-normal text-white">Summary</h2>
                <div className="flex shrink-0 gap-1">
                    <ViewReceiptButton
                        signature={signature}
                        transactionWithMeta={transactionWithMeta}
                        receiptPath={receiptPath}
                    />
                    <Button variant="outline" size="sm" asChild aria-label="Inspect">
                        <Link href={inspectPath}>
                            <ZoomIn size={12} />
                            <span className="d-none d-md-inline">Inspect</span>
                        </Link>
                    </Button>
                    <RefreshButton
                        fetching={autoRefresh === AutoRefresh.Active}
                        analyticsSection="transaction_card"
                        onClick={() => fetchStatus(signature)}
                    />
                    <DownloadDropdown
                        filename={signature}
                        data={serializedRawData}
                        loading={rawDetails?.status === FetchStatus.Fetching}
                        error={
                            rawDetails?.status === FetchStatus.FetchFailed
                                ? new Error('Failed to fetch raw transaction')
                                : undefined
                        }
                    />
                </div>
            </div>

            <Card ui="dashkit">
                {/* Status */}
                <Row divider>
                    <Label>Status</Label>
                    <Value className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <Badge ui="dashkit" variant={statusClass}>
                            {statusText}
                        </Badge>
                        {errorReason && (
                            <Badge
                                ui="dashkit"
                                variant={statusClass}
                                className="whitespace-normal break-words text-left"
                            >
                                {errorLink ? <Link href={errorLink}>{errorReason}</Link> : errorReason}
                            </Badge>
                        )}
                    </Value>
                </Row>

                {/* Confirmation */}
                <Row divider>
                    <Label>Confirmation</Label>
                    <Value>{statusFinality}</Value>
                </Row>

                {/* Signature */}
                <Row divider>
                    <Label>Signature</Label>
                    <Value>
                        <Signature signature={signature} alignItems="start" noTruncate />
                    </Value>
                </Row>

                {/* Signed by (fee payer) */}
                {feePayer && (
                    <Row divider>
                        <Label>Fee payer</Label>
                        <Value>
                            <Address pubkey={feePayer} link noTruncate />
                        </Value>
                    </Row>
                )}

                {/* Slot */}
                <Row divider>
                    <Label>Slot</Label>
                    <Value>
                        <Slot slot={info.slot} link />
                    </Value>
                </Row>

                {/* Recent Blockhash / Nonce */}
                {blockhash && (
                    <Row divider>
                        <Label className="overflow-visible">
                            {isNonce ? (
                                'Nonce'
                            ) : (
                                <InfoTooltip text="Transactions use a previously confirmed blockhash as a nonce to prevent double spends">
                                    Recent Blockhash
                                </InfoTooltip>
                            )}
                        </Label>
                        <Value>{blockhash}</Value>
                    </Row>
                )}

                {/* Fee */}
                {fee !== undefined && (
                    <Row divider>
                        <Label>Fee</Label>
                        <Value>
                            <SolBalance lamports={fee} />
                        </Value>
                    </Row>
                )}

                {/* Transaction cost */}
                {costUnits !== undefined && (
                    <Row divider>
                        <Label>Transaction cost</Label>
                        <Value>{costUnits.toLocaleString('en-US')}</Value>
                    </Row>
                )}

                {/* CUs Consumed / Limit */}
                {computeUnitsConsumed !== undefined && reservedCUs !== undefined && (
                    <Row divider>
                        <Label>CUs Consumed / Limit</Label>
                        <Value>
                            {computeUnitsConsumed.toLocaleString('en-US')} / {reservedCUs.toLocaleString('en-US')}
                        </Value>
                    </Row>
                )}
                {computeUnitsConsumed !== undefined && reservedCUs === undefined && (
                    <Row divider>
                        <Label>CUs Consumed</Label>
                        <Value>{computeUnitsConsumed.toLocaleString('en-US')}</Value>
                    </Row>
                )}

                {/* Transaction Version */}
                {version !== undefined && (
                    <Row divider>
                        <Label>Transaction Version</Label>
                        <Value className="uppercase">{version}</Value>
                    </Row>
                )}

                {/* Timestamp */}
                <Row>
                    <Label>Timestamp</Label>
                    <Value>
                        {info.timestamp !== 'unavailable' ? (
                            <span className="font-mono">{displayTimestamp(info.timestamp * 1000)}</span>
                        ) : (
                            <InfoTooltip bottom text="Timestamps are only available for confirmed blocks">
                                Unavailable
                            </InfoTooltip>
                        )}
                    </Value>
                </Row>
            </Card>
        </section>
    );
}
