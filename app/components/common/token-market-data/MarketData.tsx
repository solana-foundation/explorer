import { displayTimestampWithoutDate } from '@utils/date';
import { cva } from 'class-variance-authority';

type MarketDataProps = {
    dynamic?: number;
    dynamicTrend?: 'up' | 'down';
    label: string;
    lastUpdatedAt?: Date;
    rank?: number;
    value: number;
};

function isNullish(value: any): value is null | undefined {
    return value === null || value === undefined;
}

const dynamicVariant = cva('e-text-[10px] e-ml-[3px]', {
    defaultVariants: {
        trend: 'up',
    },
    variants: {
        trend: {
            down: 'e-text-[#F958FC]',
            up: 'e-text-green-500',
        },
    },
});

export function MarketData({ label, lastUpdatedAt, value, rank, dynamic, dynamicTrend }: MarketDataProps) {
    return (
        <div className="e-w-[160px] e-rounded e-border e-border-solid e-border-black e-bg-[#1C2120] e-px-3 e-py-2 e-text-sm">
            <div className="e-mb-1 e-flex e-items-center e-gap-1">
                <span title={label} className="e-overflow-hidden e-text-ellipsis e-whitespace-nowrap">
                    {label}
                </span>
                {rank && (
                    <span className="e-whitespace-nowrap e-rounded e-bg-[#1ED190] e-px-[5px] e-text-xs e-text-[#1C2120]">
                        Rank #{rank}
                    </span>
                )}
            </div>
            <div
                title={lastUpdatedAt ? displayTimestampWithoutDate(lastUpdatedAt.getTime()) : undefined}
                className="e-flex e-overflow-hidden e-text-base e-font-medium"
            >
                <span title={`${value}`} className="e-cursor-help">
                    {value}
                </span>
                {!isNullish(dynamic) && dynamicTrend && (
                    <span className={dynamicVariant({ trend: dynamicTrend })}>
                        {dynamicTrend === 'up' ? '&uarr;' : '&darr;'}
                        {dynamic.toFixed(2)}
                    </span>
                )}
            </div>
        </div>
    );
}

MarketData.Series = function MarketDataSeries({ data }: { data: MarketDataProps[] }) {
    return (
        <div className="e-flex e-flex-col e-gap-1 xxxs:e-flex-row xs:e-gap-2">
            {data.map((props, index) => (
                <MarketData key={`market-data-${index}`} {...props} />
            ))}
        </div>
    );
};
