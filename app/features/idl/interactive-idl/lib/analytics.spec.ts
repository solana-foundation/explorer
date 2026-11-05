import { IdlVariant } from '@entities/idl';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { trackEvent } from '@/app/shared/lib/analytics';

import { createIdlAnalytics } from './analytics';

vi.mock('@/app/shared/lib/analytics', () => ({
    trackEvent: vi.fn(),
}));

const mockedTrackEvent = vi.mocked(trackEvent);

describe.each([
    { prefix: 'iidl_anchor', source: IdlVariant.Anchor, standard: 'Anchor' },
    { prefix: 'iidl_codama', source: IdlVariant.ProgramMetadata, standard: 'Codama' },
] as const)('createIdlAnalytics ($standard standard)', ({ prefix, source, standard }) => {
    const analytics = createIdlAnalytics(standard, source);

    afterEach(() => {
        vi.clearAllMocks();
    });

    it(`should emit ${prefix}_idl_viewed on trackIdlViewed`, () => {
        analytics.trackIdlViewed('prog1');
        expect(mockedTrackEvent).toHaveBeenCalledWith(`${prefix}_idl_viewed`, {
            idl_source: source,
            program_id: 'prog1',
        });
    });

    it(`should emit ${prefix}_tab_opened on trackTabOpened`, () => {
        analytics.trackTabOpened('prog1');
        expect(mockedTrackEvent).toHaveBeenCalledWith(`${prefix}_tab_opened`, {
            idl_source: source,
            program_id: 'prog1',
        });
    });

    it(`should emit ${prefix}_sections_expanded with joined sections and count`, () => {
        analytics.trackSectionsExpanded('prog1', ['accounts', 'args']);
        expect(mockedTrackEvent).toHaveBeenCalledWith(`${prefix}_sections_expanded`, {
            expanded_sections: 'accounts,args',
            expanded_sections_count: 2,
            idl_source: source,
            program_id: 'prog1',
        });
    });

    it(`should emit ${prefix}_transaction_confirmed with signature`, () => {
        analytics.trackTransactionConfirmed('prog1', 'initialize', 'sig123');
        expect(mockedTrackEvent).toHaveBeenCalledWith(`${prefix}_transaction_confirmed`, {
            idl_source: source,
            instruction_name: 'initialize',
            program_id: 'prog1',
            transaction_signature: 'sig123',
        });
    });

    it(`should emit ${prefix}_transaction_failed with error message`, () => {
        analytics.trackTransactionFailed('prog1', 'initialize', 'boom');
        expect(mockedTrackEvent).toHaveBeenCalledWith(`${prefix}_transaction_failed`, {
            error_message: 'boom',
            idl_source: source,
            instruction_name: 'initialize',
            program_id: 'prog1',
        });
    });

    it(`should emit ${prefix}_transaction_simulated`, () => {
        analytics.trackTransactionSimulated('prog1', 'initialize');
        expect(mockedTrackEvent).toHaveBeenCalledWith(`${prefix}_transaction_simulated`, {
            idl_source: source,
            instruction_name: 'initialize',
            program_id: 'prog1',
        });
    });

    it(`should emit ${prefix}_transaction_submitted`, () => {
        analytics.trackTransactionSubmitted('prog1', 'initialize');
        expect(mockedTrackEvent).toHaveBeenCalledWith(`${prefix}_transaction_submitted`, {
            idl_source: source,
            instruction_name: 'initialize',
            program_id: 'prog1',
        });
    });

    it(`should emit ${prefix}_wallet_connected with wallet type`, () => {
        analytics.trackWalletConnected('prog1', 'Phantom');
        expect(mockedTrackEvent).toHaveBeenCalledWith(`${prefix}_wallet_connected`, {
            idl_source: source,
            program_id: 'prog1',
            wallet_type: 'Phantom',
        });
    });
});

describe('createIdlAnalytics (custom IDL)', () => {
    const analytics = createIdlAnalytics('Anchor', 'custom');

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should send no instruction name, section name or error text from a custom IDL', () => {
        analytics.trackSectionsExpanded('prog3', ['initialize']);
        analytics.trackTransactionConfirmed('prog3', 'initialize', 'sig1');
        analytics.trackTransactionFailed('prog3', 'initialize', 'custom error text');
        analytics.trackTransactionSimulated('prog3', 'initialize');
        analytics.trackTransactionSubmitted('prog3', 'initialize');

        expect(mockedTrackEvent.mock.calls).toEqual([
            [
                'iidl_anchor_sections_expanded',
                { expanded_sections_count: 1, idl_source: 'custom', program_id: 'prog3' },
            ],
            [
                'iidl_anchor_transaction_confirmed',
                { idl_source: 'custom', program_id: 'prog3', transaction_signature: 'sig1' },
            ],
            ['iidl_anchor_transaction_failed', { idl_source: 'custom', program_id: 'prog3' }],
            ['iidl_anchor_transaction_simulated', { idl_source: 'custom', program_id: 'prog3' }],
            ['iidl_anchor_transaction_submitted', { idl_source: 'custom', program_id: 'prog3' }],
        ]);
    });
});
