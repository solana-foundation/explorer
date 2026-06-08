import { Address } from '@components/common/Address';
import { ErrorCard } from '@components/common/ErrorCard';
import { Signature } from '@components/common/Signature';
import { SolBalance } from '@components/common/SolBalance';
import { estimateRequestedComputeUnits } from '@entities/compute-unit';
import { useCluster } from '@providers/cluster';
import { cn } from '@shared/utils';
import {
    ConfirmedTransactionMeta,
    PublicKey,
    TransactionSignature,
    VersionedBlockResponse,
    VOTE_PROGRAM_ID,
} from '@solana/web3.js';
import { parseProgramLogs } from '@utils/program-logs';
import { displayAddress } from '@utils/tx';
import { pickClusterParams } from '@utils/url';
import Link from 'next/link';
import { ReadonlyURLSearchParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { createRef, useMemo } from 'react';
import { ChevronDown } from 'react-feather';
import useAsyncEffect from 'use-async-effect';

import { Badge } from '@/app/components/shared/ui/badge';
import { Button } from '@/app/components/shared/ui/button';
import { Dropdown, DropdownItem, DropdownMenu } from '@/app/components/shared/ui/dropdown';
import { invariant } from '@/app/shared/lib/invariant';
import { Card, CardBody, CardFooter, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

const PAGE_SIZE = 25;

const useQueryProgramFilter = (query: ReadonlyURLSearchParams): string => {
    const filter = query.get('filter');
    return filter || '';
};

const useQueryAccountFilter = (query: ReadonlyURLSearchParams): PublicKey | null => {
    const filter = query.get('accountFilter');
    if (filter !== null) {
        try {
            return new PublicKey(filter);
        } catch {
            /* empty */
        }
    }
    return null;
};

type SortMode = 'index' | 'compute' | 'txnCost' | 'fee' | 'reservedCUs';
const useQuerySort = (query: ReadonlyURLSearchParams): SortMode => {
    const sort = query.get('sort');
    if (sort === 'compute') return 'compute';
    if (sort === 'txnCost') return 'txnCost';
    if (sort === 'fee') return 'fee';
    if (sort === 'reservedCUs') return 'reservedCUs';
    return 'index';
};

type TransactionWithInvocations = {
    index: number;
    signature?: TransactionSignature;
    meta: ConfirmedTransactionMeta | null;
    invocations: Map<string, number>;
    computeUnits?: number;
    costUnits?: number;
    reservedComputeUnits?: number;
    logTruncated: boolean;
};

export function BlockHistoryCard({ block, epoch }: { block: VersionedBlockResponse; epoch: bigint | undefined }) {
    const [numDisplayed, setNumDisplayed] = React.useState(PAGE_SIZE);
    const currentPathname = usePathname();
    const currentSearchParams = useSearchParams();
    const programFilter = useQueryProgramFilter(currentSearchParams);
    const accountFilter = useQueryAccountFilter(currentSearchParams);
    const sortMode = useQuerySort(currentSearchParams);
    const router = useRouter();
    const { cluster } = useCluster();

    const { transactions, invokedPrograms } = React.useMemo(() => {
        const invokedPrograms = new Map<string, number>();

        const transactions: TransactionWithInvocations[] = block.transactions.map((tx, index) => {
            let signature: TransactionSignature | undefined;
            if (tx.transaction.signatures.length > 0) {
                signature = tx.transaction.signatures[0];
            }

            const programIndexes = tx.transaction.message.compiledInstructions
                .map(ix => ix.programIdIndex)
                .concat(
                    tx.meta?.innerInstructions?.flatMap(ix => {
                        return ix.instructions.map(ix => ix.programIdIndex);
                    }) || [],
                );

            const indexMap = new Map<number, number>();
            programIndexes.forEach(programIndex => {
                const count = indexMap.get(programIndex) || 0;
                indexMap.set(programIndex, count + 1);
            });

            const invocations = new Map<string, number>();
            const accountKeys = tx.transaction.message.getAccountKeys({
                accountKeysFromLookups: tx.meta?.loadedAddresses,
            });
            indexMap.forEach((count, i) => {
                const accountKey = accountKeys.get(i);
                invariant(accountKey, `account key index ${i} out of range`);
                const programId = accountKey.toBase58();
                invocations.set(programId, count);
                const programTransactionCount = invokedPrograms.get(programId) || 0;
                invokedPrograms.set(programId, programTransactionCount + 1);
            });

            let logTruncated = false;
            let computeUnits: number | undefined = undefined;
            try {
                const parsedLogs = parseProgramLogs(tx.meta?.logMessages ?? [], tx.meta?.err ?? null, cluster);

                logTruncated = parsedLogs[parsedLogs.length - 1].truncated;
                computeUnits = parsedLogs.map(({ computeUnits }) => computeUnits).reduce((sum, next) => sum + next);
            } catch (_err) {
                // ignore parsing errors because some old logs aren't parsable
            }

            let costUnits: number | undefined = undefined;
            try {
                costUnits = tx.meta?.costUnits ?? 0;
            } catch (_err) {
                // ignore parsing errors because some old logs aren't parsable
            }

            // Calculate reserved compute units
            const reservedComputeUnits = estimateRequestedComputeUnits(tx, epoch, cluster);

            return {
                computeUnits,
                costUnits,
                index,
                invocations,
                logTruncated,
                meta: tx.meta,
                reservedComputeUnits,
                signature,
            };
        });
        return { invokedPrograms, transactions };
    }, [block, cluster, epoch]);

    const [filteredTransactions, showComputeUnits] = React.useMemo((): [TransactionWithInvocations[], boolean] => {
        const voteFilter = VOTE_PROGRAM_ID.toBase58();
        const filteredTxs: TransactionWithInvocations[] = transactions
            .filter(({ invocations }) => {
                if (programFilter === ALL_TRANSACTIONS) {
                    return true;
                } else if (programFilter === HIDE_VOTES) {
                    // hide vote txs that don't invoke any other programs
                    return !(invocations.has(voteFilter) && invocations.size === 1);
                }
                return invocations.has(programFilter);
            })
            .filter(({ index }) => {
                if (accountFilter === null) {
                    return true;
                }

                const tx = block.transactions[index];
                const accountKeys = tx.transaction.message.getAccountKeys({
                    accountKeysFromLookups: tx.meta?.loadedAddresses,
                });
                return accountKeys
                    .keySegments()
                    .flat()
                    .find(key => key.equals(accountFilter));
            });

        const showComputeUnits = filteredTxs.every(tx => tx.computeUnits !== undefined);

        if (sortMode === 'compute' && showComputeUnits) {
            filteredTxs.sort((a, b) => (b.computeUnits ?? 0) - (a.computeUnits ?? 0));
        } else if (sortMode === 'txnCost') {
            filteredTxs.sort((a, b) => (b.costUnits ?? 0) - (a.costUnits ?? 0));
        } else if (sortMode === 'fee') {
            filteredTxs.sort((a, b) => (b.meta?.fee || 0) - (a.meta?.fee || 0));
        } else if (sortMode === 'reservedCUs') {
            filteredTxs.sort((a, b) => (b.reservedComputeUnits || 0) - (a.reservedComputeUnits || 0));
        }

        return [filteredTxs, showComputeUnits];
    }, [block.transactions, transactions, programFilter, accountFilter, sortMode]);

    if (transactions.length === 0) {
        return <ErrorCard text="This block has no transactions" />;
    }

    let title: string;
    if (filteredTransactions.length === transactions.length) {
        title = `Block Transactions (${filteredTransactions.length})`;
    } else {
        title = `Filtered Block Transactions (${filteredTransactions.length}/${transactions.length})`;
    }

    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit">
                    {title}
                </CardTitle>
                <FilterDropdown
                    filter={programFilter}
                    invokedPrograms={invokedPrograms}
                    totalTransactionCount={transactions.length}
                ></FilterDropdown>
            </CardHeader>

            {accountFilter !== null && (
                <CardBody ui="dashkit">
                    Showing transactions which load account:
                    <div className="e-ml-1.5 e-inline-block">
                        <Address pubkey={accountFilter} link />
                    </div>
                </CardBody>
            )}

            {filteredTransactions.length === 0 ? (
                <CardBody ui="dashkit">
                    {accountFilter === null && programFilter === HIDE_VOTES
                        ? "This block doesn't contain any non-vote transactions"
                        : 'No transactions found with this filter'}
                </CardBody>
            ) : (
                // TODO: migrate to <BaseCardTable> from @/app/shared/ui/Table
                <BaseTable ui="dashkit" variant="card" nowrap>
                    <BaseTable.Head>
                        <BaseTable.Row>
                            <BaseTable.HeaderCell
                                className="text-muted e-cursor-pointer"
                                onClick={() => {
                                    const additionalParams = new URLSearchParams(currentSearchParams?.toString());
                                    additionalParams.delete('sort');
                                    router.push(
                                        pickClusterParams(currentPathname, currentSearchParams, additionalParams),
                                    );
                                }}
                            >
                                #
                            </BaseTable.HeaderCell>
                            <BaseTable.HeaderCell className="text-muted">Result</BaseTable.HeaderCell>
                            <BaseTable.HeaderCell className="text-muted">Transaction Signature</BaseTable.HeaderCell>
                            <BaseTable.HeaderCell
                                className="text-muted e-cursor-pointer"
                                onClick={() => {
                                    const additionalParams = new URLSearchParams(currentSearchParams?.toString());
                                    additionalParams.set('sort', 'fee');
                                    router.push(
                                        pickClusterParams(currentPathname, currentSearchParams, additionalParams),
                                    );
                                }}
                            >
                                Fee
                            </BaseTable.HeaderCell>
                            <BaseTable.HeaderCell
                                className="text-muted e-cursor-pointer"
                                onClick={() => {
                                    const additionalParams = new URLSearchParams(currentSearchParams?.toString());
                                    additionalParams.set('sort', 'reservedCUs');
                                    router.push(
                                        pickClusterParams(currentPathname, currentSearchParams, additionalParams),
                                    );
                                }}
                            >
                                Reserved CUs
                            </BaseTable.HeaderCell>
                            {showComputeUnits && (
                                <BaseTable.HeaderCell
                                    className="text-muted e-cursor-pointer"
                                    onClick={() => {
                                        const additionalParams = new URLSearchParams(currentSearchParams?.toString());
                                        additionalParams.set('sort', 'compute');
                                        router.push(
                                            pickClusterParams(currentPathname, currentSearchParams, additionalParams),
                                        );
                                    }}
                                >
                                    Compute
                                </BaseTable.HeaderCell>
                            )}
                            <BaseTable.HeaderCell
                                className="text-muted e-cursor-pointer"
                                onClick={() => {
                                    const additionalParams = new URLSearchParams(currentSearchParams?.toString());
                                    additionalParams.set('sort', 'txnCost');
                                    router.push(
                                        pickClusterParams(currentPathname, currentSearchParams, additionalParams),
                                    );
                                }}
                            >
                                Txn Cost
                            </BaseTable.HeaderCell>
                            <BaseTable.HeaderCell className="text-muted">Invoked Programs</BaseTable.HeaderCell>
                        </BaseTable.Row>
                    </BaseTable.Head>
                    <BaseTable.Body className="list">
                        {filteredTransactions.slice(0, numDisplayed).map((tx, i) => {
                            let statusText;
                            let statusClass;
                            let signature: React.ReactNode;
                            if (tx.meta?.err || !tx.signature) {
                                statusClass = 'warning';
                                statusText = 'Failed';
                            } else {
                                statusClass = 'success';
                                statusText = 'Success';
                            }

                            if (tx.signature) {
                                signature = <Signature signature={tx.signature} link />;
                            }

                            const entries = Array.from(tx.invocations.entries());
                            entries.sort();

                            return (
                                <BaseTable.Row key={i}>
                                    <BaseTable.Cell>{tx.index + 1}</BaseTable.Cell>
                                    <BaseTable.Cell>
                                        <Badge ui="dashkit" variant={statusClass as 'success' | 'warning'}>
                                            {statusText}
                                        </Badge>
                                    </BaseTable.Cell>

                                    <BaseTable.Cell>{signature}</BaseTable.Cell>

                                    <BaseTable.Cell>
                                        {tx.meta !== null ? <SolBalance lamports={tx.meta.fee} /> : 'Unknown'}
                                    </BaseTable.Cell>

                                    <BaseTable.Cell>
                                        {tx.reservedComputeUnits !== undefined
                                            ? new Intl.NumberFormat('en-US').format(tx.reservedComputeUnits)
                                            : 'Unknown'}
                                    </BaseTable.Cell>

                                    {showComputeUnits && (
                                        <BaseTable.Cell>
                                            {tx.logTruncated && '>'}
                                            {tx.computeUnits !== undefined
                                                ? new Intl.NumberFormat('en-US').format(tx.computeUnits)
                                                : 'Unknown'}
                                        </BaseTable.Cell>
                                    )}
                                    <BaseTable.Cell>
                                        {tx.costUnits !== undefined
                                            ? new Intl.NumberFormat('en-US').format(tx.costUnits)
                                            : 'Unknown'}
                                    </BaseTable.Cell>
                                    <BaseTable.Cell>
                                        {tx.invocations.size === 0
                                            ? 'NA'
                                            : entries.map(([programId, count], i) => {
                                                  return (
                                                      <div key={i} className="e-flex e-items-center">
                                                          <Address pubkey={new PublicKey(programId)} link />
                                                          <span className="text-muted e-ml-1.5">{`(${count})`}</span>
                                                      </div>
                                                  );
                                              })}
                                    </BaseTable.Cell>
                                </BaseTable.Row>
                            );
                        })}
                    </BaseTable.Body>
                </BaseTable>
            )}

            {filteredTransactions.length > numDisplayed && (
                <CardFooter ui="dashkit">
                    <Button
                        ui="dashkit"
                        variant="primary"
                        className="e-w-full"
                        onClick={() => setNumDisplayed(displayed => displayed + PAGE_SIZE)}
                    >
                        Load More
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}

type FilterProps = {
    filter: string;
    invokedPrograms: Map<string, number>;
    totalTransactionCount: number;
};

const ALL_TRANSACTIONS = 'all';
const HIDE_VOTES = '';

type FilterOption = {
    name: string;
    programId: string;
    transactionCount: number;
};

const FilterDropdown = ({ filter, invokedPrograms, totalTransactionCount }: FilterProps) => {
    const { cluster } = useCluster();
    const defaultFilterOption: FilterOption = {
        name: 'All Except Votes',
        programId: HIDE_VOTES,
        transactionCount: totalTransactionCount - (invokedPrograms.get(VOTE_PROGRAM_ID.toBase58()) || 0),
    };

    const allTransactionsOption: FilterOption = {
        name: 'All Transactions',
        programId: ALL_TRANSACTIONS,
        transactionCount: totalTransactionCount,
    };

    let currentFilterOption = filter !== ALL_TRANSACTIONS ? defaultFilterOption : allTransactionsOption;

    const filterOptions: FilterOption[] = [defaultFilterOption, allTransactionsOption];

    invokedPrograms.forEach((transactionCount, programId) => {
        const name = displayAddress(programId, cluster);
        if (filter === programId) {
            currentFilterOption = {
                name: `${name} Transactions (${transactionCount})`,
                programId,
                transactionCount,
            };
        }
        filterOptions.push({ name, programId, transactionCount });
    });

    filterOptions.sort((a, b) => {
        if (a.transactionCount !== b.transactionCount) {
            return b.transactionCount - a.transactionCount;
        } else {
            return b.name > a.name ? -1 : 1;
        }
    });

    const dropdownRef = createRef<HTMLButtonElement>();
    useAsyncEffect(
        async isMounted => {
            if (!dropdownRef.current) {
                return;
            }
            const Dropdown = (await import('bootstrap/js/dist/dropdown')).default;
            if (!isMounted || !dropdownRef.current) {
                return;
            }
            return new Dropdown(dropdownRef.current);
        },
        dropdown => {
            if (dropdown) {
                dropdown.dispose();
            }
        },
        [dropdownRef],
    );

    return (
        <Dropdown className="e-mr-1.5">
            <Button ui="dashkit" variant="white" size="sm" data-bs-toggle="dropdown" type="button" ref={dropdownRef}>
                {currentFilterOption.name} <ChevronDown className="align-text-top" size={13} />
            </Button>
            <DropdownMenu align="end" className="e-max-h-80 e-overflow-y-auto">
                {filterOptions.map(({ name, programId, transactionCount }) => (
                    <FilterLink
                        currentFilter={filter}
                        key={programId}
                        name={name}
                        programId={programId}
                        transactionCount={transactionCount}
                    />
                ))}
            </DropdownMenu>
        </Dropdown>
    );
};

function FilterLink({
    currentFilter,
    name,
    programId,
    transactionCount,
}: {
    currentFilter: string;
    name: string;
    programId: string;
    transactionCount: number;
}) {
    const currentSearchParams = useSearchParams();
    const currentPathname = usePathname();
    const href = useMemo(() => {
        const params = new URLSearchParams(currentSearchParams?.toString());
        if (name === HIDE_VOTES) {
            params.delete('filter');
        } else {
            params.set('filter', programId);
        }
        const nextQueryString = params.toString();
        return `${currentPathname}${nextQueryString ? `?${nextQueryString}` : ''}`;
    }, [currentPathname, currentSearchParams, name, programId]);
    return (
        <DropdownItem asChild className={cn(programId === currentFilter && 'active')} key={programId}>
            <Link href={href}>{`${name} (${transactionCount})`}</Link>
        </DropdownItem>
    );
}
