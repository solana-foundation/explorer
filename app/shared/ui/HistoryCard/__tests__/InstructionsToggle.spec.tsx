import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { getDefaultStore } from 'jotai';
import { beforeEach, describe, expect, it } from 'vitest';

import { InstructionsToggle } from '../InstructionsToggle';
import { SHOW_INSTRUCTIONS_STORAGE_KEY, showInstructionsAtom, useShowInstructions } from '../use-show-instructions';

describe('InstructionsToggle', () => {
    beforeEach(() => {
        window.localStorage.clear();
        act(() => getDefaultStore().set(showInstructionsAtom, true));
    });

    it('should default to showing instructions', () => {
        const { result } = renderHook(() => useShowInstructions());
        expect(result.current[0]).toBe(true);
    });

    it('should flip the shared preference and persist it', () => {
        const { result } = renderHook(() => useShowInstructions());
        render(<InstructionsToggle />);

        fireEvent.click(screen.getByRole('button', { name: 'Hide instructions' }));

        expect(result.current[0]).toBe(false);
        expect(window.localStorage.getItem(SHOW_INSTRUCTIONS_STORAGE_KEY)).toBe('false');
        expect(screen.getByRole('button', { name: 'Show instructions' })).toHaveAttribute('aria-pressed', 'false');
    });
});
