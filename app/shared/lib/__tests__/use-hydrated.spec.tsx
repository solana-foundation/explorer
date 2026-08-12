import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useHydrated } from '../use-hydrated';

function Probe({ onRender }: { onRender: (hydrated: boolean) => void }) {
    onRender(useHydrated());
    return null;
}

describe('useHydrated', () => {
    // The first value has to be false, not merely "false somewhere": it is what makes the first client
    // render match server markup.
    it('should report false on the first render and true once mounted', () => {
        const seen: boolean[] = [];

        render(<Probe onRender={hydrated => seen.push(hydrated)} />);

        expect(seen[0]).toBe(false);
        expect(seen.at(-1)).toBe(true);
    });
});
