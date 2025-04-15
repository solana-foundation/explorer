import { PublicKey } from '@solana/web3.js';

import { TokenExtension } from '../validators/accounts/token-extension';

export const transferFeeConfig0 = {
    extension: 'transferFeeConfig',
    state: {
        newerTransferFee: {
            epoch: 200,
            maximumFee: 2000000,
            transferFeeBasisPoints: 200,
        },
        olderTransferFee: {
            epoch: 100,
            maximumFee: 1000000,
            transferFeeBasisPoints: 100,
        },
        transferFeeConfigAuthority: new PublicKey('2apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk'),
        withdrawWithheldAuthority: new PublicKey('3apBGMsS6ti9RyF5TwQTDswXBWskiJP2LD4cUEDqYJjk'),
        withheldAmount: 500000,
    },
} as TokenExtension;
