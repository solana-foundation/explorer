'use client';

import ScaledUiAmountMultiplierTooltip from '@components/account/token-extensions/ScaledUiAmountMultiplierTooltip';
import { Address } from '@components/common/Address';
import { BalanceDelta } from '@components/common/BalanceDelta';
import { cn } from '@components/shared/utils';
import { getChainId } from '@entities/token-info';
import { useTransactionDetails } from '@providers/transactions';
import { ParsedMessageAccount, PublicKey, TokenBalance } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { SignatureProps } from '@utils/index';
import { BigNumber } from 'bignumber.js';
import useSWRImmutable from 'swr/immutable';

import { useScaledUiAmountForMint } from '@/app/providers/accounts/tokens';
import { useCluster } from '@/app/providers/cluster';
import { DataListCard, DataListRow } from '@/app/shared/ui/DataListCard';
import { ROW_PADDING } from '@/app/shared/ui/spacing';
import { getTokenInfos } from '@/app/utils/token-info';

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
    const { cluster, genesisHash } = useCluster();
    const mintKey = rows.map(r => r.mint).join(',');

    // getTokenInfos needs a chainId, which only a genesisHash can derive on the Custom cluster.
    const canResolveSymbols = Boolean(mintKey) && Boolean(getChainId(cluster, genesisHash));

    const { data: tokenSymbols } = useSWRImmutable(
        canResolveSymbols ? (['token-balance-symbols', mintKey, cluster, genesisHash] as const) : undefined,
        fetchTokenSymbols,
    );

    return (
        <DataListCard id="tokens" title="Tokens" className="mb-6">
            {rows.map((row, index) => (
                <TokenBalanceRow
                    index={index}
                    key={row.account.toBase58() + row.mint}
                    account={row.account}
                    owner={row.owner}
                    delta={row.delta}
                    balance={row.balance}
                    mint={row.mint}
                    units={tokenSymbols?.get(row.mint) || 'tokens'}
                />
            ))}
        </DataListCard>
    );
}

type TokenSymbolsSwrKey = readonly ['token-balance-symbols', string, Cluster, string | undefined];

async function fetchTokenSymbols([, mintKey, cluster, genesisHash]: TokenSymbolsSwrKey): Promise<Map<string, string>> {
    const mints = mintKey.split(',').map(mint => new PublicKey(mint));
    const tokens = await getTokenInfos(mints, cluster, genesisHash);
    // getTokenInfos reports a failed request as undefined. Reading that as "no symbols" would cache
    // the fallback under an immutable key and pin it there for the session.
    if (!tokens) throw new Error(`Could not resolve token symbols for ${mints.length} mints`);
    return new Map(tokens.map(t => [t.address, t.symbol]));
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
    const [_, scaledUiAmountMultiplier] = useScaledUiAmountForMint(mint, balance);
    const scaledBalance = new BigNumber(balance).multipliedBy(scaledUiAmountMultiplier).toString();
    const scaledDelta = delta.multipliedBy(scaledUiAmountMultiplier);
    const mintPubkey = new PublicKey(mint);
    const ownerPubkey = owner ? new PublicKey(owner) : undefined;

    return (
        <DataListRow>
            <div className={cn('flex min-h-9 items-start gap-3 text-sm', ROW_PADDING)}>
                <div className="shrink-0 text-outer-space-300">{index + 1}</div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    {ownerPubkey && (
                        <div className="flex items-center gap-3">
                            <span className="w-14 shrink-0 text-outer-space-300">Owner</span>
                            <Address pubkey={ownerPubkey} link />
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <span className="w-14 shrink-0 text-outer-space-300">Addr</span>
                        <Address pubkey={account} link />
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="w-14 shrink-0 text-outer-space-300">Token</span>
                        <Address pubkey={mintPubkey} link fetchTokenLabelInfo />
                    </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5 whitespace-nowrap text-right">
                    <BalanceDelta delta={scaledDelta} />
                    <span>
                        {scaledBalance} {units}
                        <ScaledUiAmountMultiplierTooltip
                            rawAmount={balance}
                            scaledUiAmountMultiplier={scaledUiAmountMultiplier}
                        />
                    </span>
                </div>
            </div>
        </DataListRow>
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
