import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ExternalResourceLink } from '../ExternalResourceLink';

describe('ExternalResourceLink', () => {
    it('should render an external anchor for http(s) URLs', () => {
        render(<ExternalResourceLink href="https://arweave.net/image.png" />);

        const link = screen.getByRole('link', { name: 'View original' });
        expect(link).toHaveAttribute('href', 'https://arweave.net/image.png');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        expect(link).toHaveAttribute('target', '_blank');
    });

    // On-chain metadata is attacker-controlled; a non-http(s) scheme must never
    // reach the DOM, or a `javascript:` href would execute in this origin on click.
    it.each(['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'vbscript:msgbox(1)', 'not a url'])(
        'should render no link for unsafe or unparseable href: %s',
        href => {
            render(<ExternalResourceLink href={href} />);

            expect(screen.queryByRole('link')).not.toBeInTheDocument();
        },
    );
});
