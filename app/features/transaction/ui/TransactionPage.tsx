'use client';

import './transaction-page.css';

import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { SignatureContext } from '@components/instruction/SignatureContext';
import { CUProfilingSection } from '@features/cu-profiling';
import { Receipt } from '@features/receipt';
import { isReceiptEnabled } from '@features/receipt';
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

import { BaseNavigationTabs } from '@/app/shared/ui/navigation-tabs/ui/BaseNavigationTabs';

import { AccountsCard } from './AccountsCard';
import { InstructionsSection } from './InstructionsSection';
import { ProgramLogSection } from './ProgramLogSection';
import { SummaryCard } from './SummaryCard';
import { TokenBalancesCard } from './TokenBalancesCard';

const TRANSACTION_TABS = [
    { path: 'summary', title: 'Summary' },
    { path: 'accounts', title: 'Accounts' },
    { path: 'tokens', title: 'Tokens' },
    { path: 'programs', title: 'Programs' },
    { path: 'logs', title: 'Logs' },
];

export const AUTO_REFRESH_INTERVAL = 2000;
const ZERO_CONFIRMATION_BAILOUT = 5;

export enum AutoRefresh {
    Active,
    Inactive,
    BailedOut,
}

export type AutoRefreshProps = {
    autoRefresh: AutoRefresh;
};

type Props = Readonly<{
    params: SignatureProps;
}>;

export default function TransactionDetailsPageClient({ params: { signature: raw } }: Props) {
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
        <div className="transaction-page e-mx-auto e-flex e-max-w-5xl e-flex-col e-gap-9 e-px-4 e-pt-3 lg:e-gap-12 lg:e-px-6 lg:e-pt-5">
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

    return (
        <>
            <BaseNavigationTabs
                scrollSpy
                tabs={TRANSACTION_TABS}
                buildHref={path => `#${path}`}
                wrapperClassName="e-bg-heavy-metal-900"
                className="e-gap-5"
            />
            <Suspense fallback={<LoadingCard message="Loading accounts" />}>
                <AccountsCard signature={signature} />
            </Suspense>
            <TokenBalancesCard signature={signature} />
            <div className="e-flex e-flex-col e-gap-9 e-pb-10 xl:e-relative xl:e-left-1/2 xl:e-w-screen xl:-e-translate-x-1/2 xl:e-flex-row xl:e-items-start xl:e-gap-6 xl:e-px-6">
                <div className="xl:e-min-w-0 xl:e-flex-[1_1_0%] xl:e-overflow-hidden">
                    <InstructionsSection signature={signature} />
                </div>
                <div className="e-sticky e-top-[70px] xl:e-min-w-0 xl:e-flex-[1_1_0%] xl:e-overflow-hidden" id="logs">
                    <ProgramLogSection signature={signature} />
                    <CUProfilingSection signature={signature} />
                </div>
            </div>
        </>
    );
}
