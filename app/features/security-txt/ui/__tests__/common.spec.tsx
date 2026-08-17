import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ContactInfo, RenderExternalLink } from '../common';

describe('ContactInfo link', () => {
    it('should render a guarded external anchor for http(s) contact links', () => {
        render(<ContactInfo type="link" information="https://example.com/security" />);

        const link = screen.getByRole('link', { name: /https:\/\/example.com\/security/i });
        expect(link).toHaveAttribute('href', 'https://example.com/security');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        expect(link).toHaveAttribute('target', '_blank');
    });

    it.each(['javascript:alert(1)', 'data:text/html,x', 'vbscript:msgbox(1)'])(
        'should render plain text and no anchor for unsafe contact link: %s',
        href => {
            render(<ContactInfo type="link" information={href} />);

            expect(screen.queryByRole('link')).not.toBeInTheDocument();
            expect(screen.getByText(href)).toBeInTheDocument();
        },
    );
});

describe('RenderExternalLink', () => {
    it('should render a guarded external anchor for http(s) URLs', () => {
        render(<RenderExternalLink url="https://example.com/policy" />);

        const link = screen.getByRole('link', { name: /https:\/\/example.com\/policy/i });
        expect(link).toHaveAttribute('href', 'https://example.com/policy');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        expect(link).toHaveAttribute('target', '_blank');
    });

    it.each(['javascript:alert(1)', 'data:text/html,x'])(
        'should render plain text and no anchor for unsafe URL: %s',
        href => {
            render(<RenderExternalLink url={href} />);

            expect(screen.queryByRole('link')).not.toBeInTheDocument();
            expect(screen.getByText(href)).toBeInTheDocument();
        },
    );
});
