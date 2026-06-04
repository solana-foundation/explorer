import { SolBalance } from '@components/common/SolBalance';
import { toBigNumber } from '@entities/account';
import { BigNumber } from 'bignumber.js';
import BN from 'bn.js';
import React from 'react';

type DeltaValue = BigNumber | BN;

export function BalanceDelta({ delta, isSol = false }: { delta: DeltaValue; isSol?: boolean }) {
    const deltaValue = toBigNumber(delta);
    let sols;

    if (isSol) {
        const absValue = deltaValue.abs();
        sols = <SolBalance lamports={BigInt(absValue.toString())} />;
    }

    if (deltaValue.gt(0)) {
        return <span className="badge bg-success-soft">+{isSol ? sols : deltaValue.toString()}</span>;
    } else if (deltaValue.lt(0)) {
        return <span className="badge bg-warning-soft">{isSol ? <>-{sols}</> : deltaValue.toString()}</span>;
    }

    return <span className="badge bg-secondary-soft font-monospace">+0</span>;
}
