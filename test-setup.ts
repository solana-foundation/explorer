import '@testing-library/jest-dom';

// Needed for @solana/addresses (Solana Kit) which checks isSecureContext before
// using crypto.subtle for PDA derivation. jsdom does not set this to true.
if (!globalThis.isSecureContext) {
    Object.defineProperty(globalThis, 'isSecureContext', { value: true });
}

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
