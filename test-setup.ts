import '@testing-library/jest-dom';

// -----------------------------
// AbortSignal.timeout polyfill
// -----------------------------
if (!(AbortSignal as any).timeout) {
  (AbortSignal as any).timeout = (ms: number) => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  };
}

// ---------------------------------------------
// Solana Web3.js: Uint8Array/Buffer uyumluluğu
// ---------------------------------------------
const originalHasInstance = Uint8Array[Symbol.hasInstance];

Object.defineProperty(Uint8Array, Symbol.hasInstance, {
  value(potentialInstance: any) {
    return originalHasInstance.call(this, potentialInstance) || Buffer.isBuffer(potentialInstance);
  },
  configurable: true,
  writable: true,
});
