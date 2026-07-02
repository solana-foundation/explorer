import { afterEach, describe, expect, it, vi } from 'vitest';

import { trackEvent } from '@/app/shared/lib/analytics';

import { createIdlAnalytics, trackIdlViewed } from './analytics';

vi.mock('@/app/shared/lib/analytics', () => ({
    trackEvent: vi.fn(),
}));

const mockedTrackEvent = vi.mocked(trackEvent);

describe('trackIdlViewed', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should emit iidl_anchor_idl_viewed for Anchor standard', () => {
        trackIdlViewed('Anchor', 'prog1');
        expect(mockedTrackEvent).toHaveBeenCalledWith('iidl_anchor_idl_viewed', {
            program_id: 'prog1',
        });
    });

    it('should emit iidl_codama_idl_viewed for Codama standard', () => {
        trackIdlViewed('Codama', 'prog2');
        expect(mockedTrackEvent).toHaveBeenCalledWith('iidl_codama_idl_viewed', {
            program_id: 'prog2',
        });
    });
});

describe('createIdlAnalytics', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Anchor standard', () => {
        const analytics = createIdlAnalytics('Anchor');

        it('should emit iidl_anchor_tab_opened on trackTabOpened', () => {
            analytics.trackTabOpened('prog1');
            expect(mockedTrackEvent).toHaveBeenCalledWith('iidl_anchor_tab_opened', { program_id: 'prog1' });
        });

        it('should emit iidl_anchor_sections_expanded with joined sections and count', () => {
            analytics.trackSectionsExpanded('prog1', ['accounts', 'args']);
            expect(mockedTrackEvent).toHaveBeenCalledWith('iidl_anchor_sections_expanded', {
                expanded_sections: 'accounts,args',
                expanded_sections_count: 2,
                program_id: 'prog1',
            });
        });

        it('should emit iidl_anchor_transaction_confirmed with signature', () => {
            analytics.trackTransactionConfirmed('prog1', 'initialize', 'sig123');
            expect(mockedTrackEvent).toHaveBeenCalledWith('iidl_anchor_transaction_confirmed', {
                instruction_name: 'initialize',
                program_id: 'prog1',
                transaction_signature: 'sig123',
            });
        });

        it('should emit iidl_anchor_transaction_failed with error message', () => {
            analytics.trackTransactionFailed('prog1', 'initialize', 'boom');
            expect(mockedTrackEvent).toHaveBeenCalledWith('iidl_anchor_transaction_failed', {
                error_message: 'boom',
                instruction_name: 'initialize',
                program_id: 'prog1',
            });
        });

        it('should emit iidl_anchor_transaction_simulated', () => {
            analytics.trackTransactionSimulated('prog1', 'initialize');
            expect(mockedTrackEvent).toHaveBeenCalledWith('iidl_anchor_transaction_simulated', {
                instruction_name: 'initialize',
                program_id: 'prog1',
            });
        });

        it('should emit iidl_anchor_transaction_submitted', () => {
            analytics.trackTransactionSubmitted('prog1', 'initialize');
            expect(mockedTrackEvent).toHaveBeenCalledWith('iidl_anchor_transaction_submitted', {
                instruction_name: 'initialize',
                program_id: 'prog1',
            });
        });

        it('should emit iidl_anchor_wallet_connected with wallet type', () => {
            analytics.trackWalletConnected('prog1', 'Phantom');
            expect(mockedTrackEvent).toHaveBeenCalledWith('iidl_anchor_wallet_connected', {
                program_id: 'prog1',
                wallet_type: 'Phantom',
            });
        });
    });

    describe('Codama standard', () => {
        const analytics = createIdlAnalytics('Codama');

        it('should emit iidl_codama_tab_opened on trackTabOpened', () => {
            analytics.trackTabOpened('prog2');
            expect(mockedTrackEvent).toHaveBeenCalledWith('iidl_codama_tab_opened', { program_id: 'prog2' });
        });

        it('should emit iidl_codama_sections_expanded with joined sections and count', () => {
            analytics.trackSectionsExpanded('prog2', ['accounts']);
            expect(mockedTrackEvent).toHaveBeenCalledWith('iidl_codama_sections_expanded', {
                expanded_sections: 'accounts',
                expanded_sections_count: 1,
                program_id: 'prog2',
            });
        });

        it('should emit iidl_codama_transaction_confirmed with signature', () => {
            analytics.trackTransactionConfirmed('prog2', 'transfer', 'sig999');
            expect(mockedTrackEvent).toHaveBeenCalledWith('iidl_codama_transaction_confirmed', {
                instruction_name: 'transfer',
                program_id: 'prog2',
                transaction_signature: 'sig999',
            });
        });

        it('should emit iidl_codama_transaction_failed with error message', () => {
            analytics.trackTransactionFailed('prog2', 'transfer', 'nope');
            expect(mockedTrackEvent).toHaveBeenCalledWith('iidl_codama_transaction_failed', {
                error_message: 'nope',
                instruction_name: 'transfer',
                program_id: 'prog2',
            });
        });

        it('should emit iidl_codama_transaction_simulated', () => {
            analytics.trackTransactionSimulated('prog2', 'transfer');
            expect(mockedTrackEvent).toHaveBeenCalledWith('iidl_codama_transaction_simulated', {
                instruction_name: 'transfer',
                program_id: 'prog2',
            });
        });

        it('should emit iidl_codama_transaction_submitted', () => {
            analytics.trackTransactionSubmitted('prog2', 'transfer');
            expect(mockedTrackEvent).toHaveBeenCalledWith('iidl_codama_transaction_submitted', {
                instruction_name: 'transfer',
                program_id: 'prog2',
            });
        });

        it('should emit iidl_codama_wallet_connected with wallet type', () => {
            analytics.trackWalletConnected('prog2', 'Solflare');
            expect(mockedTrackEvent).toHaveBeenCalledWith('iidl_codama_wallet_connected', {
                program_id: 'prog2',
                wallet_type: 'Solflare',
            });
        });
    });
});
