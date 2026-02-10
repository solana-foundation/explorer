'use client';

import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { SignatureContext } from '@components/instruction/SignatureContext';
import { Button } from '@components/shared/ui/button';
import { useExplorerLink } from '@entities/cluster';
import { FetchStatus } from '@providers/cache';
import { useCluster } from '@providers/cluster';
import { useFetchTransactionStatus, useTransactionDetails, useTransactionStatus } from '@providers/transactions';
import { useFetchTransactionDetails } from '@providers/transactions/parsed';
import { TransactionSignature } from '@solana/web3.js';
import { ClusterStatus } from '@utils/cluster';
import { useClusterPath } from '@utils/url';
import Link from 'next/link';
import React, { useCallback, useEffect } from 'react';
import useSWR from 'swr';

import { getProxiedUri } from '@/app/features/metadata';
import { receiptAnalytics } from '@/app/shared/lib/analytics';
import { AUTO_REFRESH_INTERVAL, AutoRefresh, type AutoRefreshProps } from '@/app/tx/[signature]/page-client';

import { usePrimaryDomain } from '../lib/use-primary-domain';
import { extractReceiptData } from '../model/create-receipt';
import type { FormattedReceipt } from '../types';
import { BaseReceipt, NoReceipt } from './BaseReceipt';

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
    const { data: receipt, isLoading: isReceiptLoading } = useSWR(tx ? ['receipt', signature, cluster] : null, () =>
        extractReceiptData(tx!, cluster)
    );

    useEffect(() => {
        if (!status && clusterStatus === ClusterStatus.Connected) {
            fetchStatus(signature);
        }
        if (!details && clusterStatus === ClusterStatus.Connected && status?.status === FetchStatus.Fetched) {
            fetchDetails(signature);
        }
    }, [signature, clusterStatus, status, fetchDetails, details]); // eslint-disable-line react-hooks/exhaustive-deps

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

    const handleViewTxClick = useCallback(() => {
        receiptAnalytics.trackViewTxClicked(signature);
    }, [signature]);

    if (isStatusLoading) return <LoadingCard message="Loading transaction details" />;
    if (isStatusFailed) return <ErrorCard retry={() => fetchStatus(signature)} text="Fetch Failed" />;
    if (hasNoTxInfo)
        return (
            <NoReceipt transactionPath={transactionPath} timestamp={tx?.blockTime} onViewTxClick={handleViewTxClick} />
        );
    if (isDetailsLoading || isReceiptLoading) return <LoadingCard message="Loading receipt" />;
    if (!receipt)
        return (
            <NoReceipt transactionPath={transactionPath} timestamp={tx?.blockTime} onViewTxClick={handleViewTxClick} />
        );

    return <ReceiptContent receipt={receipt} signature={signature} status={status} transactionPath={transactionPath} />;
}

interface ReceiptContentProps {
    receipt: FormattedReceipt;
    signature: TransactionSignature;
    status: NonNullable<ReturnType<typeof useTransactionStatus>>;
    transactionPath: string;
}

function ReceiptContent({ receipt, signature, status, transactionPath }: ReceiptContentProps) {
    const receiptType = 'mint' in receipt ? 'token' : 'sol';

    useEffect(() => {
        receiptAnalytics.trackViewed(signature, receiptType);
    }, [signature, receiptType]);

    const senderDomain = usePrimaryDomain(receipt.sender.address);
    const receiverDomain = usePrimaryDomain(receipt.receiver.address);
    const senderLink = useExplorerLink(`/address/${receipt.sender.address}`);
    const receiverLink = useExplorerLink(`/address/${receipt.receiver.address}`);
    const tokenLink = useExplorerLink('mint' in receipt ? `/address/${receipt.mint}` : '');
    const logoURI = receipt.logoURI ? getProxiedUri(receipt.logoURI) : undefined;

    return (
        <SignatureContext.Provider value={signature}>
            <div className="container e-flex e-min-h-[90vh] e-flex-col e-items-center e-justify-center e-gap-6 e-px-5 e-py-10">
                <BluredCircle />
                <BaseReceipt
                    data={{
                        ...receipt,
                        confirmationStatus: status.data?.info?.confirmationStatus,
                        logoURI,
                        receiver: { ...receipt.receiver, domain: receiverDomain },
                        receiverHref: receiverLink.link,
                        sender: { ...receipt.sender, domain: senderDomain },
                        senderHref: senderLink.link,
                        tokenHref: tokenLink.link,
                    }}
                />
                <Button size="sm" className="e-me-2" asChild>
                    <Link
                        href={transactionPath}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => receiptAnalytics.trackViewTxClicked(signature)}
                    >
                        View transaction in Explorer
                    </Link>
                </Button>
            </div>
        </SignatureContext.Provider>
    );
}

export function BluredCircle() {
    return (
        <div className="e-absolute e-left-[50%] e-top-[55%] e-z-[-1] e-h-2/5 e-w-1/3 e-translate-x-[-50%] e-translate-y-[-50%] e-rounded-full e-bg-emerald-700 e-blur-[150px]" />
    );
}
