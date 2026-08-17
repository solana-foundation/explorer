import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ContactInfo, RenderExternalLink } from '../common';

// security.txt is read straight out of a program binary, so every field is
// attacker-controlled: anyone can deploy a program carrying a `javascript:` URL.
// These components must therefore never emit an anchor for an unsafe scheme.
const UNSAFE_HREFS = ['javascript:alert(document.domain)', 'data:text/html,<script>alert(1)</script>', 'not a url', ''];

describe('RenderExternalLink', () => {
    it('should render a new-tab anchor for an http(s) URL', () => {
        render(<RenderExternalLink url="https://example.com/security" />);

        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', 'https://example.com/security');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it.each(UNSAFE_HREFS)('should render no anchor for unsafe url: %s', url => {
        render(<RenderExternalLink url={url} />);

        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
});

describe('ContactInfo link', () => {
    it('should render an anchor for an http(s) link', () => {
        render(<ContactInfo type="link" information="https://example.com/contact" />);

        expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.com/contact');
    });

    it.each(UNSAFE_HREFS)('should fall back to plain text for unsafe link: %s', information => {
        render(<ContactInfo type="link" information={information} />);

        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
});
