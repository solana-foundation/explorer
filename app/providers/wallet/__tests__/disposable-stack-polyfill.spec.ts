import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const nativeDisposableStack = globalThis.DisposableStack;

beforeAll(async () => {
    // @ts-expect-error -- forces the polyfill branch on runtimes that already ship the global
    delete globalThis.DisposableStack;
    await import('../disposable-stack-polyfill');
});

afterAll(() => {
    globalThis.DisposableStack = nativeDisposableStack;
});

describe('DisposableStack polyfill', () => {
    it('should run deferred callbacks in reverse order on dispose', () => {
        const order: number[] = [];
        const stack = new DisposableStack();
        stack.defer(() => order.push(1));
        stack.defer(() => order.push(2));

        stack[Symbol.dispose]();

        expect(order).toEqual([2, 1]);
        expect(stack.disposed).toBe(true);
    });

    it('should ignore a second dispose', () => {
        const onDispose = vi.fn();
        const stack = new DisposableStack();
        stack.defer(onDispose);

        stack.dispose();
        stack.dispose();

        expect(onDispose).toHaveBeenCalledTimes(1);
    });

    it('should run every callback even when one throws, then rethrow the first failure', () => {
        const later = vi.fn();
        const stack = new DisposableStack();
        stack.defer(later);
        stack.defer(() => {
            throw new Error('boom');
        });

        expect(() => stack.dispose()).toThrow('boom');
        expect(later).toHaveBeenCalled();
    });

    it('should reject deferring onto a disposed stack', () => {
        const stack = new DisposableStack();
        stack.dispose();

        expect(() => stack.defer(() => {})).toThrow(ReferenceError);
    });

    it('should dispose values passed to use and adopt', () => {
        const disposeUsed = vi.fn();
        const onAdopt = vi.fn();
        const stack = new DisposableStack();
        stack.use({ [Symbol.dispose]: disposeUsed });
        stack.adopt('value', onAdopt);

        stack.dispose();

        expect(disposeUsed).toHaveBeenCalled();
        expect(onAdopt).toHaveBeenCalledWith('value');
    });

    it('should transfer pending callbacks out of a moved stack', () => {
        const onDispose = vi.fn();
        const stack = new DisposableStack();
        stack.defer(onDispose);

        const moved = stack.move();
        stack.dispose();
        expect(onDispose).not.toHaveBeenCalled();

        moved.dispose();
        expect(onDispose).toHaveBeenCalled();
    });
});
