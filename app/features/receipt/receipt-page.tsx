'use client';

import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { SignatureContext } from '@components/instruction/SignatureContext';
import { buildExplorerLink, useExplorerLink } from '@entities/cluster';
import { FetchStatus } from '@providers/cache';
import { useCluster } from '@providers/cluster';
import { useFetchTransactionStatus, useTransactionDetails, useTransactionStatus } from '@providers/transactions';
import { useFetchTransactionDetails } from '@providers/transactions/parsed';
import { NATIVE_MINT } from '@solana/spl-token';
import { TransactionSignature } from '@solana/web3.js';
import { clusterName, ClusterStatus } from '@utils/cluster';
import { useClusterPath } from '@utils/url';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect } from 'react';
import useSWR from 'swr';

import { getReceiptAmount, getReceiptMint } from '@/app/entities/token-receipt';
import { getProxiedUri } from '@/app/features/metadata';
import { receiptAnalytics } from '@/app/shared/lib/analytics';
import { Logger } from '@/app/shared/lib/logger';
import { AUTO_REFRESH_INTERVAL, AutoRefresh, type AutoRefreshProps } from '@/app/tx/[signature]/page-client';

import { generateReceiptCsv } from './lib/generate-receipt-csv';
import { generateReceiptPdf, loadPdfDeps } from './lib/generate-receipt-pdf';
import { formatUsdValue } from './lib/parse-usd';
import { usePrimaryDomain } from './lib/use-primary-domain';
import { extractReceiptData, type ReceiptUnavailabilityReason } from './model/create-receipt';
import { PriceStatus, useTokenPrice } from './model/use-price';
import type { FormattedReceipt } from './types';
import { NoReceipt } from './ui/BaseReceipt';
import { ReceiptView } from './ui/ReceiptView';

interface ReceiptProps {
    signature: TransactionSignature;
}

export function Receipt({ signature, autoRefresh }: ReceiptProps & AutoRefreshProps) {
    const fetchStatus = useFetchTransactionStatus();
    const fetchDetails = useFetchTransactionDetails();
    const status = useTransactionStatus(signature);
    const details = useTransactionDetails(signature);
    const { status: clusterStatus, cluster } = useCluster();
    const transactionPath = useClusterPath({ pathname: `/tx/${signature}` });

    const tx = details?.data?.transactionWithMeta;
    const { data: receiptResult, isLoading: isReceiptLoading } = useSWR(
        tx ? ['receipt', signature, cluster] : null,
        () => {
            if (!tx) return undefined;
            return extractReceiptData(tx, cluster);
        },
        { revalidateOnFocus: false },
    );
    const receipt = receiptResult?.kind === 'ok' ? receiptResult.receipt : undefined;

    useEffect(() => {
        if (!status && clusterStatus === ClusterStatus.Connected) {
            fetchStatus(signature);
        }
        if (!details && clusterStatus === ClusterStatus.Connected && status?.status === FetchStatus.Fetched) {
            fetchDetails(signature);
        }
    }, [signature, clusterStatus, status, fetchDetails, details]); // eslint-disable-line react-hooks/exhaustive-deps -- fetchStatus is intentionally omitted to prevent re-fetch loops

    useEffect(() => {
        if (autoRefresh === AutoRefresh.Active) {
            const intervalHandle: NodeJS.Timeout = setInterval(() => fetchStatus(signature), AUTO_REFRESH_INTERVAL);

            return () => {
                clearInterval(intervalHandle);
            };
        }
    }, [autoRefresh, fetchStatus, signature]);

    const isStatusLoading = !status || (status.status === FetchStatus.Fetching && autoRefresh === AutoRefresh.Inactive);
    const isStatusFailed = status?.status === FetchStatus.FetchFailed;
    const hasNoTxInfo = !status?.data?.info;
    const isDetailsLoading =
        details?.status === FetchStatus.Fetching || (details === undefined && status?.status === FetchStatus.Fetched);

    const showNoReceipt =
        !isStatusLoading && !isStatusFailed && (hasNoTxInfo || (!isDetailsLoading && !isReceiptLoading && !receipt));

    useEffect(() => {
        if (showNoReceipt) {
            receiptAnalytics.trackNoReceipt(signature);
        }
    }, [showNoReceipt, signature]);

    const router = useRouter();

    const handleRedirect = useCallback(() => {
        receiptAnalytics.trackNoReceiptAutoRedirect(signature);
        router.push(transactionPath);
    }, [router, transactionPath, signature]);

    const handleViewTxClick = useCallback(() => {
        receiptAnalytics.trackViewTxClicked(signature);
    }, [signature]);

    if (isStatusLoading) return <LoadingCard message="Loading transaction details" />;
    if (isStatusFailed) return <ErrorCard retry={() => fetchStatus(signature)} text="Fetch Failed" />;
    if (hasNoTxInfo)
        return (
            <NoReceipt
                transactionPath={transactionPath}
                timestamp={tx?.blockTime}
                onViewTxClick={handleViewTxClick}
                onRedirect={handleRedirect}
            />
        );
    if (isDetailsLoading || isReceiptLoading) return <LoadingCard message="Loading receipt" />;
    if (!receipt) {
        const reason = receiptResult?.kind === 'unavailable' ? receiptResult.reason : undefined;
        return (
            <NoReceipt
                transactionPath={transactionPath}
                timestamp={tx?.blockTime}
                onViewTxClick={handleViewTxClick}
                onRedirect={handleRedirect}
                message={messageForReason(reason)}
            />
        );
    }

    return <ReceiptContent receipt={receipt} signature={signature} status={status} transactionPath={transactionPath} />;
}

function messageForReason(reason: ReceiptUnavailabilityReason | undefined): string | undefined {
    switch (reason) {
        case 'inner-instructions':
            return 'Receipts are only available for simple transfers. This transaction contains inner program instructions.';
        case 'mixed-mint':
            return 'Receipts are only available when all token transfers in a transaction use the same mint. This transaction transfers multiple different tokens.';
        case 'no-transfers':
        case undefined:
            return undefined;
    }
}

interface ReceiptContentProps {
    receipt: FormattedReceipt;
    signature: TransactionSignature;
    status: NonNullable<ReturnType<typeof useTransactionStatus>>;
    transactionPath: string;
}

function ReceiptContent({ receipt, signature, status, transactionPath }: ReceiptContentProps) {
    const receiptType = receipt.kind;

    useEffect(() => {
        receiptAnalytics.trackViewed(signature, receiptType);
    }, [signature, receiptType]);

    const { cluster, customUrl } = useCluster();
    const makeAddressHref = useCallback(
        (address: string) => buildExplorerLink(cluster, customUrl, `/address/${address}`),
        [cluster, customUrl],
    );

    const senderDomain = usePrimaryDomain(receipt.sender.address);
    const receiverDomain = usePrimaryDomain(receipt.receiver.address);
    const senderLink = useExplorerLink(`/address/${receipt.sender.address}`);
    const receiverLink = useExplorerLink(`/address/${receipt.receiver.address}`);
    const receiptMint = getReceiptMint(receipt);
    const tokenLink = useExplorerLink(receiptMint ? `/address/${receiptMint}` : '');
    const logoURI = receipt.logoURI ? getProxiedUri(receipt.logoURI) : undefined;

    const priceResult = useTokenPrice(receiptMint ?? NATIVE_MINT.toBase58());
    const isPriceLoading = priceResult?.status === PriceStatus.Loading;
    const amount = getReceiptAmount(receipt);
    const usdValue = priceResult?.price != null ? formatUsdValue(amount, priceResult.price) : undefined;

    const downloadCsv = useCallback(async () => {
        await generateReceiptCsv(receipt, signature, usdValue);
    }, [receipt, signature, usdValue]);

    const downloadPdf = useCallback(async () => {
        const deps = await loadPdfDeps(error => Logger.error(error, { sentry: true }));
        const transactionUrl = window.location.origin + transactionPath;
        await generateReceiptPdf(deps, receipt, {
            clusterLabel: clusterName(cluster),
            receiptUrl: window.location.href,
            signature,
            transactionUrl,
            usdValue,
        });
    }, [receipt, signature, transactionPath, usdValue, cluster]);

    return (
        <SignatureContext.Provider value={signature}>
            <ReceiptView
                data={{
                    ...receipt,
                    confirmationStatus: status.data?.info?.confirmationStatus,
                    logoURI,
                    receiver: { ...receipt.receiver, domain: receiverDomain },
                    receiverHref: receiverLink.link,
                    sender: { ...receipt.sender, domain: senderDomain },
                    senderHref: senderLink.link,
                    tokenHref: tokenLink.link,
                    transfers: receipt.transfers?.map(t => ({
                        amount: t.amount,
                        receiver: t.receiver,
                        receiverHref: makeAddressHref(t.receiver.address),
                        sender: t.sender,
                        senderHref: makeAddressHref(t.sender.address),
                    })),
                }}
                downloadCsv={downloadCsv}
                downloadPdf={downloadPdf}
                isPriceLoading={isPriceLoading}
                signature={signature}
                transactionPath={transactionPath}
            />
        </SignatureContext.Provider>
    );
}
