import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { COOKIE_CONSENT_NAME, CookieConsent } from '../CookieConsent';

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
            vi.fn(() => Promise.resolve({ json: () => Promise.resolve({ isEU: true }) }))
        );
    });

    it('does not render when consent exists', async () => {
        vi.mocked(getCookie).mockReturnValue('granted');
        render(<CookieConsent />);
        await waitFor(() => expect(fetch).toHaveBeenCalled());
        expect(screen.queryByText('ACCEPT')).toBeNull();
    });

    it('does not render for non-EU users', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.resolve({ json: () => Promise.resolve({ isEU: false }) }))
        );
        render(<CookieConsent />);
        await waitFor(() => expect(fetch).toHaveBeenCalled());
        expect(screen.queryByText('ACCEPT')).toBeNull();
    });

    it('handles accept click', async () => {
        render(<CookieConsent />);
        const btn = await screen.findByText('ACCEPT', {}, { timeout: 3000 });
        await userEvent.click(btn);
        expect(setCookie).toHaveBeenCalledWith(COOKIE_CONSENT_NAME, 'granted', expect.any(Number));
    });

    it('handles opt-out click', async () => {
        render(<CookieConsent />);
        const btn = await screen.findByText('OPT-OUT', {}, { timeout: 3000 });
        await userEvent.click(btn);
        expect(setCookie).toHaveBeenCalledWith(COOKIE_CONSENT_NAME, 'denied', expect.any(Number));
    });

    it('handles dismiss without cookie', async () => {
        render(<CookieConsent />);
        const btn = await screen.findByText('×', {}, { timeout: 3000 });
        await userEvent.click(btn);
        expect(screen.queryByText('ACCEPT')).toBeNull();
        expect(setCookie).not.toHaveBeenCalled();
    });
});
