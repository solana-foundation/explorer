import '@testing-library/jest-dom';

import { TextEncoder } from 'util';
// Needed for @sqds/multisig
global.TextEncoder = TextEncoder;

if (!AbortSignal.timeout) {
    AbortSignal.timeout = ms => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), ms);
        return controller.signal;
    };
}

// Needed for @solana/web3.js to treat Uint8Arrays as Buffers
// See https://github.com/anza-xyz/solana-pay/issues/106
const originalHasInstance = Uint8Array[Symbol.hasInstance];
Object.defineProperty(Uint8Array, Symbol.hasInstance, {
    value(potentialInstance: any) {
        return originalHasInstance.call(this, potentialInstance) || Buffer.isBuffer(potentialInstance);
    },
});
