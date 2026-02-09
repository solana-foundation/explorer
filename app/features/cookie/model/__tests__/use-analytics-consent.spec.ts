import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

    it('returns isConsentGiven=false when no consent', () => {
        const { result } = renderHook(() => useAnalyticsConsent());
        expect(result.current.isConsentGiven).toBe(false);
    });

    it('returns isConsentGiven=true when granted', () => {
        vi.mocked(getCookie).mockReturnValue('granted');
        const { result } = renderHook(() => useAnalyticsConsent());
        expect(result.current.isConsentGiven).toBe(true);
    });

    it('returns isConsentGiven=false when denied', () => {
        vi.mocked(getCookie).mockReturnValue('denied');
        const { result } = renderHook(() => useAnalyticsConsent());
        expect(result.current.isConsentGiven).toBe(false);
    });

    it('updates on consent change event', () => {
        const { result } = renderHook(() => useAnalyticsConsent());
        expect(result.current.isConsentGiven).toBe(false);

        act(() => {
            window.dispatchEvent(new CustomEvent('cookie-consent-change', { detail: 'granted' }));
        });

        expect(result.current.isConsentGiven).toBe(true);
    });
});
