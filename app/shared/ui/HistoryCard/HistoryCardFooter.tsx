import { Button } from '@components/shared/ui/button';

import { CardFooter } from '@/app/shared/ui/Card';

export type HistoryCardFooterProps = {
    fetching: boolean;
    foundOldest: boolean;
    loadMore: () => void;
};

export function HistoryCardFooter({ fetching, foundOldest, loadMore }: HistoryCardFooterProps) {
    return (
        <CardFooter ui="dashkit">
            {foundOldest ? (
                <div className="text-center text-dk-gray-700">Fetched full history</div>
            ) : (
                <Button
                    ui="dashkit"
                    variant="primary"
                    className="w-full"
                    onClick={() => loadMore()}
                    disabled={fetching}
                >
                    {fetching ? (
                        <>
                            <span className="spinner-grow spinner-grow-sm mr-1.5 align-text-top"></span>
                            Loading
                        </>
                    ) : (
                        'Load More'
                    )}
                </Button>
            )}
        </CardFooter>
    );
}
