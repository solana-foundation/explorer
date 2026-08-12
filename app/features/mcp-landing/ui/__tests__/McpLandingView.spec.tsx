import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { McpLandingView } from '../McpLandingView';

describe('McpLandingView', () => {
    it('should render the hero heading', () => {
        render(<McpLandingView />);

        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    // Guards the CTA/section pairing: renaming a section id without its anchor breaks both buttons silently.
    it('should point every hero CTA at a section that exists', () => {
        const { container } = render(<McpLandingView />);

        const fragments = screen
            .getAllByRole('link')
            .map(link => link.getAttribute('href') ?? '')
            .filter(href => href.startsWith('#'));

        expect(fragments).toEqual(['#setup', '#tools']);
        for (const fragment of fragments) {
            // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- an anchor target is an id, and ids have no role to query by
            expect(container.querySelector(`[id="${fragment.slice(1)}"]`), fragment).toBeInTheDocument();
        }
    });

    it('should document both registered tools', () => {
        render(<McpLandingView />);

        expect(screen.getByRole('heading', { name: 'inspect_entity' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'ping' })).toBeInTheDocument();
    });

    it('should state that the endpoint needs no key', () => {
        render(<McpLandingView />);

        expect(screen.getByText('Open — no key required')).toBeInTheDocument();
    });
});
