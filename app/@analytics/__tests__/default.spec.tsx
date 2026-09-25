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

    it('should emit the tag id as a JSON string literal in the GTM bootstrap', () => {
        vi.stubEnv('NEXT_PUBLIC_GOOGLE_TAG_ID', HOSTILE_ID);
        vi.stubEnv('NEXT_PUBLIC_GOOGLE_ANALYTICS_ID', '');

        render(<Analytics />);

        expect(screen.getByTestId('google-tag-initialization')).toHaveTextContent(
            `'dataLayer',${JSON.stringify(HOSTILE_ID)});`,
        );
    });

    it('should emit the analytics id as a JSON string literal and URL-encode it in the loader src', () => {
        vi.stubEnv('NEXT_PUBLIC_GOOGLE_TAG_ID', '');
        vi.stubEnv('NEXT_PUBLIC_GOOGLE_ANALYTICS_ID', HOSTILE_ID);

        render(<Analytics />);

        expect(screen.getByTestId('google-analytics-initialization')).toHaveTextContent(
            `gtag('config', ${JSON.stringify(HOSTILE_ID)});`,
        );
        expect(screen.getByTestId('gtag-loader')).toHaveAttribute(
            'src',
            `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(HOSTILE_ID)}`,
        );
    });

    it('should prefer the tag id when both ids are configured', () => {
        vi.stubEnv('NEXT_PUBLIC_GOOGLE_TAG_ID', 'GTM-TEST');
        vi.stubEnv('NEXT_PUBLIC_GOOGLE_ANALYTICS_ID', 'G-TEST');

        render(<Analytics />);

        expect(screen.getByTestId('google-tag-initialization')).toBeInTheDocument();
        expect(screen.queryByTestId('google-analytics-initialization')).not.toBeInTheDocument();
    });
});
