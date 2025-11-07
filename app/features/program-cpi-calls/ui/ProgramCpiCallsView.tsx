import { CpiCallsCardFooter } from './CpiCallsCardFooter';
import { CpiCallsCardHeader } from './CpiCallsCardHeader';
import { ProgramCpiCallsRenderer } from './ProgramCpiCallsRenderer';

export function ProgramCpiCallsView({
    address,
    foundLatest,
    isRefreshing,
    total,
    onLoadNextPage,
    onRefresh,
}: {
    address: string;
    foundLatest: boolean;
    isRefreshing: boolean;
    total?: number;
    onLoadNextPage: () => void;
    onRefresh: () => void;
}) {
    return (
        <div className="card">
            <CpiCallsCardHeader refresh={onRefresh} title="Calling Programs" total={total} fetching={isRefreshing} />

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
                        <ProgramCpiCallsRenderer address={address} />
                    </tbody>
                </table>
            </div>
            <CpiCallsCardFooter foundOldest={foundLatest} loadMore={onLoadNextPage} fetching={isRefreshing} />
        </div>
    );
}
