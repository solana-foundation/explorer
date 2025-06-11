import { Address } from '@components/common/Address';
import { BalanceDelta } from '@components/common/BalanceDelta';
import { useTransactionDetails } from '@providers/transactions';
import { ParsedMessageAccount, PublicKey, TokenBalance } from '@solana/web3.js';
import { SignatureProps } from '@utils/index';
import { BigNumber } from 'bignumber.js';
import React, { useEffect, useState } from 'react';
import { create } from 'superstruct';
import useAsyncEffect from 'use-async-effect';

import { useAccountInfos, useFetchAccountInfo } from '@/app/providers/accounts';
import { useCluster } from '@/app/providers/cluster';
import { getCurrentTokenScaledUiAmountMultiplier, getTokenInfos } from '@/app/utils/token-info';
import { MintAccountInfo } from '@/app/validators/accounts/token';

import ScaledUiAmountMultiplierTooltip from '../account/token-extensions/ScaledUiAmountMultiplierTooltip';

type TokenBalanceRow = {
    account: PublicKey;
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
    const fetchAccount = useFetchAccountInfo();
    const [tokenInfosLoading, setTokenInfosLoading] = useState(true);
    const [tokenSymbols, setTokenSymbols] = useState<Map<string, string>>(new Map());
    const [scaledUiAmountMultipliers, setScaledUiAmountMultipliers] = useState<Map<string, string>>(new Map());

    useAsyncEffect(async isMounted => {
        const mints = rows.map(r => new PublicKey(r.mint));
        await Promise.all([
            rows.map(async r => {
                fetchAccount(new PublicKey(r.mint), 'parsed');
            }),
            getTokenInfos(mints, cluster, url).then(tokens => {
                setTokenSymbols(new Map(tokens?.map(t => [t.address, t.symbol])));
            }),
        ]).finally(() => {
            if (isMounted()) {
                setTokenInfosLoading(false);
            }
        });
    }, []);

    const accountInfos = useAccountInfos(rows.map(r => r.mint));
    useEffect(() => {
        if (tokenInfosLoading) {
            return;
        }
        const scaledUiAmountMultipliers = rows.map(r => {
            const info = accountInfos.find(a => a && a.data?.pubkey.toBase58() === r.mint);
            const infoParsed = info?.data?.data.parsed;
            const mintInfo = infoParsed && create(infoParsed?.parsed.info, MintAccountInfo);
            return getCurrentTokenScaledUiAmountMultiplier(mintInfo?.extensions);
        });
        setScaledUiAmountMultipliers(new Map(rows.map((r, i) => [r.mint, scaledUiAmountMultipliers[i]])));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tokenInfosLoading]);

    const accountRows = rows.map(({ account, delta, balance, mint }) => {
        const key = account.toBase58() + mint;
        const units = tokenInfosLoading ? '' : tokenSymbols.get(mint) || 'tokens';

        return (
            <tr key={key}>
                <td>
                    <Address pubkey={account} link />
                </td>
                <td>
                    <Address pubkey={new PublicKey(mint)} link fetchTokenLabelInfo />
                </td>
                <td>
                    <BalanceDelta delta={delta.multipliedBy(scaledUiAmountMultipliers.get(mint) || 1)} />
                </td>
                <td>
                    {new BigNumber(balance).multipliedBy(scaledUiAmountMultipliers.get(mint) || 1).toString()} {units}
                    <ScaledUiAmountMultiplierTooltip
                        rawAmount={balance}
                        scaledUiAmountMultiplier={scaledUiAmountMultipliers.get(mint) || '1'}
                    />
                </td>
            </tr>
        );
    });

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-header-title">Token Balances</h3>
            </div>
            <div className="table-responsive mb-0">
                <table className="table table-sm table-nowrap card-table">
                    <thead>
                        <tr>
                            <th className="text-muted">Address</th>
                            <th className="text-muted">Token</th>
                            <th className="text-muted">Change</th>
                            <th className="text-muted">Post Balance</th>
                        </tr>
                    </thead>
                    <tbody className="list">{accountRows}</tbody>
                </table>
            </div>
        </div>
    );
}

export function generateTokenBalanceRows(
    preTokenBalances: TokenBalance[],
    postTokenBalances: TokenBalance[],
    accounts: ParsedMessageAccount[]
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
        const { uiTokenAmount, accountIndex, mint } = postBalanceMap[index];
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
            });

            rows.push({
                account: accounts[accountIndex].pubkey,
                accountIndex,
                balance: postBalanceUiAmountString,
                delta: new BigNumber(postBalanceUiAmountString),
                mint: mint,
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
        });
    }

    return rows.sort((a, b) => a.accountIndex - b.accountIndex);
}
