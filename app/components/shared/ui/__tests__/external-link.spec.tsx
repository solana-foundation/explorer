import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ExternalLink } from '../external-link';

describe('ExternalLink', () => {
    it('should render a new-tab anchor with noopener noreferrer for http(s) URLs', () => {
        render(
            <ExternalLink className="custom" href="https://example.com/x">
                Open
            </ExternalLink>,
        );

        const link = screen.getByRole('link', { name: 'Open' });
        expect(link).toHaveAttribute('href', 'https://example.com/x');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        expect(link).toHaveClass('custom');
    });

    // The whole point: a non-http(s) or empty destination renders no anchor, so
    // an attacker-controlled `javascript:` URL can never reach the DOM.
    it.each(['javascript:alert(1)', 'data:text/html,x', 'vbscript:msgbox(1)', 'not a url', '', undefined])(
        'should render no anchor for unsafe or empty href: %s',
        href => {
            render(<ExternalLink href={href}>Open</ExternalLink>);

            expect(screen.queryByRole('link')).not.toBeInTheDocument();
        },
    );
});
