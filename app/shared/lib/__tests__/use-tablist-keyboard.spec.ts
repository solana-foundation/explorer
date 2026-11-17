// @vitest-environment jsdom

import { renderHook } from '@testing-library/react';
import type { KeyboardEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useTablistKeyboard } from '../use-tablist-keyboard';

function keyEvent(key: string, modifiers: Partial<Pick<KeyboardEvent, 'altKey' | 'ctrlKey' | 'metaKey'>> = {}) {
    return {
        altKey: false,
        ctrlKey: false,
        key,
        metaKey: false,
        preventDefault: vi.fn(),
        ...modifiers,
    } as unknown as KeyboardEvent<HTMLElement>;
}

describe('useTablistKeyboard', () => {
    it('should select the previous tab on ArrowLeft', () => {
        const onSelect = vi.fn();
        const { result } = renderHook(() => useTablistKeyboard(3, 1, onSelect));
        const event = keyEvent('ArrowLeft');

        result.current.onKeyDown(event);

        expect(onSelect).toHaveBeenCalledWith(0);
        expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should move focus from the focused tab to the next one on ArrowRight', () => {
        const onSelect = vi.fn();
        const { result } = renderHook(() => useTablistKeyboard<HTMLButtonElement>(2, 0, onSelect));
        const tabs = [document.createElement('button'), document.createElement('button')];
        document.body.append(...tabs);
        tabs.forEach((tab, index) => result.current.setTabRef(index)(tab));
        tabs[0].focus();

        result.current.onKeyDown(keyEvent('ArrowRight'));

        expect(onSelect).toHaveBeenCalledWith(1);
        expect(tabs[1]).toHaveFocus();
        tabs.forEach(tab => tab.remove());
    });

    it.each(['altKey', 'ctrlKey', 'metaKey'] as const)('should leave ArrowLeft with %s to the browser', modifier => {
        const onSelect = vi.fn();
        const { result } = renderHook(() => useTablistKeyboard(3, 1, onSelect));
        const event = keyEvent('ArrowLeft', { [modifier]: true });

        result.current.onKeyDown(event);

        expect(onSelect).not.toHaveBeenCalled();
        expect(event.preventDefault).not.toHaveBeenCalled();
    });
});
