import { Address } from '@components/common/Address';
import { BalanceDelta } from '@components/common/BalanceDelta';
import { useTransactionDetails } from '@providers/transactions';
import { ParsedMessageAccount, PublicKey, TokenBalance } from '@solana/web3.js';
import { SignatureProps } from '@utils/index';
import { BigNumber } from 'bignumber.js';
import { useState } from 'react';
import useAsyncEffect from 'use-async-effect';

import { useScaledUiAmountForMint } from '@/app/providers/accounts/tokens';
import { useCluster } from '@/app/providers/cluster';
import { getTokenInfos } from '@/app/utils/token-info';

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
                    <tbody className="list">
                        {rows.map(row => (
                            <TokenBalanceRow
                                key={row.account.toBase58() + row.mint}
                                {...row}
                                units={tokenSymbols.get(row.mint) || 'tokens'}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function TokenBalanceRow({
    account,
    delta,
    balance,
    mint,
    units,
}: {
    account: PublicKey;
    delta: BigNumber;
    balance: string;
    mint: string;
    units: string;
}) {
    const key = account.toBase58() + mint;
    const [_, scaledUiAmountMultiplier] = useScaledUiAmountForMint(mint, balance);

    return (
        <tr key={key}>
            <td>
                <Address pubkey={account} link />
            </td>
            <td>
                <Address pubkey={new PublicKey(mint)} link fetchTokenLabelInfo />
            </td>
            <td>
                <BalanceDelta delta={delta.multipliedBy(scaledUiAmountMultiplier)} />
            </td>
            <td>
                {new BigNumber(balance).multipliedBy(scaledUiAmountMultiplier).toString()} {units}
                <ScaledUiAmountMultiplierTooltip
                    rawAmount={balance}
                    scaledUiAmountMultiplier={scaledUiAmountMultiplier}
                />
            </td>
        </tr>
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
