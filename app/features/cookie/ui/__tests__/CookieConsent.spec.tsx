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

    it('should not render when consent exists and skips geo-location fetch', async () => {
        vi.mocked(getCookie).mockReturnValue(EConsentStatus.Granted);
        render(<CookieConsent />);
        await waitFor(() => expect(screen.queryByText('ACCEPT')).toBeNull());
        expect(fetch).not.toHaveBeenCalled();
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

    it('should not overwrite existing consent and skips geo-location fetch', async () => {
        vi.mocked(getCookie).mockReturnValue(EConsentStatus.Denied);
        render(<CookieConsent />);
        await waitFor(() => expect(screen.queryByText('ACCEPT')).toBeNull());
        expect(fetch).not.toHaveBeenCalled();
        expect(setCookie).not.toHaveBeenCalled();
    });

    it('should handle accept click', async () => {
        render(<CookieConsent />);
        const btn = await screen.findByText('ACCEPT', {}, { timeout: 3000 });
        await userEvent.click(btn);
        expect(setCookie).toHaveBeenCalledWith(COOKIE_CONSENT_NAME, EConsentStatus.Granted, expect.any(Number));
    });

    it('should handle opt-out click', async () => {
        render(<CookieConsent />);
        const btn = await screen.findByText('OPT-OUT', {}, { timeout: 3000 });
        await userEvent.click(btn);
        expect(setCookie).toHaveBeenCalledWith(COOKIE_CONSENT_NAME, EConsentStatus.Denied, expect.any(Number));
    });
});
