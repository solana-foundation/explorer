import { expect } from 'vi';
import '@testing-library/jest-dom';

import { TextEncoder } from 'util';
// Needed for @sqds/multisig
global.TextEncoder = TextEncoder;

// Needed for @solana/web3.js to treat Uint8Arrays as Buffers
// See https://github.com/anza-xyz/solana-pay/issues/106
const originalHasInstance = Uint8Array[Symbol.hasInstance];
Object.defineProperty(Uint8Array, Symbol.hasInstance, {
    value(potentialInstance: any) {
        return (
            originalHasInstance.call(this, potentialInstance) ||
            Buffer.isBuffer(potentialInstance)
        );
    },
});