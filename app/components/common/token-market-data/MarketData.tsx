import { displayTimestampWithoutDate } from '@utils/date';
import { cva } from 'class-variance-authority';
import { HelpCircle } from 'react-feather';

import { abbreviatedNumber } from '@/app/utils';

const dynamicVariant = cva('e-text-[10px] e-ml-[3px] e-flex e-items-center e-gap-[0.1rem] e-relative e-top-[-1px]', {
    defaultVariants: {
        trend: 'neutral',
    },
    variants: {
        trend: {
            down: 'e-text-[#F958FC]',
            neutral: 'e-text-gray-400',
            up: 'e-text-green-500',
        },
    },
});

type MarketDataProps = {
    label: string;
    lastUpdatedAt?: Date;
    rank?: number;
    value: { price: number; trend: number; precision: number } | { volume: number };
};

export function MarketData({ label, lastUpdatedAt, value, rank }: MarketDataProps) {
    const trend = 'trend' in value ? getDynamicTrend(value.trend) : undefined;
    return (
        <div
            aria-label="market-data"
            className="e-w-[160px] e-rounded e-border e-border-solid e-border-black e-bg-[#1C2120] e-px-3 e-py-2 e-text-sm"
        >
            <div className="e-mb-1 e-flex e-items-center e-gap-2">
                <span
                    title={lastUpdatedAt ? `Updated at ${displayTimestampWithoutDate(lastUpdatedAt.getTime())}` : label}
                    className="e-overflow-hidden e-text-ellipsis e-whitespace-nowrap"
                >
                    {label}
                </span>
                {(rank ?? 0) > 0 && (
                    <span className="e-whitespace-nowrap e-rounded e-bg-[#1ED190] e-px-[5px] e-text-xs e-text-[#1C2120]">
                        Rank #{rank}
                    </span>
                )}
                {lastUpdatedAt && (
                    <span
                        title={`Updated at ${displayTimestampWithoutDate(lastUpdatedAt.getTime())}`}
                        className="e-inline-flex"
                    >
                        <HelpCircle size={12} className="e-text-gray-400" />
                    </span>
                )}
            </div>
            <div
                title={lastUpdatedAt ? `Updated at ${displayTimestampWithoutDate(lastUpdatedAt.getTime())}` : undefined}
                className="e-flex e-items-baseline e-overflow-hidden e-text-base e-font-medium"
            >
                {'volume' in value ? (
                    <span
                        title={`${Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' }).format(
                            value.volume
                        )}`}
                        className="e-cursor-help"
                    >
                        ${abbreviatedNumber(value.volume)}
                    </span>
                ) : (
                    <>
                        <span title={`$${value.price}`} className="e-cursor-help">
                            ${value.price.toFixed(value.precision)}
                        </span>
                        <span className={dynamicVariant({ trend })}>
                            {trend === 'up' ? (
                                <>
                                    <span className="e-text-[8px]">&uarr;</span> {value.trend.toFixed(2)}%
                                </>
                            ) : trend === 'down' ? (
                                <>
                                    <span className="e-text-[8px]">&darr;</span> {value.trend.toFixed(2)}%
                                </>
                            ) : (
                                '0%'
                            )}
                        </span>
                    </>
                )}
            </div>
        </div>
    );
}

function getDynamicTrend(dynamic: number) {
    if (dynamic > 0) return 'up';
    else if (dynamic < 0) return 'down';
    else return 'neutral';
}

MarketData.Series = function MarketDataSeries({ data }: { data: MarketDataProps[] }) {
    return (
        <div className="e-flex e-flex-col e-gap-1 xs:e-flex-row sm:e-gap-2">
            {data.map((props, index) => (
                <MarketData key={`market-data-${index}`} {...props} />
            ))}
        </div>
    );
};
