import { BigNumber } from 'bignumber.js';
import BN from 'bn.js';

type DeltaValue = BigNumber | BN;

export function toBigNumber(delta: DeltaValue): BigNumber {
    if (BN.isBN(delta)) {
        return new BigNumber(delta.toString());
    }
    return delta;
}
