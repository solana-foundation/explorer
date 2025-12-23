import '@testing-library/jest-dom';
// Import the cluster mock setup FIRST, before any other imports
import './app/__tests__/setup-cluster-mock';

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
