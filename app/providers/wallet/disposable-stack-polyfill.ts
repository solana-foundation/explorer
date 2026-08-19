/**
 * Installs `Symbol.dispose` and `DisposableStack` where the runtime does not provide them.
 *
 * Kit registers plugin cleanup through both. Chromium shipped them in 134 and Firefox in 137;
 * Safari still has not, so this is not only a concession to old browsers. Importing this module
 * before any Kit client is created keeps Explorer loading wherever they are missing.
 */

export {};

if (typeof (Symbol as { dispose?: symbol }).dispose === 'undefined') {
    Object.defineProperty(Symbol, 'dispose', { value: Symbol.for('Symbol.dispose') });
}

if (typeof globalThis.DisposableStack === 'undefined') {
    class DisposableStackPolyfill {
        #disposed = false;
        #stack: (() => void)[] = [];

        get disposed(): boolean {
            return this.#disposed;
        }

        adopt<T>(value: T, onDispose: (value: T) => void): T {
            this.defer(() => onDispose(value));
            return value;
        }

        defer(onDispose: () => void): void {
            if (this.#disposed) throw new ReferenceError('DisposableStack is disposed');
            if (typeof onDispose !== 'function') throw new TypeError('onDispose must be a function');
            this.#stack.push(onDispose);
        }

        dispose(): void {
            if (this.#disposed) return;
            this.#disposed = true;
            let error: unknown;
            let hasError = false;
            // Disposed in reverse registration order, and every entry runs even if one throws, so a
            // failing cleanup cannot strand the ones registered before it. The first failure is the
            // one rethrown once the stack has drained.
            for (const onDispose of this.#stack.reverse()) {
                try {
                    onDispose();
                } catch (e) {
                    if (!hasError) {
                        error = e;
                        hasError = true;
                    }
                }
            }
            this.#stack = [];
            if (hasError) throw error;
        }

        move(): DisposableStackPolyfill {
            if (this.#disposed) throw new ReferenceError('DisposableStack is disposed');
            const moved = new DisposableStackPolyfill();
            moved.#stack = this.#stack;
            this.#stack = [];
            this.#disposed = true;
            return moved;
        }

        use<T extends Disposable | null | undefined>(value: T): T {
            if (value) this.adopt(value, disposable => disposable[Symbol.dispose]());
            return value;
        }

        [Symbol.dispose](): void {
            this.dispose();
        }

        get [Symbol.toStringTag](): string {
            return 'DisposableStack';
        }
    }

    globalThis.DisposableStack = DisposableStackPolyfill as unknown as typeof DisposableStack;
}
