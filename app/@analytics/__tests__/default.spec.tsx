import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import Analytics from '../default';

vi.mock('@vercel/speed-insights/next', () => ({ SpeedInsights: () => null }));
vi.mock('@/app/features/cookie', () => ({ useAnalyticsConsent: () => ({ isConsentGiven: true }) }));
vi.mock('../WebVitalsReporter', () => ({ WebVitalsReporter: () => null }));
vi.mock('next/script', () => ({
    default: ({ children, id, src }: { children?: string; id?: string; src?: string }) => (
        <script defer data-testid={id ?? 'gtag-loader'} src={src}>
            {children}
        </script>
    ),
}));

// Every character the old `.replace("'", "\\'")` mishandled: a second quote, a backslash, a double quote.
const HOSTILE_ID = `G-1'2'\\3"4`;

describe('Analytics', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('should render nothing when neither Google id is configured', () => {
        vi.stubEnv('NEXT_PUBLIC_GOOGLE_TAG_ID', '');
        vi.stubEnv('NEXT_PUBLIC_GOOGLE_ANALYTICS_ID', '');

        const { container } = render(<Analytics />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should quote the tag id in the GTM bootstrap', () => {
        vi.stubEnv('NEXT_PUBLIC_GOOGLE_TAG_ID', 'GTM-ABC123');
        vi.stubEnv('NEXT_PUBLIC_GOOGLE_ANALYTICS_ID', '');

        render(<Analytics />);

        expect(screen.getByTestId('google-tag-initialization')).toHaveTextContent(
            `(window,document,'script','dataLayer',"GTM-ABC123");`,
        );
    });

    it('should escape a hostile tag id into a valid string literal', () => {
        vi.stubEnv('NEXT_PUBLIC_GOOGLE_TAG_ID', HOSTILE_ID);
        vi.stubEnv('NEXT_PUBLIC_GOOGLE_ANALYTICS_ID', '');

        render(<Analytics />);

        expect(screen.getByTestId('google-tag-initialization')).toHaveTextContent(
            String.raw`(window,document,'script','dataLayer',"G-1'2'\\3\"4");`,
        );
    });

    it('should quote the analytics id in the gtag config and pass it through the loader src', () => {
        vi.stubEnv('NEXT_PUBLIC_GOOGLE_TAG_ID', '');
        vi.stubEnv('NEXT_PUBLIC_GOOGLE_ANALYTICS_ID', 'G-ABC123');

        render(<Analytics />);

        expect(screen.getByTestId('google-analytics-initialization')).toHaveTextContent(`gtag('config', "G-ABC123");`);
        expect(screen.getByTestId('gtag-loader')).toHaveAttribute(
            'src',
            'https://www.googletagmanager.com/gtag/js?id=G-ABC123',
        );
    });

    it('should escape a hostile analytics id in the gtag config and percent-encode it in the loader src', () => {
        vi.stubEnv('NEXT_PUBLIC_GOOGLE_TAG_ID', '');
        vi.stubEnv('NEXT_PUBLIC_GOOGLE_ANALYTICS_ID', HOSTILE_ID);

        render(<Analytics />);

        expect(screen.getByTestId('google-analytics-initialization')).toHaveTextContent(
            String.raw`gtag('config', "G-1'2'\\3\"4");`,
        );
        expect(screen.getByTestId('gtag-loader')).toHaveAttribute(
            'src',
            "https://www.googletagmanager.com/gtag/js?id=G-1'2'%5C3%224",
        );
    });

    it('should prefer the tag id when both ids are configured', () => {
        vi.stubEnv('NEXT_PUBLIC_GOOGLE_TAG_ID', 'GTM-ABC123');
        vi.stubEnv('NEXT_PUBLIC_GOOGLE_ANALYTICS_ID', 'G-ABC123');

        render(<Analytics />);

        expect(screen.getByTestId('google-tag-initialization')).toBeInTheDocument();
        expect(screen.queryByTestId('google-analytics-initialization')).not.toBeInTheDocument();
    });
});
