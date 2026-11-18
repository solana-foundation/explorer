// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { COOKIE_CONSENT_CHANGE_EVENT, EConsentStatus } from '../../ui/CookieConsent';
import { useAnalyticsConsent } from '../use-analytics-consent';

vi.mock('../../lib/stored-value', () => ({
    getStoredValue: vi.fn(() => undefined),
}));

import { getStoredValue } from '../../lib/stored-value';

describe('useAnalyticsConsent', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getStoredValue).mockReturnValue(undefined);
    });

    it.each([
        ['false when no consent', undefined, false],
        ['true when granted', EConsentStatus.Granted, true],
        ['false when denied', EConsentStatus.Denied, false],
    ])('should return isConsentGiven=%s', (_, consent, expected) => {
        vi.mocked(getStoredValue).mockReturnValue(consent);
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
