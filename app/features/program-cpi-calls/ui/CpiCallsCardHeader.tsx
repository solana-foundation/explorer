import { RefreshCw } from 'react-feather';

export function CpiCallsCardHeader({
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
