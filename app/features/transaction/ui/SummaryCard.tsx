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
import { estimateRequestedComputeUnitsForParsedTransaction } from '@entities/compute-unit';
import { formatTransactionVersion } from '@entities/transaction-data';
import {
    BaseResourceFeeProjection,
    derivePriorityFeeLamports,
    estimateRequestedCostUnits,
    isSimd0553FeeEnabled,
    projectResourceAndInclusionFees,
} from '@entities/transaction-fee';
import { ViewReceiptButton } from '@features/receipt';
import { FetchStatus } from '@providers/cache';
import { useCluster, useEpochSchedule } from '@providers/cluster';
import {
    TransactionStatusInfo,
    useFetchTransactionStatus,
    useTransactionDetails,
    useTransactionStatus,
} from '@providers/transactions';
import type { TransactionVersion } from '@solana/kit';
import { PACKET_DATA_SIZE, ParsedTransaction, SystemInstruction, SystemProgram } from '@solana/web3.js';
import { Cluster, ClusterStatus } from '@utils/cluster';
import { displayTimestamp, displayTimestampUtc } from '@utils/date';
import { SignatureProps } from '@utils/index';
import { getTransactionInstructionError } from '@utils/program-err';
import { intoTransactionInstruction } from '@utils/tx';
import { useBuildClusterPath, useClusterPath } from '@utils/url';
import Link from 'next/link';
import { useCallback, useEffect, useRef } from 'react';
import { ZoomIn } from 'react-feather';

import { useFetchRawTransaction, useRawTransactionDetails } from '@/app/providers/transactions/raw';
import { DownloadDropdown } from '@/app/shared/components/DownloadDropdown';
import { Logger } from '@/app/shared/lib/logger';
import { AutoRefresh, useAutoRefreshInterval, WithAutoRefreshProp } from '@/app/shared/lib/use-auto-refresh';
import { V1_TRANSACTION_SIZE_LIMIT } from '@/app/shared/lib/v1-message-bridge';
import { Card } from '@/app/shared/ui/Card';
import { KeyValue, TextValue } from '@/app/shared/ui/key-value';
import { getEpochForSlot } from '@/app/utils/epoch-schedule';

import { TransactionNotFoundCard } from './TransactionNotFoundCard';

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
    const { cluster, status: clusterStatus } = useCluster();
    const epochSchedule = useEpochSchedule();
    const inspectPath = useClusterPath({ pathname: `/tx/${signature}/inspect` });
    // The error link's target is only known inside the render below, so this needs the callback form.
    const buildClusterPath = useBuildClusterPath();
    const receiptPath = useClusterPath({
        additionalParams: new URLSearchParams({ view: 'receipt' }),
        pathname: `/tx/${signature}`,
    });

    const serializedRawData = rawDetails?.data?.raw?.messageBytes;
    const serializedSize = rawDetails?.data?.raw?.serializedSize;
    // Read the version off the raw details rather than the parsed ones, so the size and the limit it
    // is compared against always come from the same fetch.
    const rawVersion = rawDetails?.data?.raw?.version;
    const blockTime = rawDetails?.data?.raw?.blockTime ?? details?.data?.transactionWithMeta?.blockTime ?? undefined;
    // This card needs only the status to render, so both transaction fetches can still be in flight.
    // The row must show "Unavailable" only after both fetches return.
    const blockTimeAnswered = isFetched(rawDetails) && isFetched(details);

    // A finalized mainnet transaction always has a block time. Other clusters and commitments can lack one.
    const isFinalizedOnMainnet = cluster === Cluster.MainnetBeta && status?.data?.info?.confirmations === 'max';
    const hasSettledWithoutBlockTime = isFinalizedOnMainnet && blockTime === undefined && blockTimeAnswered;
    useEffect(() => {
        if (!hasSettledWithoutBlockTime) return;
        Logger.warn('[transaction] finalized transaction has no block time', {
            sentry: true,
            sentryExtras: { signature },
        });
    }, [hasSettledWithoutBlockTime, signature]);

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

    // `getTransaction` returns `null` until the transaction is confirmed, and the status has no wire bytes
    // or block time. Auto-refresh stops at finalization, so the Refresh button must also retry the transaction.
    //
    // `rawDetails` changes on every fetch, so `refresh` reads it through a ref to stay stable.
    const rawEntryRef = useRef(rawDetails);
    rawEntryRef.current = rawDetails;
    const refresh = useCallback(() => {
        fetchStatus(signature);
        const entry = rawEntryRef.current;
        // The raw cache keeps the last response, so an overlapping request can replace a found transaction
        // with `null`. If auto-refresh stops, that `null` stays until the Refresh button retries.
        if (!entry?.data?.raw && entry?.status !== FetchStatus.Fetching) fetchRaw(signature);
    }, [fetchStatus, fetchRaw, signature]);
    useAutoRefreshInterval(autoRefresh, refresh);

    if (!status || (status.status === FetchStatus.Fetching && autoRefresh === AutoRefresh.Inactive)) {
        return <LoadingCard />;
    } else if (status.status === FetchStatus.FetchFailed) {
        return <ErrorCard retry={() => fetchStatus(signature)} text="Fetch Failed" />;
    } else if (!status.data?.info) {
        return <TransactionNotFoundCard signature={signature} retry={() => fetchStatus(signature)} />;
    }

    const { info } = status.data;

    const transactionWithMeta = details?.data?.transactionWithMeta;
    const fee = transactionWithMeta?.meta?.fee;
    const costUnits = transactionWithMeta?.meta?.costUnits;
    const computeUnitsConsumed = transactionWithMeta?.meta?.computeUnitsConsumed;
    const transactionConfig = rawDetails?.data?.raw?.transactionConfig;
    // v1 declares its compute unit limit on the message; every earlier version has to have it
    // reconstructed from the Compute Budget instructions, which v1 does not carry.
    const reservedCUs =
        transactionConfig?.computeUnitLimit ??
        (transactionWithMeta?.transaction && transactionWithMeta.version !== 1
            ? estimateRequestedComputeUnitsForParsedTransaction(
                  transactionWithMeta.transaction,
                  epochSchedule ? getEpochForSlot(epochSchedule, BigInt(info.slot)) : undefined,
                  cluster,
              )
            : undefined);
    const transaction = transactionWithMeta?.transaction;
    const blockhash = transaction?.message.recentBlockhash;
    const version = transactionWithMeta?.version;
    const feePayer = transaction?.message.accountKeys[0]?.pubkey;
    const priorityFeeLamports = readPriorityFeeLamports({
        declared: transactionConfig?.priorityFeeLamports,
        feeLamports: fee,
        signatureCount: transaction?.signatures.length,
    });
    // SIMD-0553 charges the cost units a transaction *requested*, while `costUnits` reports what it
    // executed, so the requested compute limit is needed to correct it. Without one there is nothing
    // honest to project, and the row is left out.
    const feeProjections =
        isSimd0553FeeEnabled() &&
        costUnits !== undefined &&
        computeUnitsConsumed !== undefined &&
        reservedCUs !== undefined &&
        priorityFeeLamports !== undefined
            ? projectResourceAndInclusionFees({
                  priorityFeeLamports,
                  requestedCostUnits: estimateRequestedCostUnits({
                      computeUnitsConsumed,
                      executedCostUnits: costUnits,
                      requestedComputeUnits: reservedCUs,
                  }),
              })
            : undefined;

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
            // Hand-assembling the query here gets the cluster slug, the endpoint encoding and the
            // pending-consent case wrong.
            errorLink = buildClusterPath(err.errorLink);
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
                        onClick={refresh}
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
                <KeyValue label="Status" valueClassName="flex-wrap items-center gap-x-3 gap-y-2">
                    <Badge ui="dashkit" variant={statusClass}>
                        {statusText}
                    </Badge>
                    {errorReason && (
                        <Badge
                            ui="dashkit"
                            variant={statusClass}
                            className="min-w-0 max-w-full !whitespace-normal break-words !text-left"
                        >
                            {errorLink ? <Link href={errorLink}>{errorReason}</Link> : errorReason}
                        </Badge>
                    )}
                </KeyValue>

                <KeyValue label="Confirmation">
                    <TextValue mono={false}>{statusFinality}</TextValue>
                </KeyValue>

                <KeyValue label="Signature">
                    <Signature signature={signature} alignItems="start" noTruncate />
                </KeyValue>

                {feePayer && (
                    <KeyValue label="Fee payer">
                        <Address pubkey={feePayer} link noTruncate />
                    </KeyValue>
                )}

                <KeyValue label="Slot">
                    <Slot slot={info.slot} link />
                </KeyValue>

                {blockhash && (
                    <KeyValue
                        label={
                            isNonce ? (
                                'Nonce'
                            ) : (
                                <InfoTooltip text="Transactions use a previously confirmed blockhash as a nonce to prevent double spends">
                                    Recent Blockhash
                                </InfoTooltip>
                            )
                        }
                    >
                        <TextValue>{blockhash}</TextValue>
                    </KeyValue>
                )}

                {fee !== undefined && (
                    <KeyValue label="Fee">
                        <SolBalance lamports={fee} />
                    </KeyValue>
                )}

                {/* Projected fee under SIMD-0553's inclusion + burned resource fee model */}
                {fee !== undefined && feeProjections !== undefined && (
                    <KeyValue
                        label={
                            <InfoTooltip text="Not active yet. SIMD-0553 would charge a 2,500-lamport inclusion fee to the leader plus a burned resource fee on the cost units a transaction requests, replacing today's flat 5,000-per-signature base fee and leaving the priority fee unchanged. Estimated by swapping this transaction's consumed compute units for its requested limit; the loaded-accounts-data-size term still reflects what it loaded, so each figure is a floor.">
                                Fee under SIMD-0553
                            </InfoTooltip>
                        }
                    >
                        <BaseResourceFeeProjection currentFeeLamports={fee} projections={feeProjections} />
                    </KeyValue>
                )}

                {costUnits !== undefined && (
                    <KeyValue label="Transaction cost">
                        <TextValue>{costUnits.toLocaleString('en-US')}</TextValue>
                    </KeyValue>
                )}

                {computeUnitsConsumed !== undefined && reservedCUs !== undefined && (
                    <KeyValue label="CUs Consumed / Limit">
                        <TextValue>
                            {computeUnitsConsumed.toLocaleString('en-US')} / {reservedCUs.toLocaleString('en-US')}
                        </TextValue>
                    </KeyValue>
                )}
                {computeUnitsConsumed !== undefined && reservedCUs === undefined && (
                    <KeyValue label="CUs Consumed">
                        <TextValue>{computeUnitsConsumed.toLocaleString('en-US')}</TextValue>
                    </KeyValue>
                )}

                {/* v1 message-level resource limits */}
                {transactionConfig?.priorityFeeLamports !== undefined && (
                    <KeyValue
                        label={
                            <InfoTooltip text="A total amount paid for prioritization, unlike the per-compute-unit price used before v1">
                                Priority fee (total)
                            </InfoTooltip>
                        }
                    >
                        <SolBalance lamports={transactionConfig.priorityFeeLamports} />
                    </KeyValue>
                )}
                {transactionConfig?.loadedAccountsDataSizeLimit !== undefined && (
                    <KeyValue label="Loaded accounts data size limit">
                        <TextValue>{transactionConfig.loadedAccountsDataSizeLimit.toLocaleString('en-US')}</TextValue>
                    </KeyValue>
                )}
                {transactionConfig?.heapSize !== undefined && (
                    <KeyValue label="Heap size">
                        <TextValue>{transactionConfig.heapSize.toLocaleString('en-US')}</TextValue>
                    </KeyValue>
                )}

                {version !== undefined && (
                    <KeyValue label="Transaction Version" valueClassName="font-mono uppercase">
                        {formatTransactionVersion(version)}
                    </KeyValue>
                )}

                {serializedSize !== undefined && (
                    <KeyValue
                        label={
                            <InfoTooltip text="Size on the wire: signatures plus the compiled message">
                                Transaction size
                            </InfoTooltip>
                        }
                        valueClassName="flex-wrap items-baseline gap-x-2 font-mono"
                    >
                        {serializedSize.toLocaleString('en-US')} bytes
                        {/* No over-limit styling here, unlike the inspector: a transaction that landed is
                            necessarily within the limit. The cap is context for headroom. */}
                        <span className="text-xs text-outer-space-300">
                            Max is {transactionSizeLimit(rawVersion).toLocaleString('en-US')} bytes
                        </span>
                    </KeyValue>
                )}

                {blockTime !== undefined ? (
                    <>
                        <KeyValue label="Timestamp (Local)">
                            <span className="font-mono">{displayTimestamp(blockTime * 1000, true)}</span>
                        </KeyValue>
                        <KeyValue label="Timestamp (UTC)" divider={false}>
                            <span className="font-mono">{displayTimestampUtc(blockTime * 1000, true)}</span>
                        </KeyValue>
                    </>
                ) : blockTimeAnswered ? (
                    <KeyValue label="Timestamp" divider={false}>
                        <InfoTooltip bottom text="Timestamps are only available for confirmed blocks">
                            Unavailable
                        </InfoTooltip>
                    </KeyValue>
                ) : undefined}
            </Card>
        </section>
    );
}

function isFetched(entry?: { status: FetchStatus }): boolean {
    return entry?.status === FetchStatus.Fetched;
}

/**
 * SIMD-0553 carries priority fees over unchanged, so projecting a total needs them split out of the
 * single summed `fee` the RPC reports. v1 declares its total priority fee on the message; every
 * earlier version has to have it backed out of the total.
 */
function readPriorityFeeLamports({
    declared,
    feeLamports,
    signatureCount,
}: {
    declared: bigint | number | undefined;
    feeLamports: number | undefined;
    signatureCount: number | undefined;
}): number | undefined {
    if (declared !== undefined) {
        return Number(declared);
    }
    if (feeLamports === undefined || signatureCount === undefined) {
        return undefined;
    }
    return derivePriorityFeeLamports({ feeLamports, signatureCount });
}

/**
 * v1 raised the ceiling past the UDP packet size every earlier version is bounded by. Matches the
 * inspector's limit, so the same transaction reads the same on both pages.
 *
 * Deliberately not kit's `getTransactionSizeLimit`: that one masks the first message byte and treats
 * `1` as v1, but a legacy message opens with its signer count — so every single-signer legacy
 * transaction comes back as 4096. Keyed off the decoded version, which can't be confused that way.
 */
function transactionSizeLimit(version: TransactionVersion | undefined): number {
    return version === 1 ? V1_TRANSACTION_SIZE_LIMIT : PACKET_DATA_SIZE;
}
