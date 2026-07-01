import '@testing-library/jest-dom';

// ResizeObserver is not available in jsdom
if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
}

// Needed for @solana/addresses (Solana Kit) which checks isSecureContext before
// using crypto.subtle for PDA derivation. jsdom does not set this to true.
if (!globalThis.isSecureContext) {
    Object.defineProperty(globalThis, 'isSecureContext', { value: true });
}

// jsdom does not implement matchMedia. Provide a default so tests can spy on it
// (Vitest 4's vi.spyOn throws when the target property is undefined). Guarded so
// the real browser implementation is used under the Storybook (browser) project.
if (!globalThis.matchMedia) {
    Object.defineProperty(globalThis, 'matchMedia', {
        configurable: true,
        value(query: string) {
            return {
                addEventListener() {},
                addListener() {},
                dispatchEvent() {
                    return false;
                },
                matches: false,
                media: query,
                removeEventListener() {},
                removeListener() {},
            };
        },
        writable: true,
    });
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
// Guarded + configurable so re-evaluating this setup is idempotent: Vitest 4's browser
// mode can import it more than once in the same realm, and a non-configurable
// redefinition would throw "Cannot redefine property".
if (!Object.getOwnPropertyDescriptor(Uint8Array, Symbol.hasInstance)) {
    const originalHasInstance = Uint8Array[Symbol.hasInstance];
    Object.defineProperty(Uint8Array, Symbol.hasInstance, {
        configurable: true,
        value(potentialInstance: unknown) {
            return originalHasInstance.call(this, potentialInstance) || Buffer.isBuffer(potentialInstance);
        },
    });
}
