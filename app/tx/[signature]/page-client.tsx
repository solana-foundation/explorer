'use client';

import '@features/transaction/ui/transaction-page.css';

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
import bs58 from 'bs58';
import { useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useRef, useState } from 'react';

import { AccountsCard } from '@/app/features/transaction/ui/AccountsCard';
import { InstructionsSection } from '@/app/features/transaction/ui/InstructionsSection';
import { ProgramLogSection } from '@/app/features/transaction/ui/ProgramLogSection';
import { SummaryCard } from '@/app/features/transaction/ui/SummaryCard';
import { generateTokenBalanceRows, TokenBalancesCard } from '@/app/features/transaction/ui/TokenBalancesCard';
import { AutoRefresh, useAutoRefreshState } from '@/app/shared/lib/use-auto-refresh';
import { useBreakpoint } from '@/app/shared/lib/use-breakpoint';
import { BaseNavigationTabs } from '@/app/shared/ui/navigation-tabs/ui/BaseNavigationTabs';
import useTabVisibility from '@/app/utils/use-tab-visibility';

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
    const autoRefresh = useAutoRefreshState({
        bailedOut: zeroConfirmationRetries >= ZERO_CONFIRMATION_BAILOUT,
        enabled: Boolean(status?.data?.info && status.data.info.confirmations !== 'max'),
        isTabVisible,
    });

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
        <div className="transaction-page mx-auto flex max-w-5xl flex-col space-y-9 px-4 pt-3 lg:space-y-12 lg:px-6 lg:pt-5">
            <header className="-mb-6 flex flex-col gap-1.5 pb-3 pt-2 lg:mb-0">
                <span className="text-xs font-normal uppercase text-muted">Details</span>
                <h1 className="m-0 text-2xl font-normal leading-none text-white md:text-3xl">Transaction</h1>
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

    const logsPanelRef = useRef<HTMLDivElement>(null);
    const isManualScrollRef = useRef(false);
    const manualScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sync the sticky logs panel with the active instruction as the page scrolls.
    // Manual wheel scroll on the panel takes over for 2s before auto-sync resumes.
    useEffect(() => {
        if (!isXxl) return;
        const logsPanel = logsPanelRef.current;
        if (!logsPanel) return;

        const handleWheel = (e: WheelEvent) => {
            const { scrollTop, scrollHeight, clientHeight } = logsPanel;
            const atTop = scrollTop === 0 && e.deltaY < 0;
            const atBottom = scrollTop + clientHeight >= scrollHeight && e.deltaY > 0;
            if (atTop || atBottom) return;
            e.preventDefault();
            logsPanel.scrollTop += e.deltaY;
            isManualScrollRef.current = true;
            if (manualScrollTimeoutRef.current) clearTimeout(manualScrollTimeoutRef.current);
            manualScrollTimeoutRef.current = setTimeout(() => {
                isManualScrollRef.current = false;
            }, 2000);
        };

        const handlePageScroll = () => {
            if (isManualScrollRef.current) return;
            // Top-level ix-N cards only (excludes nested ix-N-M).
            const cards = Array.from(document.querySelectorAll<HTMLElement>('[id^="ix-"]')).filter(el => {
                const suffix = el.id.slice(3);
                return suffix.length > 0 && !suffix.includes('-') && !Number.isNaN(Number(suffix));
            });
            if (cards.length === 0) return;

            // Active = last card whose top has crossed the sticky nav threshold.
            const threshold = 80;
            let activeIndex = 0;
            for (let i = 0; i < cards.length; i++) {
                if (cards[i].getBoundingClientRect().top <= threshold) activeIndex = i;
                else break;
            }

            const cardRect = cards[activeIndex].getBoundingClientRect();
            const progress = Math.max(0, Math.min(1, (threshold - cardRect.top) / cardRect.height));

            const logRow = logsPanel.querySelector<HTMLElement>(`[data-ix-index="${activeIndex}"]`);
            if (!logRow) return;

            // Use getBoundingClientRect for position independent of current scrollTop.
            const titleHeight = (logsPanel.querySelector('section > div') as HTMLElement | null)?.offsetHeight ?? 0;
            const panelRect = logsPanel.getBoundingClientRect();
            const rowRect = logRow.getBoundingClientRect();
            const rowAbsoluteTop = rowRect.top - panelRect.top + logsPanel.scrollTop;
            logsPanel.scrollTop = Math.max(0, rowAbsoluteTop - titleHeight + rowRect.height * progress);
        };

        logsPanel.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('scroll', handlePageScroll, { passive: true });
        return () => {
            logsPanel.removeEventListener('wheel', handleWheel);
            window.removeEventListener('scroll', handlePageScroll);
            if (manualScrollTimeoutRef.current) clearTimeout(manualScrollTimeoutRef.current);
        };
    }, [isXxl, transactionWithMeta]);

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
                wrapperClassName="bg-heavy-metal-900"
                className="gap-5"
            />
            <Suspense fallback={<LoadingCard message="Loading accounts" />}>
                <AccountsCard signature={signature} />
            </Suspense>
            <TokenBalancesCard signature={signature} />
            <div className="flex flex-col space-y-9 pb-10 xxl:relative xxl:left-1/2 xxl:w-screen xxl:-translate-x-1/2 xxl:flex-row xxl:items-start xxl:gap-6 xxl:space-y-0 xxl:px-6">
                <div className="xxl:min-w-0 xxl:flex-[1_1_0%] xxl:overflow-hidden">
                    <InstructionsSection signature={signature} />
                </div>
                <div
                    ref={logsPanelRef}
                    className="scrollbar-hide xxl:sticky xxl:top-[70px] xxl:max-h-[calc(100vh-90px)] xxl:min-w-0 xxl:flex-[1_1_0%] xxl:overflow-y-auto xxl:rounded-b-lg"
                    id="logs"
                >
                    <ProgramLogSection signature={signature} />
                    <CUProfilingSection signature={signature} />
                </div>
            </div>
        </>
    );
}
