import { PublicKey } from '@solana/web3.js';

import { ErrorCard } from '@/app/components/common/ErrorCard';
import { LoadingCard } from '@/app/components/common/LoadingCard';

import { ProgramCallData } from '../model/use-program-cpi-calls';
import { CpiCallListItem } from './CpiCallListItem';
import { CpiCallsCardFooter } from './CpiCallsCardFooter';
import { CpiCallsCardHeader } from './CpiCallsCardHeader';

export type CpiCallRecord = {
    address: PublicKey;
    calls: number;
    description: string;
    name: string;
};

export function populateRecordsFromData(data: ProgramCallData[]) {
    return data.map<CpiCallRecord>(({ address, calls_number, description, name }) => ({
        address: new PublicKey(address),
        calls: calls_number,
        description,
        name,
    }));
}

export function ProgramCpiCallsView({
    error,
    foundLatest,
    isLoading,
    isPending,
    records: recs,
    total,
    onLoadNextPage,
    onRefresh,
}: {
    error: Error | null;
    foundLatest: boolean;
    isLoading: boolean;
    isPending: boolean;
    total?: number;
    records?: ProgramCallData[];
    onLoadNextPage: () => void;
    onRefresh: () => void;
}) {
    const records = recs ? populateRecordsFromData(recs) : undefined;

    const initialState = !records || (!records && isLoading);
    const loadingState = isPending;

    return (
        <>
            {initialState ? (
                <LoadingCard />
            ) : (
                <div className="card">
                    <CpiCallsCardHeader
                        fetching={loadingState}
                        refresh={onRefresh}
                        title="Calling Programs"
                        total={total}
                    />

                    <div className="table-responsive mb-0">
                        <table className="table table-sm table-nowrap card-table">
                            <thead>
                                <tr>
                                    <th className="text-muted w-1">Program Name</th>
                                    <th className="text-muted w-100 text-lg-end">Address</th>
                                    <th className="text-muted"># of Calls</th>
                                </tr>
                            </thead>
                            <tbody className="list">
                                {records.length ? (
                                    records.map(record => {
                                        return (
                                            <CpiCallListItem
                                                key={record.address.toBase58()}
                                                record={{
                                                    address: record.address,
                                                    calls: record.calls,
                                                    description: record.description,
                                                    name: record.name,
                                                }}
                                            />
                                        );
                                    })
                                ) : (
                                    <NoRecords isLoading={isLoading} error={error} />
                                )}
                                {!error ? null : (
                                    <tr>
                                        <td colSpan={3}>
                                            <ErrorCard text={error.message} />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {error ? null : (
                        <CpiCallsCardFooter
                            fetching={loadingState}
                            foundOldest={foundLatest}
                            loadMore={onLoadNextPage}
                        />
                    )}
                </div>
            )}
        </>
    );
}

function NoRecords({
    isLoading,
    error,
    records,
}: {
    isLoading: boolean;
    records?: ProgramCallData[];
    error?: Error | null;
}) {
    return error && !records ? null : (
        <tr>
            <td colSpan={3}>
                <div className="text-center">{isLoading ? '' : 'No records found'}</div>
            </td>
        </tr>
    );
}
