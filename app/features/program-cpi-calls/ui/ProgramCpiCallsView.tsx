import { RefreshCw } from 'react-feather';

export function ProgramCpiCallsView({ address }: { address: string }) {
    const detailsList = '';
    const fetching = false; //history.status === FetchStatus.Fetching;
    const history = {
        data: {
            foundOldest: false,
        },
    };
    function loadMore() {}
    function refresh() {}
    return (
        <>
            <div className="card">
                <HistoryCardHeader fetching={fetching} refresh={() => refresh()} title="Transaction History" />
                <div className="table-responsive mb-0">
                    <table className="table table-sm table-nowrap card-table">
                        <thead>
                            <tr>
                                <th className="text-muted w-1">Transaction Signature</th>
                                <th className="text-muted w-1">Block</th>
                                <th className="text-muted">Result</th>
                            </tr>
                        </thead>
                        <tbody className="list">{detailsList}</tbody>
                    </table>
                </div>
                <HistoryCardFooter
                    fetching={fetching}
                    foundOldest={history.data.foundOldest}
                    loadMore={() => loadMore()}
                />
            </div>
        </>
    );
}

export function HistoryCardHeader({
    title,
    refresh,
    fetching,
}: {
    title: string;
    refresh: () => void;
    fetching: boolean;
}) {
    return (
        <div className="card-header align-items-center">
            <h3 className="card-header-title">{title}</h3>
            <button className="btn btn-white btn-sm" disabled={fetching} onClick={() => refresh()}>
                {fetching ? (
                    <>
                        <span className="align-text-top spinner-grow spinner-grow-sm me-2"></span>
                        Loading
                    </>
                ) : (
                    <>
                        <RefreshCw className="align-text-top me-2" size={13} />
                        Refresh
                    </>
                )}
            </button>
        </div>
    );
}

export function HistoryCardFooter({
    fetching,
    foundOldest,
    loadMore,
}: {
    fetching: boolean;
    foundOldest: boolean;
    loadMore: () => void;
}) {
    return (
        <div className="card-footer">
            {foundOldest ? (
                <div className="text-muted text-center">Fetched full history</div>
            ) : (
                <button className="btn btn-primary w-100" onClick={() => loadMore()} disabled={fetching}>
                    {fetching ? (
                        <>
                            <span className="align-text-top spinner-grow spinner-grow-sm me-2"></span>
                            Loading
                        </>
                    ) : (
                        'Load More'
                    )}
                </button>
            )}
        </div>
    );
}
