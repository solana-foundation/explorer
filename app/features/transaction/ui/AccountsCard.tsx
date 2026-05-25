import { Address } from '@components/common/Address';
import { BalanceDelta } from '@components/common/BalanceDelta';
import { ErrorCard } from '@components/common/ErrorCard';
import { SolBalance } from '@components/common/SolBalance';
import { useAccountsInfo } from '@entities/account';
import { useCluster } from '@providers/cluster';
import { useTransactionDetails } from '@providers/transactions';
import { useBreakpoint } from '@/app/shared/lib/use-breakpoint';
import { RawDataField } from '@shared/RawDataField';
import { Button } from '@shared/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui/popover';
import { SignatureProps } from '@utils/index';
import { BigNumber } from 'bignumber.js';
import React, { useMemo } from 'react';
import { Code } from 'react-feather';
import { cn } from '@components/shared/utils';

import { CollapsibleSection } from './CollapsibleSection';

export function AccountsCard({ signature }: SignatureProps) {
    const details = useTransactionDetails(signature);
    const { url } = useCluster();
    const { isSm } = useBreakpoint();

    const transactionWithMeta = details?.data?.transactionWithMeta;
    const message = transactionWithMeta?.transaction.message;
    const meta = transactionWithMeta?.meta;

    const pubkeys = useMemo(() => message?.accountKeys.map(a => a.pubkey) ?? [], [message?.accountKeys]);

    const { accounts, error, loading } = useAccountsInfo(pubkeys, url);

    const totalAccountSize = useMemo(
        () => Array.from(accounts.values()).reduce((acc, account) => acc + account.size, 0),
        [accounts],
    );

    if (!transactionWithMeta) {
        return null;
    }

    if (!meta || !message) {
        return <ErrorCard text="Transaction metadata is missing" />;
    }

    if (error) {
        return <ErrorCard text="Failed to fetch accounts info" />;
    }

    const accountRows = message.accountKeys.map((account, index) => {
        const pre = meta.preBalances[index];
        const post = meta.postBalances[index];
        const pubkey = account.pubkey;
        const key = pubkey.toBase58();
        const delta = new BigNumber(post).minus(new BigNumber(pre));
        const accountInfo = accounts.get(key);

        const badges = (
            <>
                {index === 0 && <span className="badge bg-success-soft me-1">Fee Payer</span>}
                {account.signer && <span className="badge bg-info-soft me-1">Signer</span>}
                {account.writable && <span className="badge bg-danger-soft me-1">Writable</span>}
                {message.instructions.find(ix => ix.programId.equals(pubkey)) && (
                    <span className="badge bg-warning-soft me-1">Program</span>
                )}
                {account.source === 'lookupTable' && (
                    <span className="badge bg-gray-soft me-1">Address Table Lookup</span>
                )}
            </>
        );

        const dataCell = loading ? (
            <span className="e-text-xs e-text-muted">Loading…</span>
        ) : accountInfo && accountInfo.size > 0 ? (
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" className="e-h-auto !e-p-1 e-text-xs">
                        <Code size={11} />
                        <span>{accountInfo.size.toLocaleString('en-US')}</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="e-w-auto !e-rounded-lg e-border-none e-p-0" align="end">
                    <RawDataField data={accountInfo.data} filename={key} />
                </PopoverContent>
            </Popover>
        ) : null;

        return (
            <div
                key={key}
                className={cn(
                    'e-min-h-9 e-px-3 e-py-1.5 md:e-px-4',
                    'e-grid e-items-start e-gap-x-5 e-gap-y-0.5 e-whitespace-nowrap e-text-sm md:e-gap-y-0',
                    'e-grid-cols-[1fr_auto] lg:e-grid-cols-[1fr_minmax(auto,200px)_minmax(auto,200px)]',
                    "[grid-template-areas:'address_delta'_'address_balance'] lg:[grid-template-areas:'address_delta_balance']",
                    'e-border-1 e-border-b e-border-white/10 [border-bottom-style:solid] last:e-border-b-0',
                )}
            >
                <div className="[grid-area:address]">
                    <div className="e-flex e-items-center e-gap-1">
                        <Address
                            pubkey={pubkey}
                            truncateChars={isSm ? undefined : 6}
                            link
                            fetchTokenLabelInfo
                            truncate
                        />
                        {dataCell}
                    </div>
                    <span className="e-mt-1 e-inline-flex e-flex-wrap e-gap-1">{badges}</span>
                </div>
                <div className="e-justify-self-end [grid-area:delta]">
                    <BalanceDelta delta={delta} isSol />
                </div>
                <div className="e-justify-self-end [grid-area:balance]">
                    <SolBalance lamports={post} />
                </div>
            </div>
        );
    });

    return (
        <CollapsibleSection id="accounts" title="Accounts &amp; SOL balance">
            <div
                className={cn(
                    'e-hidden e-px-3 e-py-1.5 md:e-px-4 lg:e-grid',
                    'e-grid-cols-[1fr_minmax(auto,200px)_minmax(auto,200px)] e-gap-5 e-text-xs e-uppercase e-text-muted',
                    'e-border-1 e-border-b e-border-white/10 [border-bottom-style:solid]',
                )}
            >
                <div>Address</div>
                <div className="e-text-right">Change (SOL)</div>
                <div className="e-text-right">Post Balance (SOL)</div>
            </div>
            {accountRows}
            {!loading && totalAccountSize > 0 && (
                <div className="e-flex e-items-baseline e-gap-2 e-px-3 e-py-2 e-text-sm e-text-muted md:e-px-4">
                    <div className="e-flex e-flex-col">
                        <span className="e-tex-sm e-uppercase e-leading-none">Total Account Size:</span>
                        <span className="e-text-[10px] e-leading-none">reflects current state</span>
                    </div>
                    <span className="e-text-white">{totalAccountSize.toLocaleString('en-US')} bytes</span>
                </div>
            )}
        </CollapsibleSection>
    );
}
