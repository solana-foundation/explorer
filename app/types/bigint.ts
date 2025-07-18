// eslint-disable-next-line no-prototype-builtins
if (!BigInt.prototype.hasOwnProperty('toJSON')) {
    Object.defineProperty(BigInt.prototype, 'toJSON', {
        get() {
            'use strict';
            return () => String(this);
        },
    });
}

export {};
