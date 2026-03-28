import { lamportsToSolString } from '@utils/index';
import React from 'react';

export function SolBalance({
    lamports,
    maximumFractionDigits = 9,
}: {
    lamports: number | bigint;
    maximumFractionDigits?: number;
}) {
    return <span className="font-monospace">◎{lamportsToSolString(lamports, maximumFractionDigits)}</span>;
}
