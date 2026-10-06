import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { COOKIE_CONSENT_NAME, CookieConsent, EConsentStatus } from '../CookieConsent';

vi.mock('../../lib/cookie', () => ({
    getCookie: vi.fn(() => null),
    setCookie: vi.fn(),
}));

import { getCookie, setCookie } from '../../lib/cookie';

describe('CookieConsent', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getCookie).mockReturnValue(null);
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.resolve({ json: () => Promise.resolve({ isEU: true }) })),
        );
    });

    it.each([
        ['granted', EConsentStatus.Granted],
        ['denied', EConsentStatus.Denied],
    ])('should not render, fetch geo-location, or overwrite consent when consent is %s', async (_, consent) => {
        vi.mocked(getCookie).mockReturnValue(consent);
        render(<CookieConsent />);
        await waitFor(() => expect(screen.queryByText('ACCEPT')).toBeNull());
        expect(fetch).not.toHaveBeenCalled();
        expect(setCookie).not.toHaveBeenCalled();
    });

    it('should not render for non-EU users and auto-grants consent', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.resolve({ json: () => Promise.resolve({ isEU: false }) })),
        );
        render(<CookieConsent />);
        await waitFor(() => expect(fetch).toHaveBeenCalled());
        expect(screen.queryByText('ACCEPT')).toBeNull();
        expect(setCookie).toHaveBeenCalledWith(COOKIE_CONSENT_NAME, EConsentStatus.Granted, expect.any(Number));
    });

    it('should auto-grant consent when geo-location fails', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.reject(new Error('Network error'))),
        );
        render(<CookieConsent />);
        await waitFor(() => expect(fetch).toHaveBeenCalled());
        await waitFor(() => {
            expect(setCookie).toHaveBeenCalledWith(COOKIE_CONSENT_NAME, EConsentStatus.Granted, expect.any(Number));
        });
        expect(screen.queryByText('ACCEPT')).toBeNull();
    });

    it('should sit below modal dialogs so one dims the banner', async () => {
        // Radix disables pointer events outside an open modal, so a dialog turns these buttons off. The
        // banner has to stay under the dialog overlay's `z-50` (`components/shared/ui/dialog`), or it keeps
        // full contrast while answering nothing — what the RPC consent prompt showed.
        render(<CookieConsent />);
        const banner = await screen.findByTestId('cookie-consent');

        // jsdom loads no stylesheet, so Tailwind's `z-*` reaches the DOM as a class name only. `z-40` is
        // the highest step of Tailwind's scale that stays under the overlay.
        expect(banner.className).toContain('z-40');
    });

    it.each([
        ['ACCEPT', EConsentStatus.Granted],
        ['OPT-OUT', EConsentStatus.Denied],
    ])('should handle %s click', async (label, consent) => {
        render(<CookieConsent />);
        const btn = await screen.findByText(label, {}, { timeout: 3000 });
        await userEvent.click(btn);
        expect(setCookie).toHaveBeenCalledWith(COOKIE_CONSENT_NAME, consent, expect.any(Number));
    });
});
