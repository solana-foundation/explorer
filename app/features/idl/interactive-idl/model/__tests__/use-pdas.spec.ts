import type { InstructionData, SupportedIdl } from '@entities/idl';
import { PublicKey } from '@solana/web3.js';
import { renderHook } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import votingIdl029 from '../__mocks__/anchor/anchor-0.29.0-voting-AXcxp15oz1L4YYtqZo6Qt6EkUj1jtLR6wXYqaJvn4oye.json';
import votingIdl030 from '../__mocks__/anchor/anchor-0.30.0-voting-AXcxp15oz1L4YYtqZo6Qt6EkUj1jtLR6wXYqaJvn4oye.json';
import votingIdl030Variations from '../__mocks__/anchor/anchor-0.30.0-voting-variations-AXcxp15oz1L4YYtqZo6Qt6EkUj1jtLR6wXYqaJvn4oye.json';
import donateIdl0301 from '../__mocks__/anchor/anchor-0.30.1-donate-DRLYxueWz6iymdsaRCER6iv6v9zL7gFWANwDL2V5VUx1.json';
import type { InstructionFormData } from '../use-instruction-form';
import { usePdas } from '../use-pdas';
import { findInstruction } from './utils';

describe('usePdas', () => {
    // Tests that work with both 0.29 and 0.30 - these don't need PDA seeds
    it.each([
        { idl: votingIdl029, instructionName: 'initializeCandidate', version: '0.29' },
        { idl: votingIdl030, instructionName: 'initialize_candidate', version: '0.30' },
    ])('should return empty object when IDL is undefined ($version)', ({ idl, instructionName }) => {
        const { createMockForm, mockInstruction, renderUsePdas } = setup(idl, instructionName);
        const form = createMockForm();

        const view = renderUsePdas({ form, idl: undefined, instruction: mockInstruction });

        expect(view.current).toEqual({});
    });

    it.each([
        { idl: votingIdl029, instructionName: 'initializeCandidate', version: '0.29' },
        { idl: votingIdl030, instructionName: 'initialize_candidate', version: '0.30' },
    ])('should return empty object when program ID is missing ($version)', ({ idl, instructionName }) => {
        const { createMockForm, mockInstruction, mockIdl, renderUsePdas } = setup(idl, instructionName);
        const form = createMockForm();
        const idlWithoutAddress = { ...mockIdl, address: undefined } as SupportedIdl;

        const view = renderUsePdas({ form, idl: idlWithoutAddress, instruction: mockInstruction });

        expect(view.current).toEqual({});
    });

    it.each([
        { idl: votingIdl029, instructionName: 'initializeCandidate', version: '0.29' },
        { idl: votingIdl030, instructionName: 'initialize_candidate', version: '0.30' },
    ])('should return empty object when instruction is not found ($version)', ({ idl, instructionName }) => {
        const { createMockForm, mockInstruction, mockIdl, renderUsePdas } = setup(idl, instructionName);
        const form = createMockForm();
        const unknownInstruction: InstructionData = { ...mockInstruction, name: 'unknownInstruction' };

        const view = renderUsePdas({ form, idl: mockIdl, instruction: unknownInstruction });

        expect(view.current).toEqual({});
    });

    // 0.29 variations tests - pda:true without seeds (backport check)
    it('should return empty object for 0.29 IDL with pda:true (no seeds)', () => {
        const { createMockForm, mockIdl, mockInstruction, renderUsePdas } = setup(votingIdl029, 'initializeCandidate');
        const form = createMockForm();
        form.setValue('arguments.initializeCandidate.pollId', '123');
        form.setValue('arguments.initializeCandidate.candidateName', 'Test');

        const view = renderUsePdas({ form, idl: mockIdl, instruction: mockInstruction });

        // 0.29 IDL has pda:true but no seeds array, so no PDAs can be generated
        expect(view.current).toEqual({});
    });

    // 0.30 tests - these need PDA seeds from 0.30 IDL
    it('should generate PDA for single seed (poll)', () => {
        const { createMockForm, mockInstruction, mockIdl, renderUsePdas } = setup(votingIdl030, 'initialize_candidate');
        const form = createMockForm();
        form.setValue('arguments.initializeCandidate.pollId', '123');

        const view = renderUsePdas({ form, idl: mockIdl, instruction: mockInstruction });

        expect(view.current.poll).toBeDefined();
        expect(view.current.poll.generated).not.toBeNull();
        expect(typeof view.current.poll.generated).toBe('string');
        expect(view.current.poll.seeds).toHaveLength(1);
        expect(view.current.poll.seeds[0]).toEqual({ name: 'pollId', value: '123' });
    });

    it('should generate PDA for multiple seeds (candidate)', () => {
        const { createMockForm, mockInstruction, mockIdl, renderUsePdas } = setup(votingIdl030, 'initialize_candidate');
        const form = createMockForm();
        form.setValue('arguments.initializeCandidate.pollId', '123');
        form.setValue('arguments.initializeCandidate.candidateName', 'Marco');

        const view = renderUsePdas({ form, idl: mockIdl, instruction: mockInstruction });

        expect(view.current.candidate).toBeDefined();
        expect(view.current.candidate.generated).not.toBeNull();
        expect(typeof view.current.candidate.generated).toBe('string');
        expect(view.current.candidate.seeds).toHaveLength(2);
        expect(view.current.candidate.seeds[0]).toEqual({ name: 'pollId', value: '123' });
        expect(view.current.candidate.seeds[1]).toEqual({ name: 'candidateName', value: 'Marco' });
    });

    it('should handle underscore prefix in argument names (_poll_id vs poll_id)', () => {
        const { createMockForm, mockInstruction, mockIdl, renderUsePdas } = setup(votingIdl030, 'initialize_candidate');
        const form = createMockForm();
        form.setValue('arguments.initializeCandidate.pollId', '456');
        form.setValue('arguments.initializeCandidate.candidateName', 'Polo');

        const view = renderUsePdas({ form, idl: mockIdl, instruction: mockInstruction });

        // Should still generate PDAs even though seed.path is "poll_id" and arg.name is "_poll_id"
        expect(view.current.poll).toBeDefined();
        expect(view.current.poll.generated).not.toBeNull();
        expect(view.current.candidate).toBeDefined();
        expect(view.current.candidate.generated).not.toBeNull();
    });

    it('should return null for PDA when required argument is missing', () => {
        const { createMockForm, mockInstruction, mockIdl, renderUsePdas } = setup(votingIdl030, 'initialize_candidate');
        const form = createMockForm();
        form.setValue('arguments.initializeCandidate.candidateName', 'Marco');
        // pollId is missing

        const view = renderUsePdas({ form, idl: mockIdl, instruction: mockInstruction });

        expect(view.current.poll.generated).toBeNull();
        expect(view.current.poll.seeds).toHaveLength(1);
        expect(view.current.poll.seeds[0]).toEqual({ name: 'pollId', value: null });
        expect(view.current.candidate.generated).toBeNull();
        expect(view.current.candidate.seeds).toHaveLength(2);
        expect(view.current.candidate.seeds[0]).toEqual({ name: 'pollId', value: null });
        expect(view.current.candidate.seeds[1]).toEqual({ name: 'candidateName', value: 'Marco' });
    });

    it('should return null for PDA when numeric argument value cannot be converted to number', () => {
        const { createMockForm, mockInstruction, mockIdl, renderUsePdas } = setup(votingIdl030, 'initialize_candidate');
        const form = createMockForm();
        form.setValue('arguments.initializeCandidate.pollId', 'invalid-number');
        form.setValue('arguments.initializeCandidate.candidateName', 'Test');

        const view = renderUsePdas({ form, idl: mockIdl, instruction: mockInstruction });

        expect(view.current.poll.generated).toBeNull();
        expect(view.current.poll.seeds).toHaveLength(1);
        expect(view.current.poll.seeds[0]).toEqual({ name: 'pollId', value: 'invalid-number' });
        expect(view.current.candidate.generated).toBeNull();
        expect(view.current.candidate.seeds).toHaveLength(2);
        expect(view.current.candidate.seeds[0]).toEqual({ name: 'pollId', value: 'invalid-number' });
        expect(view.current.candidate.seeds[1]).toEqual({ name: 'candidateName', value: 'Test' });
    });

    it('should handle different argument types (u64, string)', () => {
        const { createMockForm, mockInstruction, mockIdl, renderUsePdas } = setup(votingIdl030, 'initialize_candidate');
        const form = createMockForm();
        form.setValue('arguments.initializeCandidate.pollId', '789');
        form.setValue('arguments.initializeCandidate.candidateName', 'Marco');

        const view = renderUsePdas({ form, idl: mockIdl, instruction: mockInstruction });

        expect(view.current.poll).toBeDefined();
        expect(view.current.poll.generated).not.toBeNull();
        expect(view.current.candidate).toBeDefined();
        expect(view.current.candidate.generated).not.toBeNull();
    });

    // 0.30 variations tests - nested groups
    it('should skip nested account groups', () => {
        const { createMockForm, mockIdl, mockInstruction, renderUsePdas } = setup(
            votingIdl030Variations,
            'instruction_with_nested'
        );
        const form = createMockForm();
        form.setValue('arguments.instructionWithNested.pollId', '999');

        const view = renderUsePdas({ form, idl: mockIdl, instruction: mockInstruction });

        // Nested accounts should be skipped, so nestedAccount should not be in result
        expect(view.current.nestedAccount).toBeUndefined();
    });

    // 0.30 variations tests
    it('should handle account seeds', () => {
        const { createMockForm, mockIdl, mockInstruction, renderUsePdas } = setup(
            votingIdl030Variations,
            'instruction_with_account_seed'
        );
        const form = createMockForm();
        const accountPubkey = PublicKey.default.toString();

        form.setValue('accounts.instructionWithAccountSeed.authority', accountPubkey);

        const view = renderUsePdas({ form, idl: mockIdl, instruction: mockInstruction });

        expect(view.current.pdaAccount).toBeDefined();
        expect(view.current.pdaAccount.generated).not.toBeNull();
        expect(view.current.pdaAccount.seeds).toHaveLength(1);
        expect(view.current.pdaAccount.seeds[0]).toEqual({ name: 'authority', value: accountPubkey });
    });

    it('should handle const seeds', () => {
        const { createMockForm, mockIdl, mockInstruction, renderUsePdas } = setup(
            votingIdl030Variations,
            'instruction_with_const_seed'
        );
        const form = createMockForm();

        const view = renderUsePdas({ form, idl: mockIdl, instruction: mockInstruction });

        expect(view.current.pdaAccount).toBeDefined();
        expect(view.current.pdaAccount.generated).not.toBeNull();
        expect(view.current.pdaAccount.seeds).toHaveLength(1);
        expect(view.current.pdaAccount.seeds[0]).toEqual({ name: '0x74657374', value: '0x74657374' });
    });

    it('should return null when account seed value is missing', () => {
        const { createMockForm, mockIdl, mockInstruction, renderUsePdas } = setup(
            votingIdl030Variations,
            'instruction_with_account_seed'
        );
        const form = createMockForm();

        const view = renderUsePdas({ form, idl: mockIdl, instruction: mockInstruction });

        expect(view.current.pdaAccount.generated).toBeNull();
        expect(view.current.pdaAccount.seeds).toHaveLength(1);
        expect(view.current.pdaAccount.seeds[0]).toEqual({ name: 'authority', value: null });
    });

    describe('donate IDL (close_donation_epoch_v1)', () => {
        const DONATE_KEY = 'closeDonationEpochV1';
        const { createMockForm, mockIdl, mockInstruction, renderUsePdas } = setup(
            donateIdl0301,
            'close_donation_epoch_v1'
        );

        function runDonateTest(formValues: { accounts?: Record<string, string>; arguments?: Record<string, string> }) {
            const form = createMockForm();
            for (const [key, val] of Object.entries(formValues.accounts ?? {})) {
                form.setValue(`accounts.${DONATE_KEY}.${key}`, val);
            }
            for (const [key, val] of Object.entries(formValues.arguments ?? {})) {
                form.setValue(`arguments.${DONATE_KEY}.${key}`, val);
            }
            return renderUsePdas({ form, idl: mockIdl, instruction: mockInstruction }).current;
        }

        it('generates PDA for account seeds (debouncer, tokenProgram, mint)', () => {
            const pdas = runDonateTest({
                accounts: {
                    debouncer: '11111111111111111111111111111111',
                    mint: PublicKey.default.toString(),
                    tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                },
            });
            expect(pdas.debouncerTokenAccount?.generated).toBeTruthy();
            expect(pdas.debouncerTokenAccount?.seeds).toHaveLength(3);
            expect(pdas.debouncerTokenAccount?.seeds[0].name).toBe('debouncer');
            expect(pdas.debouncerTokenAccount?.seeds[2].name).toBe('mint');
        });

        it('generates distribution, epochTracker, debouncer PDAs when config_id (hex) and epoch are set', () => {
            const configId = '0'.repeat(64);
            const mint = PublicKey.default.toString();
            const pdas = runDonateTest({
                accounts: { mint },
                arguments: { configId, epoch: '1' },
            });
            for (const key of ['distribution', 'epochTracker', 'debouncer']) {
                expect(pdas[key].generated).toBeTruthy();
                expect(pdas[key].seeds.find(s => s.name === 'configId')?.value).toBe(configId);
                expect(pdas[key].seeds.find(s => s.name === 'mint')?.value).toBe(mint);
            }
            expect(pdas.distribution.seeds.find(s => s.name === 'epoch')?.value).toBe('1');
        });

        it('generates PDAs when config_id is comma-separated u8 bytes', () => {
            const pdas = runDonateTest({
                accounts: { mint: PublicKey.default.toString() },
                arguments: { configId: Array(32).fill(0).join(', '), epoch: '42' },
            });
            expect(pdas.distribution.generated).toBeTruthy();
            expect(pdas.epochTracker.generated).toBeTruthy();
            expect(pdas.debouncer.generated).toBeTruthy();
        });

        it('returns null for distribution/epochTracker/debouncer when config_id is missing', () => {
            const pdas = runDonateTest({
                accounts: { mint: PublicKey.default.toString() },
                arguments: { epoch: '1' },
            });
            for (const key of ['distribution', 'epochTracker', 'debouncer']) {
                expect(pdas[key].generated).toBeNull();
                expect(pdas[key].seeds.find(s => s.name === 'configId')?.value).toBeNull();
            }
        });
    });

    // 0.30 tests - these need 0.30 IDL for PDA seeds
    it('should skip accounts without PDA', () => {
        const { createMockForm, mockIdl, mockInstruction, renderUsePdas } = setup(votingIdl030, 'initialize_candidate');
        const form = createMockForm();
        form.setValue('arguments.initializeCandidate.pollId', '123');
        form.setValue('arguments.initializeCandidate.candidateName', 'Eve');

        const view = renderUsePdas({ form, idl: mockIdl, instruction: mockInstruction });

        // signer account should not be in result since it doesn't have PDA
        expect(view.current.signer).toBeUndefined();
        // Only PDA accounts should be present
        expect(view.current.poll).toBeDefined();
        expect(view.current.poll.generated).not.toBeNull();
        expect(view.current.candidate).toBeDefined();
        expect(view.current.candidate.generated).not.toBeNull();
    });

    it('should generate consistent PDA addresses for same inputs', () => {
        const { createMockForm, mockIdl, mockInstruction, renderUsePdas } = setup(votingIdl030, 'initialize_candidate');
        const form = createMockForm();
        form.setValue('arguments.initializeCandidate.pollId', '123');
        form.setValue('arguments.initializeCandidate.candidateName', 'Frank');

        const { current: first } = renderUsePdas({ form, idl: mockIdl, instruction: mockInstruction });
        const { current: second } = renderUsePdas({ form, idl: mockIdl, instruction: mockInstruction });

        expect(first.poll.generated).toBe(second.poll.generated);
        expect(first.candidate.generated).toBe(second.candidate.generated);
    });
});

function setup(idl: unknown, instructionName: string) {
    const mockIdl = idl as SupportedIdl;
    const mockInstruction = findInstruction(idl, instructionName)!;

    const createMockForm = () => {
        return renderHook(() =>
            useForm<InstructionFormData>({
                defaultValues: { accounts: {}, arguments: {} },
            })
        ).result.current;
    };

    const renderUsePdas = (params: Parameters<typeof usePdas>[0]) => {
        return renderHook(() => usePdas(params)).result;
    };

    return { createMockForm, mockIdl, mockInstruction, renderUsePdas };
}
