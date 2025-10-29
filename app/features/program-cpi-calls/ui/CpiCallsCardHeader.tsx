import { RefreshCw } from 'react-feather';

export function CpiCallsCardHeader({
    title,
    total,
    refresh,
    fetching = false,
}: {
    title: string;
    total?: number;
    refresh: () => void;
    fetching?: boolean;
}) {
    return (
        <div className="card-header align-items-center">
            <div className="flex flex-row">
                <h3 className="card-header-title">
                    {title}
                    <span className="text-muted small"> (last 30 days{total ? `; total: ${total} records` : ''})</span>
                </h3>
            </div>
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
