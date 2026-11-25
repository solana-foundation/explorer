import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ScrollAnchorProvider, useScrollAnchor } from '../scroll-anchor';

vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));

const scrollIntoView = vi.fn();

beforeEach(() => {
    Element.prototype.scrollIntoView = scrollIntoView;
});

afterEach(() => {
    window.location.hash = '';
    vi.clearAllMocks();
});

describe('ScrollAnchorProvider', () => {
    it('should scroll to the anchor that the URL fragment names', () => {
        window.location.hash = '#accounts';

        render(<AnchoredPage />);

        expect(scrollIntoView).toHaveBeenCalledOnce();
    });

    it('should ignore a URL fragment that names an inherited object member', () => {
        window.location.hash = '#constructor';

        expect(() => render(<AnchoredPage />)).not.toThrow();
        expect(scrollIntoView).not.toHaveBeenCalled();
    });
});

function AnchoredPage() {
    return (
        <ScrollAnchorProvider>
            <Section />
        </ScrollAnchorProvider>
    );
}

function Section() {
    return <section ref={useScrollAnchor('accounts')} />;
}
