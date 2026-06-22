import { displayTimestampWithoutDate } from '@utils/date';
import { cva } from 'class-variance-authority';
import { HelpCircle } from 'react-feather';

import { abbreviatedNumber } from '@/app/utils';

const dynamicVariant = cva('text-[10px] ml-[3px] flex items-center gap-[0.1rem] relative top-[-1px]', {
    defaultVariants: {
        trend: 'neutral',
    },
    variants: {
        trend: {
            down: 'text-[#F958FC]',
            neutral: 'text-gray-400',
            up: 'text-green-500',
        },
    },
});

type MarketDataProps = {
    label: string;
    lastUpdatedAt?: Date;
    rank?: number;
    value: { price: number; trend?: number; precision: number } | { volume: number };
};

export function MarketData({ label, lastUpdatedAt, value, rank }: MarketDataProps) {
    const trend = 'trend' in value ? getDynamicTrend(value.trend) : undefined;
    return (
        <div
            aria-label="market-data"
            className="w-full rounded border border-solid border-black bg-[#1C2120] px-3 py-2 text-sm md:w-[160px]"
        >
            <div className="mb-1 flex items-center gap-2">
                <span
                    title={lastUpdatedAt ? `Updated at ${displayTimestampWithoutDate(lastUpdatedAt.getTime())}` : label}
                    className="overflow-hidden text-ellipsis whitespace-nowrap"
                >
                    {label}
                </span>
                {(rank ?? 0) > 0 && (
                    <span className="whitespace-nowrap rounded bg-[#1ED190] px-[5px] text-xs text-[#1C2120]">
                        Rank #{rank}
                    </span>
                )}
                {lastUpdatedAt && (
                    <span
                        title={`Updated at ${displayTimestampWithoutDate(lastUpdatedAt.getTime())}`}
                        className="inline-flex"
                    >
                        <HelpCircle size={12} className="text-gray-400" />
                    </span>
                )}
            </div>
            <div
                title={lastUpdatedAt ? `Updated at ${displayTimestampWithoutDate(lastUpdatedAt.getTime())}` : undefined}
                className="flex items-baseline overflow-hidden text-base font-medium"
            >
                {'volume' in value ? (
                    <span
                        title={`${Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' }).format(
                            value.volume,
                        )}`}
                        className="cursor-help"
                    >
                        ${abbreviatedNumber(value.volume)}
                    </span>
                ) : (
                    <>
                        <span title={`$${value.price}`} className="cursor-help">
                            ${value.price.toFixed(value.precision)}
                        </span>
                        <span className={dynamicVariant({ trend })}>
                            {trend === 'up' ? (
                                <>
                                    <span className="text-[8px]">&uarr;</span> {value.trend?.toFixed(2)}%
                                </>
                            ) : trend === 'down' ? (
                                <>
                                    <span className="text-[8px]">&darr;</span> {value.trend?.toFixed(2)}%
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

function getDynamicTrend(dynamic?: number) {
    if (dynamic === undefined) return 'neutral';
    if (dynamic > 0) return 'up';
    else if (dynamic < 0) return 'down';
    else return 'neutral';
}

MarketData.Series = function MarketDataSeries({ data }: { data: MarketDataProps[] }) {
    return (
        <div className="flex w-full flex-col gap-1 sm:gap-2 md:w-auto md:flex-row">
            {data.map((props, index) => (
                <MarketData key={`market-data-${index}`} {...props} />
            ))}
        </div>
    );
};
