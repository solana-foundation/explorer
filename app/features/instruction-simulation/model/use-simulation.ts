'use client';

import { generateTokenBalanceRows, TokenBalancesCardInnerProps } from '@components/transaction/TokenBalancesCard';
import { useCluster } from '@providers/cluster';
import { AccountLayout } from '@solana/spl-token';
import {
    AccountInfo,
    AddressLookupTableAccount,
    Connection,
    MessageAddressTableLookup,
    ParsedAccountData,
    ParsedMessageAccount,
    PublicKey,
    SimulatedTransactionAccountInfo,
    TokenBalance,
    VersionedMessage,
    VersionedTransaction,
} from '@solana/web3.js';
import { InstructionLogs, parseProgramLogs } from '@utils/program-logs';
import { BN } from 'bn.js';
import React from 'react';

import { getMintDecimals, isTokenProgramBase58 } from '../lib/tokenAccountParsing';
import type { SolBalanceChange } from '../lib/types';
import { useEpochInfo } from './use-epoch-info';

export function useSimulation(
    message: VersionedMessage,
    accountBalances?: {
        preBalances: number[];
        postBalances: number[];
    }
) {
    const { cluster, url } = useCluster();
    const { epoch: cachedEpoch } = useEpochInfo();
    const [simulating, setSimulating] = React.useState(false);
    const [logs, setLogs] = React.useState<Array<InstructionLogs> | null>(null);
    const [error, setError] = React.useState<string>();
    const [tokenBalanceRows, setTokenBalanceRows] = React.useState<TokenBalancesCardInnerProps>();
    const [solBalanceChanges, setSolBalanceChanges] = React.useState<SolBalanceChange[]>();
    const [unitsConsumed, setUnitsConsumed] = React.useState<number | undefined>();

    React.useEffect(() => {
        setLogs(null);
        setSimulating(false);
        setError(undefined);
        setSolBalanceChanges(undefined);
        setUnitsConsumed(undefined);
    }, [url]);

    const onClick = React.useCallback(() => {
        if (simulating) return;
        setError(undefined);
        setSolBalanceChanges(undefined);
        setSimulating(true);

        const connection = new Connection(url, 'confirmed');
        (async () => {
            try {
                const addressTableLookups: MessageAddressTableLookup[] = message.addressTableLookups;
                const addressTableLookupKeys: PublicKey[] = addressTableLookups.map(
                    (addressTableLookup: MessageAddressTableLookup) => {
                        return addressTableLookup.accountKey;
                    }
                );
                const addressTableLookupsFetched: (AccountInfo<Buffer> | null)[] =
                    await connection.getMultipleAccountsInfo(addressTableLookupKeys);
                const nonNullAddressTableLookups: AccountInfo<Buffer>[] = addressTableLookupsFetched.filter(
                    (o): o is AccountInfo<Buffer> => !!o
                );

                const addressLookupTablesParsed: AddressLookupTableAccount[] = nonNullAddressTableLookups.map(
                    (addressTableLookup: AccountInfo<Buffer>, index) => {
                        return new AddressLookupTableAccount({
                            key: addressTableLookupKeys[index],
                            state: AddressLookupTableAccount.deserialize(addressTableLookup.data),
                        });
                    }
                );

                // Fetch all the accounts before simulating
                const accountKeys = message.getAccountKeys({
                    addressLookupTableAccounts: addressLookupTablesParsed,
                }).staticAccountKeys;
                const parsedAccountsPre = await connection.getMultipleParsedAccounts(accountKeys);

                // Simulate without signers to skip signer verification. Request
                // all account data after the simulation.
                const resp = await connection.simulateTransaction(new VersionedTransaction(message), {
                    accounts: {
                        addresses: accountKeys.map(function (key) {
                            return key.toBase58();
                        }),
                        encoding: 'base64',
                    },
                    replaceRecentBlockhash: true,
                });

                if (!resp.value.accounts) {
                    throw new Error('RPC did not return account data after simulation');
                }

                const accountsPost = resp.value.accounts;

                const mintToDecimals: { [mintPk: string]: number } = getMintDecimals(
                    accountKeys,
                    parsedAccountsPre.value,
                    accountsPost as SimulatedTransactionAccountInfo[]
                );

                const preTokenBalances: TokenBalance[] = [];
                const postTokenBalances: TokenBalance[] = [];
                const tokenAccountKeys: ParsedMessageAccount[] = [];

                for (let index = 0; index < accountKeys.length; index++) {
                    const key = accountKeys[index];
                    const parsedAccountPre = parsedAccountsPre.value[index];
                    const accountDataPost = resp.value.accounts?.at(index)?.data[0];
                    const accountOwnerPost = resp.value.accounts?.at(index)?.owner;

                    if (
                        parsedAccountPre &&
                        isTokenProgramBase58(parsedAccountPre.owner.toBase58()) &&
                        (parsedAccountPre.data as ParsedAccountData).parsed.type === 'account'
                    ) {
                        const mint = (parsedAccountPre?.data as ParsedAccountData).parsed.info.mint;
                        const owner = (parsedAccountPre?.data as ParsedAccountData).parsed.info.owner;
                        const tokenAmount = (parsedAccountPre?.data as ParsedAccountData).parsed.info.tokenAmount;
                        const preTokenBalance = {
                            accountIndex: tokenAccountKeys.length,
                            mint: mint,
                            owner: owner,
                            uiTokenAmount: tokenAmount,
                        };
                        preTokenBalances.push(preTokenBalance);
                    }

                    if (
                        accountOwnerPost &&
                        isTokenProgramBase58(accountOwnerPost) &&
                        Buffer.from(accountDataPost!, 'base64').length >= 165
                    ) {
                        const accountParsedPost = AccountLayout.decode(Buffer.from(accountDataPost!, 'base64'));
                        const mint = new PublicKey(accountParsedPost.mint);
                        const owner = new PublicKey(accountParsedPost.owner);
                        const postRawAmount = Number(accountParsedPost.amount.readBigUInt64LE(0));

                        const decimals = mintToDecimals[mint.toBase58()];
                        const tokenAmount = postRawAmount / 10 ** decimals;

                        const postTokenBalance = {
                            accountIndex: tokenAccountKeys.length,
                            mint: mint.toBase58(),
                            owner: owner.toBase58(),
                            uiTokenAmount: {
                                amount: postRawAmount.toString(),
                                decimals: decimals,
                                uiAmount: tokenAmount,
                                uiAmountString: tokenAmount.toString(),
                            },
                        };
                        postTokenBalances.push(postTokenBalance);
                    }
                    // All fields are ignored other than key, so set placeholders.
                    const parsedMessageAccount = {
                        pubkey: key,
                        signer: false,
                        writable: true,
                    };
                    tokenAccountKeys.push(parsedMessageAccount);
                }

                const tokenBalanceRows = generateTokenBalanceRows(
                    preTokenBalances,
                    postTokenBalances,
                    tokenAccountKeys
                );
                if (tokenBalanceRows) {
                    setTokenBalanceRows({ rows: tokenBalanceRows });
                }

                const solChanges: SolBalanceChange[] = [];
                for (let index = 0; index < accountKeys.length; index++) {
                    const key = accountKeys[index];

                    // Use real balances if available, otherwise use simulation data
                    let pre: number;
                    let post: number;

                    if (accountBalances) {
                        pre = accountBalances.preBalances[index] ?? 0;
                        post = accountBalances.postBalances[index] ?? 0;
                    } else {
                        const parsedAccountPre = parsedAccountsPre.value[index];
                        const accountPostData = accountsPost?.at(index);
                        pre = parsedAccountPre?.lamports ?? 0;
                        post = accountPostData?.lamports ?? 0;
                    }

                    const delta = new BN(post).sub(new BN(pre));

                    if (!delta.isZero()) {
                        solChanges.push({
                            delta,
                            postBalance: new BN(post),
                            preBalance: new BN(pre),
                            pubkey: key,
                        });
                    }
                }

                if (solChanges.length > 0) {
                    setSolBalanceChanges(solChanges);
                }

                if (resp.value.logs === null) {
                    throw new Error('Expected to receive logs from simulation');
                }

                if (resp.value.logs.length === 0 && typeof resp.value.err === 'string') {
                    setLogs(null);
                    setError(resp.value.err);
                } else {
                    // Prettify logs
                    setLogs(parseProgramLogs(resp.value.logs, resp.value.err, cluster));
                }
                // Set units consumed from simulation response
                if (resp.value.unitsConsumed !== undefined) {
                    setUnitsConsumed(resp.value.unitsConsumed);
                }
                // If the response has an error, the logs will say what it it, so no need to parse here.
                if (resp.value.err) {
                    setError('TransactionError');
                }
            } catch (err) {
                console.error(err);
                setLogs(null);
                if (err instanceof Error) {
                    setError(err.message);
                }
            } finally {
                setSimulating(false);
            }
        })();
    }, [cluster, url, message, simulating, accountBalances]);
    return {
        simulate: onClick,
        simulating,
        simulationEpoch: cachedEpoch !== undefined ? BigInt(cachedEpoch) : undefined,
        simulationError: error,
        simulationLogs: logs,
        simulationSolBalanceChanges: solBalanceChanges,
        simulationTokenBalanceRows: tokenBalanceRows,
        simulationUnitsConsumed: unitsConsumed,
    };
}
