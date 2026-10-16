// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { COOKIE_CONSENT_CHANGE_EVENT, EConsentStatus } from '../../ui/CookieConsent';
import { useAnalyticsConsent } from '../use-analytics-consent';

vi.mock('../../lib/cookie', () => ({
    getCookie: vi.fn(() => null),
}));

import { getCookie } from '../../lib/cookie';

describe('useAnalyticsConsent', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getCookie).mockReturnValue(null);
    });

    it.each([
        ['false when no consent', null, false],
        ['true when granted', EConsentStatus.Granted, true],
        ['false when denied', EConsentStatus.Denied, false],
    ])('should return isConsentGiven=%s', (_, consent, expected) => {
        vi.mocked(getCookie).mockReturnValue(consent);
        const { result } = renderHook(() => useAnalyticsConsent());
        expect(result.current.isConsentGiven).toBe(expected);
    });

    it('should update on consent change event', () => {
        const { result } = renderHook(() => useAnalyticsConsent());
        expect(result.current.isConsentGiven).toBe(false);

        act(() => {
            window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_CHANGE_EVENT, { detail: EConsentStatus.Granted }));
        });

        expect(result.current.isConsentGiven).toBe(true);
    });
});
