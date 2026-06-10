'use client';

import '@features/transaction/ui/transaction-page.css';

import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { SignatureContext } from '@components/instruction/SignatureContext';
import { CUProfilingSection } from '@features/cu-profiling';
import { Receipt } from '@features/receipt';
import { isReceiptEnabled } from '@features/receipt';
import { AutoRefresh } from '@features/transaction';
import { FetchStatus } from '@providers/cache';
import { useCluster } from '@providers/cluster';
import { useTransactionDetails, useTransactionStatus } from '@providers/transactions';
import { useFetchTransactionDetails } from '@providers/transactions/parsed';
import { TransactionSignature } from '@solana/web3.js';
import { ClusterStatus } from '@utils/cluster';
import { SignatureProps } from '@utils/index';
import useTabVisibility from '@utils/use-tab-visibility';
import bs58 from 'bs58';
import { useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useState } from 'react';

import { AccountsCard } from '@/app/features/transaction/ui/AccountsCard';
import { InstructionsSection } from '@/app/features/transaction/ui/InstructionsSection';
import { ProgramLogSection } from '@/app/features/transaction/ui/ProgramLogSection';
import { SummaryCard } from '@/app/features/transaction/ui/SummaryCard';
import { generateTokenBalanceRows, TokenBalancesCard } from '@/app/features/transaction/ui/TokenBalancesCard';
import { useBreakpoint } from '@/app/shared/lib/use-breakpoint';
import { BaseNavigationTabs } from '@/app/shared/ui/navigation-tabs/ui/BaseNavigationTabs';

const ALL_TRANSACTION_TABS = [
    { path: 'summary', title: 'Summary' },
    { path: 'accounts', title: 'Accounts' },
    { path: 'tokens', title: 'Tokens' },
    { path: 'programs', title: 'Programs' },
    { path: 'logs', title: 'Logs' },
];

const ZERO_CONFIRMATION_BAILOUT = 5;

type Props = Readonly<{
    params: SignatureProps;
}>;

export function TransactionDetailsPageClient({ params: { signature: raw } }: Props) {
    let signature: TransactionSignature | undefined;
    const searchParams = useSearchParams();

    try {
        const decoded = bs58.decode(raw);
        if (decoded.length === 64) {
            signature = raw;
        }
    } catch (_err) {
        /* empty */
    }

    const status = useTransactionStatus(signature);
    const clusterStatus = useCluster().status;
    const [zeroConfirmationRetries, setZeroConfirmationRetries] = useState(0);
    const { visible: isTabVisible } = useTabVisibility();

    let autoRefresh = AutoRefresh.Inactive;
    if (!isTabVisible) {
        autoRefresh = AutoRefresh.Inactive;
    } else if (zeroConfirmationRetries >= ZERO_CONFIRMATION_BAILOUT) {
        autoRefresh = AutoRefresh.BailedOut;
    } else if (status?.data?.info && status.data.info.confirmations !== 'max') {
        autoRefresh = AutoRefresh.Active;
    }

    useEffect(() => {
        if (status?.status === FetchStatus.Fetched && status.data?.info && status.data.info.confirmations === 0) {
            setZeroConfirmationRetries(retries => retries + 1);
        }
    }, [status]);

    useEffect(() => {
        if (status?.status === FetchStatus.Fetching && autoRefresh === AutoRefresh.BailedOut) {
            setZeroConfirmationRetries(0);
        }
    }, [status, autoRefresh, setZeroConfirmationRetries]);

    if (isReceiptEnabled && searchParams.get('view') === 'receipt' && signature) {
        return <Receipt signature={signature} autoRefresh={autoRefresh} />;
    }

    return (
        <div className="transaction-page e-mx-auto e-flex e-max-w-5xl e-flex-col e-space-y-9 e-px-4 e-pt-3 lg:e-space-y-12 lg:e-px-6 lg:e-pt-5">
            <header className="-e-mb-6 e-flex e-flex-col e-gap-1.5 e-pb-3 e-pt-2 lg:e-mb-0">
                <span className="e-text-xs e-font-normal e-uppercase e-text-muted">Details</span>
                <h1 className="e-m-0 e-text-2xl e-font-normal e-leading-none e-text-white md:e-text-3xl">
                    Transaction
                </h1>
            </header>

            {signature === undefined ? (
                <ErrorCard text={`Signature "${raw}" is not valid`} />
            ) : clusterStatus === ClusterStatus.Failure ? (
                <ErrorCard text="RPC is not responding. Please change your RPC url and try again." />
            ) : (
                <SignatureContext.Provider value={signature}>
                    <SummaryCard signature={signature} autoRefresh={autoRefresh} />
                    <Suspense fallback={<LoadingCard message="Loading transaction details" />}>
                        <DetailsSection signature={signature} />
                    </Suspense>
                </SignatureContext.Provider>
            )}
        </div>
    );
}

function DetailsSection({ signature }: SignatureProps) {
    const details = useTransactionDetails(signature);
    const fetchDetails = useFetchTransactionDetails();
    const status = useTransactionStatus(signature);
    const transactionWithMeta = details?.data?.transactionWithMeta;
    const transaction = transactionWithMeta?.transaction;
    const message = transaction?.message;
    const { status: clusterStatus } = useCluster();
    const { isXxl } = useBreakpoint();
    const refreshDetails = () => fetchDetails(signature);

    useEffect(() => {
        if (!details && clusterStatus === ClusterStatus.Connected && status?.status === FetchStatus.Fetched) {
            fetchDetails(signature);
        }
    }, [signature, clusterStatus, status]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!status?.data?.info) {
        return null;
    } else if (!details || details.status === FetchStatus.Fetching) {
        return <LoadingCard />;
    } else if (details.status === FetchStatus.FetchFailed) {
        return <ErrorCard retry={refreshDetails} text="Failed to fetch details" />;
    } else if (!transactionWithMeta || !message) {
        return <ErrorCard text="Details are not available" />;
    }

    const meta = transactionWithMeta.meta;
    const accountKeys = transactionWithMeta.transaction.message.accountKeys;
    const hasTokens =
        meta?.preTokenBalances &&
        meta?.postTokenBalances &&
        accountKeys &&
        generateTokenBalanceRows(meta.preTokenBalances, meta.postTokenBalances, accountKeys).length > 0;

    const baseTabs = hasTokens ? ALL_TRANSACTION_TABS : ALL_TRANSACTION_TABS.filter(t => t.path !== 'tokens');
    const tabs = isXxl
        ? baseTabs
              .filter(t => t.path !== 'logs')
              .map(t => (t.path === 'programs' ? { path: 'programs', title: 'Programs & Logs' } : t))
        : baseTabs;

    return (
        <>
            <BaseNavigationTabs
                scrollSpy
                tabs={tabs}
                buildHref={path => `#${path}`}
                wrapperClassName="e-bg-heavy-metal-900"
                className="e-gap-5"
            />
            <Suspense fallback={<LoadingCard message="Loading accounts" />}>
                <AccountsCard signature={signature} />
            </Suspense>
            <TokenBalancesCard signature={signature} />
            <div className="e-flex e-flex-col e-space-y-9 e-pb-10 xxl:e-relative xxl:e-left-1/2 xxl:e-w-screen xxl:-e-translate-x-1/2 xxl:e-flex-row xxl:e-items-start xxl:e-gap-6 xxl:e-space-y-0 xxl:e-px-6">
                <div className="xxl:e-min-w-0 xxl:e-flex-[1_1_0%] xxl:e-overflow-hidden">
                    <InstructionsSection signature={signature} />
                </div>
                <div
                    className="xxl:e-sticky xxl:e-top-[70px] xxl:e-min-w-0 xxl:e-flex-[1_1_0%] xxl:e-overflow-hidden"
                    id="logs"
                >
                    <ProgramLogSection signature={signature} />
                    <CUProfilingSection signature={signature} />
                </div>
            </div>
        </>
    );
}
