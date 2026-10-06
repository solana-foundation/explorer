import { afterEach, describe, expect, it, vi } from 'vitest';

import { trackEvent } from '@/app/shared/lib/analytics';

import { createIdlAnalytics } from './analytics';

vi.mock('@/app/shared/lib/analytics', () => ({
    trackEvent: vi.fn(),
}));

const mockedTrackEvent = vi.mocked(trackEvent);

describe.each([
    { prefix: 'iidl_anchor', standard: 'Anchor' },
    { prefix: 'iidl_codama', standard: 'Codama' },
] as const)('createIdlAnalytics ($standard standard)', ({ prefix, standard }) => {
    const analytics = createIdlAnalytics(standard);

    afterEach(() => {
        vi.clearAllMocks();
    });

    it(`should emit ${prefix}_idl_viewed on trackIdlViewed`, () => {
        analytics.trackIdlViewed('prog1');
        expect(mockedTrackEvent).toHaveBeenCalledWith(`${prefix}_idl_viewed`, { program_id: 'prog1' });
    });

    it(`should emit ${prefix}_tab_opened on trackTabOpened`, () => {
        analytics.trackTabOpened('prog1');
        expect(mockedTrackEvent).toHaveBeenCalledWith(`${prefix}_tab_opened`, { program_id: 'prog1' });
    });

    it(`should emit ${prefix}_sections_expanded with joined sections and count`, () => {
        analytics.trackSectionsExpanded('prog1', ['accounts', 'args']);
        expect(mockedTrackEvent).toHaveBeenCalledWith(`${prefix}_sections_expanded`, {
            expanded_sections: 'accounts,args',
            expanded_sections_count: 2,
            program_id: 'prog1',
        });
    });

    it(`should emit ${prefix}_transaction_confirmed with signature`, () => {
        analytics.trackTransactionConfirmed('prog1', 'initialize', 'sig123');
        expect(mockedTrackEvent).toHaveBeenCalledWith(`${prefix}_transaction_confirmed`, {
            instruction_name: 'initialize',
            program_id: 'prog1',
            transaction_signature: 'sig123',
        });
    });

    it(`should emit ${prefix}_transaction_failed with error message`, () => {
        analytics.trackTransactionFailed('prog1', 'initialize', 'boom');
        expect(mockedTrackEvent).toHaveBeenCalledWith(`${prefix}_transaction_failed`, {
            error_message: 'boom',
            instruction_name: 'initialize',
            program_id: 'prog1',
        });
    });

    it(`should emit ${prefix}_transaction_simulated`, () => {
        analytics.trackTransactionSimulated('prog1', 'initialize');
        expect(mockedTrackEvent).toHaveBeenCalledWith(`${prefix}_transaction_simulated`, {
            instruction_name: 'initialize',
            program_id: 'prog1',
        });
    });

    it(`should emit ${prefix}_transaction_submitted`, () => {
        analytics.trackTransactionSubmitted('prog1', 'initialize');
        expect(mockedTrackEvent).toHaveBeenCalledWith(`${prefix}_transaction_submitted`, {
            instruction_name: 'initialize',
            program_id: 'prog1',
        });
    });

    it(`should emit ${prefix}_wallet_connected with wallet type`, () => {
        analytics.trackWalletConnected('prog1', 'Phantom');
        expect(mockedTrackEvent).toHaveBeenCalledWith(`${prefix}_wallet_connected`, {
            program_id: 'prog1',
            wallet_type: 'Phantom',
        });
    });
});
