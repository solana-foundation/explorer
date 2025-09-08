import { PublicKey } from '@solana/web3.js';

import { LoadingCard } from '@/app/components/common/LoadingCard';

import { CpiCallListItem } from './CpiCallListItem';
import { CpiCallsCardFooter } from './CpiCallsCardFooter';
import { CpiCallsCardHeader } from './CpiCallsCardHeader';

export type CpiCallRecord = {
    address: PublicKey;
    calls: number;
    description: string;
    name: string;
};

export function ProgramCpiCallsView({
    isLoading,
    records,
    total,
}: {
    isLoading: boolean;
    total?: number;
    records?: CpiCallRecord[];
}) {
    const fetching = false; //history.status === FetchStatus.Fetching;
    const history = {
        data: {
            foundOldest: false,
        },
    };
    function loadMore() {
        //
    }
    function refresh() {
        //
    }
    return (
        <>
            {isLoading || records === undefined ? (
                <LoadingCard />
            ) : (
                <div className="card">
                    <CpiCallsCardHeader
                        fetching={fetching}
                        refresh={() => refresh()}
                        title={`Calling Programs${total ? ` (${total})` : ''}`}
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
                                {records.map(record => (
                                    <CpiCallListItem
                                        key={record.address.toBase58()}
                                        record={{
                                            address: record.address,
                                            calls: record.calls,
                                            description: record.description,
                                            name: record.name,
                                        }}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <CpiCallsCardFooter
                        fetching={fetching}
                        foundOldest={history.data.foundOldest}
                        loadMore={() => loadMore()}
                    />
                </div>
            )}
        </>
    );
}
