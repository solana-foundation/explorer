'use client';

import ScaledUiAmountMultiplierTooltip from '@components/account/token-extensions/ScaledUiAmountMultiplierTooltip';
import { Address } from '@components/common/Address';
import { BalanceDelta, toBigNumber } from '@components/common/BalanceDelta';
import { cn } from '@components/shared/utils';
import { useTransactionDetails } from '@providers/transactions';
import { ParsedMessageAccount, PublicKey, TokenBalance } from '@solana/web3.js';
import { SignatureProps } from '@utils/index';
import { BigNumber } from 'bignumber.js';
import { useState } from 'react';
import useAsyncEffect from 'use-async-effect';

import { useScaledUiAmountForMint } from '@/app/providers/accounts/tokens';
import { useCluster } from '@/app/providers/cluster';
import { useBreakpoint } from '@/app/shared/lib/use-breakpoint';
import { getTokenInfos } from '@/app/utils/token-info';

import { CollapsibleSection } from './CollapsibleSection';

type TokenBalanceRow = {
    account: PublicKey;
    owner?: string;
    mint: string;
    balance: string;
    delta: BigNumber;
    accountIndex: number;
};

export function TokenBalancesCard({ signature }: SignatureProps) {
    const details = useTransactionDetails(signature);

    if (!details) {
        return null;
    }

    const transactionWithMeta = details.data?.transactionWithMeta;
    const preTokenBalances = transactionWithMeta?.meta?.preTokenBalances;
    const postTokenBalances = transactionWithMeta?.meta?.postTokenBalances;
    const accountKeys = transactionWithMeta?.transaction.message.accountKeys;

    if (!preTokenBalances || !postTokenBalances || !accountKeys) {
        return null;
    }

    const rows = generateTokenBalanceRows(preTokenBalances, postTokenBalances, accountKeys);

    if (rows.length < 1) {
        return null;
    }

    return <TokenBalancesCardInner rows={rows} />;
}

export type TokenBalancesCardInnerProps = {
    rows: TokenBalanceRow[];
};

export function TokenBalancesCardInner({ rows }: TokenBalancesCardInnerProps) {
    const { cluster, url } = useCluster();
    const [tokenSymbols, setTokenSymbols] = useState<Map<string, string>>(new Map());

    useAsyncEffect(async isMounted => {
        const mints = rows.map(r => new PublicKey(r.mint));
        getTokenInfos(mints, cluster, url).then(tokens => {
            if (isMounted()) {
                setTokenSymbols(new Map(tokens?.map(t => [t.address, t.symbol])));
            }
        });
    }, []);

    return (
        <CollapsibleSection id="tokens" title="Tokens">
            <div
                className={cn(
                    'e-hidden e-px-3 e-py-1.5 md:e-px-4 lg:e-grid',
                    'e-grid-cols-[minmax(auto,1.25rem)_1fr_minmax(auto,170px)_minmax(auto,140px)] e-gap-5 e-text-xs e-uppercase e-text-muted',
                    'e-border-1 e-border-b e-border-white/10 [border-bottom-style:solid]',
                )}
            >
                <div>#</div>
                <div>Owner / Address / Token</div>
                <div>Change</div>
                <div className="e-text-right">Post Balance</div>
                {/* <div className="e-text-right">Token</div> */}
            </div>
            {rows.map((row, index) => (
                <TokenBalanceRow
                    index={index}
                    key={row.account.toBase58() + row.mint}
                    account={row.account}
                    owner={row.owner}
                    delta={row.delta}
                    balance={row.balance}
                    mint={row.mint}
                    units={tokenSymbols.get(row.mint) || 'tokens'}
                />
            ))}
        </CollapsibleSection>
    );
}

function TokenBalanceRow({
    account,
    owner,
    delta,
    balance,
    mint,
    units,
    index,
}: {
    account: PublicKey;
    owner?: string;
    delta: BigNumber;
    balance: string;
    mint: string;
    units: string;
    index: number;
}) {
    const { isLg } = useBreakpoint();
    const key = account.toBase58() + mint;
    const [_, scaledUiAmountMultiplier] = useScaledUiAmountForMint(mint, balance);
    const isDeltaExists = toBigNumber(delta).gt(0) || toBigNumber(delta).lt(0);

    return (
        <div
            key={key}
            className={cn(
                'e-min-h-9 e-px-3 e-py-1.5 md:e-px-4',
                'e-grid e-items-start e-gap-y-0.5 e-whitespace-nowrap e-text-sm md:e-gap-y-0 lg:e-gap-x-5',
                'e-grid-cols-[minmax(auto,1.75rem)_1fr] lg:e-grid-cols-[minmax(auto,1.25rem)_1fr_minmax(auto,170px)_minmax(auto,140px)]',
                "[grid-template-areas:'number_address'_'number_balance'_'number_change'] lg:[grid-template-areas:'number_address_change_balance']",
                'e-border-1 e-border-b e-border-white/10 [border-bottom-style:solid] last:e-border-b-0',
            )}
        >
            <div className="e-text-muted [grid-area:number]">{index + 1}</div>
            <div className="e-flex e-flex-col [grid-area:address]">
                {owner && (
                    <div className="e-flex e-items-center e-gap-2 md:e-gap-3">
                        <span className="e-min-w-11 e-text-sm e-text-muted">Owner</span>
                        <Address pubkey={new PublicKey(owner)} link />
                    </div>
                )}
                <div className="e-flex e-items-center e-gap-2 md:e-gap-3">
                    <span className="e-min-w-11 e-text-sm e-text-muted">Addr</span>
                    <Address pubkey={account} link />
                </div>
                <div className="e-flex e-items-center e-gap-2 md:e-gap-3">
                    <span className="e-min-w-11 e-text-sm e-text-muted">Token</span>
                    <Address pubkey={new PublicKey(mint)} link fetchTokenLabelInfo />
                </div>
            </div>
            <div className="e-justify-self-end [grid-area:change] lg:e-justify-self-start">
                {(isDeltaExists || isLg) && <BalanceDelta delta={delta.multipliedBy(scaledUiAmountMultiplier)} />}
            </div>
            <div className="e-justify-self-end [grid-area:balance]">
                {new BigNumber(balance).multipliedBy(scaledUiAmountMultiplier).toString()} {units}
                <ScaledUiAmountMultiplierTooltip
                    rawAmount={balance}
                    scaledUiAmountMultiplier={scaledUiAmountMultiplier}
                />
            </div>
        </div>
    );
}

export function generateTokenBalanceRows(
    preTokenBalances: TokenBalance[],
    postTokenBalances: TokenBalance[],
    accounts: ParsedMessageAccount[],
): TokenBalanceRow[] {
    const preBalanceMap: { [index: number]: TokenBalance } = {};
    const postBalanceMap: { [index: number]: TokenBalance } = {};

    preTokenBalances.forEach(balance => (preBalanceMap[balance.accountIndex] = balance));
    postTokenBalances.forEach(balance => (postBalanceMap[balance.accountIndex] = balance));

    // Check if any pre token balances do not have corresponding
    // post token balances. If not, insert a post balance of zero
    // so that the delta is displayed properly
    for (const index in preBalanceMap) {
        const preBalance = preBalanceMap[index];
        if (!postBalanceMap[index]) {
            postBalanceMap[index] = {
                accountIndex: Number(index),
                mint: preBalance.mint,
                uiTokenAmount: {
                    amount: '0',
                    decimals: preBalance.uiTokenAmount.decimals,
                    uiAmount: null,
                    uiAmountString: '0',
                },
            };
        }
    }

    const rows: TokenBalanceRow[] = [];

    for (const index in postBalanceMap) {
        const { uiTokenAmount, accountIndex, mint, owner } = postBalanceMap[index];
        const preBalance = preBalanceMap[accountIndex];
        const account = accounts[accountIndex].pubkey;

        if (!uiTokenAmount.uiAmountString) {
            // uiAmount deprecation
            continue;
        }

        const postBalanceUiAmountString = uiTokenAmount.uiAmountString;
        const preBalanceUiAmountString = preBalance?.uiTokenAmount.uiAmountString;

        // case where mint changes
        if (preBalance && preBalance.mint !== mint) {
            if (!preBalanceUiAmountString) {
                // uiAmount deprecation
                continue;
            }

            rows.push({
                account: accounts[accountIndex].pubkey,
                accountIndex,
                balance: '0',
                delta: new BigNumber(-preBalanceUiAmountString),
                mint: preBalance.mint,
                owner,
            });

            rows.push({
                account: accounts[accountIndex].pubkey,
                accountIndex,
                balance: postBalanceUiAmountString,
                delta: new BigNumber(postBalanceUiAmountString),
                mint: mint,
                owner,
            });
            continue;
        }

        let delta;

        if (preBalance) {
            if (!preBalanceUiAmountString) {
                // uiAmount deprecation
                continue;
            }

            delta = new BigNumber(postBalanceUiAmountString).minus(new BigNumber(preBalanceUiAmountString || 0));
        } else {
            delta = new BigNumber(postBalanceUiAmountString);
        }

        rows.push({
            account,
            accountIndex,
            balance: postBalanceUiAmountString,
            delta,
            mint,
            owner,
        });
    }

    return rows.sort((a, b) => a.accountIndex - b.accountIndex);
}
