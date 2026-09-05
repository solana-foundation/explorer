import { SolBalance } from '@components/common/SolBalance';
import { cva } from 'class-variance-authority';
import React from 'react';

import type { ProjectedFee } from '../lib/resource-and-inclusion-fee';

type Props = {
    /** What the transaction actually paid, as the baseline each projection is compared against. */
    currentFeeLamports: number;
    projections: readonly ProjectedFee[];
};

/**
 * What a transaction would pay at each of SIMD-0553's staged resource-fee rates, alongside how that
 * compares to the fee it paid under today's flat per-signature base fee.
 */
export function BaseResourceFeeProjection({ currentFeeLamports, projections }: Props) {
    return (
        <div className="flex flex-col gap-1.5">
            {projections.map(({ rate, totalFeeLamports }) => {
                const ratio = getChangeRatio({ currentFeeLamports, totalFeeLamports });
                return (
                    <div key={rate.label} className="flex flex-wrap items-baseline gap-x-2">
                        <SolBalance lamports={totalFeeLamports} />
                        <span className="text-xs text-outer-space-300">at the {rate.label} rate</span>
                        {ratio !== undefined && (
                            <span className={changeStyles({ direction: getDirection(ratio) })}>
                                {PERCENT_CHANGE_FORMAT.format(ratio)}
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

const changeStyles = cva('font-mono text-xs', {
    variants: {
        direction: {
            cheaper: 'text-dk-success-on-dark',
            costlier: 'text-dk-warning-on-dark',
            unchanged: 'text-outer-space-300',
        },
    },
});

// Formats the ratio itself, so a sub-1% change reads as "+0.4%" rather than rounding away to "0%".
const PERCENT_CHANGE_FORMAT = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero',
    style: 'percent',
});

/** Undefined when there is no baseline to compare against, which drops the comparison entirely. */
function getChangeRatio({
    currentFeeLamports,
    totalFeeLamports,
}: {
    currentFeeLamports: number;
    totalFeeLamports: number;
}): number | undefined {
    if (currentFeeLamports <= 0) {
        return undefined;
    }
    return (totalFeeLamports - currentFeeLamports) / currentFeeLamports;
}

function getDirection(ratio: number): 'cheaper' | 'costlier' | 'unchanged' {
    if (ratio < 0) return 'cheaper';
    if (ratio > 0) return 'costlier';
    return 'unchanged';
}
