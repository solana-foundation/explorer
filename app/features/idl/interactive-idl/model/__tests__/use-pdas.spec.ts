import type { InstructionData, SupportedIdl } from '@entities/idl';
import { PublicKey } from '@solana/web3.js';
import { renderHook } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import votingIdl029 from '../__mocks__/anchor/anchor-0.29.0-voting-AXcxp15oz1L4YYtqZo6Qt6EkUj1jtLR6wXYqaJvn4oye.json';
import votingIdl030 from '../__mocks__/anchor/anchor-0.30.0-voting-AXcxp15oz1L4YYtqZo6Qt6EkUj1jtLR6wXYqaJvn4oye.json';
import votingIdl030Variations from '../__mocks__/anchor/anchor-0.30.0-voting-variations-AXcxp15oz1L4YYtqZo6Qt6EkUj1jtLR6wXYqaJvn4oye.json';
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

        const result = renderUsePdas({ form, idl: undefined, instruction: mockInstruction });

        expect(result.current).toEqual({});
    });

    it.each([
        { idl: votingIdl029, instructionName: 'initializeCandidate', version: '0.29' },
        { idl: votingIdl030, instructionName: 'initialize_candidate', version: '0.30' },
    ])('should return empty object when program ID is missing ($version)', ({ idl, instructionName }) => {
        const { createMockForm, mockInstruction, mockIdl, renderUsePdas } = setup(idl, instructionName);
        const form = createMockForm();
        const idlWithoutAddress = { ...mockIdl, address: undefined } as SupportedIdl;

        const result = renderUsePdas({ form, idl: idlWithoutAddress, instruction: mockInstruction });

        expect(result.current).toEqual({});
    });

    it.each([
        { idl: votingIdl029, instructionName: 'initializeCandidate', version: '0.29' },
        { idl: votingIdl030, instructionName: 'initialize_candidate', version: '0.30' },
    ])('should return empty object when instruction is not found ($version)', ({ idl, instructionName }) => {
        const { createMockForm, mockInstruction, mockIdl, renderUsePdas } = setup(idl, instructionName);
        const form = createMockForm();
        const unknownInstruction: InstructionData = { ...mockInstruction, name: 'unknownInstruction' };

        const result = renderUsePdas({ form, idl: mockIdl, instruction: unknownInstruction });

        expect(result.current).toEqual({});
    });

    // 0.29 variations tests - pda:true without seeds (backport check)
    it('should return empty object for 0.29 IDL with pda:true (no seeds)', () => {
        const { createMockForm, mockIdl, mockInstruction, renderUsePdas } = setup(votingIdl029, 'initializeCandidate');
        const form = createMockForm();
        form.setValue('arguments.initializeCandidate.pollId', '123');
        form.setValue('arguments.initializeCandidate.candidateName', 'Test');

        const result = renderUsePdas({ form, idl: mockIdl, instruction: mockInstruction });

        // 0.29 IDL has pda:true but no seeds array, so no PDAs can be generated
        expect(result.current).toEqual({});
    });

    // 0.30 tests - these need PDA seeds from 0.30 IDL
    it('should generate PDA for single seed (poll)', () => {
        const { createMockForm, mockInstruction, mockIdl, renderUsePdas } = setup(votingIdl030, 'initialize_candidate');
        const form = createMockForm();
        form.setValue('arguments.initializeCandidate.pollId', '123');

        const result = renderUsePdas({ form, idl: mockIdl, instruction: mockInstruction });

        expect(result.current.poll).toBeDefined();
        expect(result.current.poll.generated).not.toBeNull();
        expect(typeof result.current.poll.generated).toBe('string');
        expect(result.current.poll.seeds).toHaveLength(1);
        expect(result.current.poll.seeds[0]).toEqual({ name: 'pollId', value: '123' });
    });

    it('should generate PDA for multiple seeds (candidate)', () => {
        const { createMockForm, mockInstruction, mockIdl, renderUsePdas } = setup(votingIdl030, 'initialize_candidate');
        const form = createMockForm();
        form.setValue('arguments.initializeCandidate.pollId', '123');
        form.setValue('arguments.initializeCandidate.candidateName', 'Alice');

        const result = renderUsePdas({ form, idl: mockIdl, instruction: mockInstruction });

        expect(result.current.candidate).toBeDefined();
        expect(result.current.candidate.generated).not.toBeNull();
        expect(typeof result.current.candidate.generated).toBe('string');
        expect(result.current.candidate.seeds).toHaveLength(2);
        expect(result.current.candidate.seeds[0]).toEqual({ name: 'pollId', value: '123' });
        expect(result.current.candidate.seeds[1]).toEqual({ name: 'candidateName', value: 'Alice' });
    });

    it('should handle underscore prefix in argument names (_poll_id vs poll_id)', () => {
        const { createMockForm, mockInstruction, mockIdl, renderUsePdas } = setup(votingIdl030, 'initialize_candidate');
        const form = createMockForm();
        form.setValue('arguments.initializeCandidate.pollId', '456');
        form.setValue('arguments.initializeCandidate.candidateName', 'Bob');

        const result = renderUsePdas({ form, idl: mockIdl, instruction: mockInstruction });

        // Should still generate PDAs even though seed.path is "poll_id" and arg.name is "_poll_id"
        expect(result.current.poll).toBeDefined();
        expect(result.current.poll.generated).not.toBeNull();
        expect(result.current.candidate).toBeDefined();
        expect(result.current.candidate.generated).not.toBeNull();
    });

    it('should return null for PDA when required argument is missing', () => {
        const { createMockForm, mockInstruction, mockIdl, renderUsePdas } = setup(votingIdl030, 'initialize_candidate');
        const form = createMockForm();
        form.setValue('arguments.initializeCandidate.candidateName', 'Charlie');
        // pollId is missing

        const result = renderUsePdas({ form, idl: mockIdl, instruction: mockInstruction });

        expect(result.current.poll.generated).toBeNull();
        expect(result.current.poll.seeds).toHaveLength(1);
        expect(result.current.poll.seeds[0]).toEqual({ name: 'pollId', value: null });
        expect(result.current.candidate.generated).toBeNull();
        expect(result.current.candidate.seeds).toHaveLength(2);
        expect(result.current.candidate.seeds[0]).toEqual({ name: 'pollId', value: null });
        expect(result.current.candidate.seeds[1]).toEqual({ name: 'candidateName', value: 'Charlie' });
    });

    it('should return null for PDA when numeric argument value cannot be converted to number', () => {
        const { createMockForm, mockInstruction, mockIdl, renderUsePdas } = setup(votingIdl030, 'initialize_candidate');
        const form = createMockForm();
        form.setValue('arguments.initializeCandidate.pollId', 'invalid-number');
        form.setValue('arguments.initializeCandidate.candidateName', 'Test');

        const result = renderUsePdas({ form, idl: mockIdl, instruction: mockInstruction });

        expect(result.current.poll.generated).toBeNull();
        expect(result.current.poll.seeds).toHaveLength(1);
        expect(result.current.poll.seeds[0]).toEqual({ name: 'pollId', value: 'invalid-number' });
        expect(result.current.candidate.generated).toBeNull();
        expect(result.current.candidate.seeds).toHaveLength(2);
        expect(result.current.candidate.seeds[0]).toEqual({ name: 'pollId', value: 'invalid-number' });
        expect(result.current.candidate.seeds[1]).toEqual({ name: 'candidateName', value: 'Test' });
    });

    it('should handle different argument types (u64, string)', () => {
        const { createMockForm, mockInstruction, mockIdl, renderUsePdas } = setup(votingIdl030, 'initialize_candidate');
        const form = createMockForm();
        form.setValue('arguments.initializeCandidate.pollId', '789');
        form.setValue('arguments.initializeCandidate.candidateName', 'David');

        const result = renderUsePdas({ form, idl: mockIdl, instruction: mockInstruction });

        expect(result.current.poll).toBeDefined();
        expect(result.current.poll.generated).not.toBeNull();
        expect(result.current.candidate).toBeDefined();
        expect(result.current.candidate.generated).not.toBeNull();
    });

    // 0.30 variations tests - nested groups
    it('should skip nested account groups', () => {
        const { createMockForm, mockIdl, mockInstruction, renderUsePdas } = setup(
            votingIdl030Variations,
            'instruction_with_nested'
        );
        const form = createMockForm();
        form.setValue('arguments.instructionWithNested.pollId', '999');

        const result = renderUsePdas({ form, idl: mockIdl, instruction: mockInstruction });

        // Nested accounts should be skipped, so nestedAccount should not be in result
        expect(result.current.nestedAccount).toBeUndefined();
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

        const result = renderUsePdas({ form, idl: mockIdl, instruction: mockInstruction });

        expect(result.current.pdaAccount).toBeDefined();
        expect(result.current.pdaAccount.generated).not.toBeNull();
        expect(result.current.pdaAccount.seeds).toHaveLength(1);
        expect(result.current.pdaAccount.seeds[0]).toEqual({ name: 'authority', value: accountPubkey });
    });

    it('should handle const seeds', () => {
        const { createMockForm, mockIdl, mockInstruction, renderUsePdas } = setup(
            votingIdl030Variations,
            'instruction_with_const_seed'
        );
        const form = createMockForm();

        const result = renderUsePdas({ form, idl: mockIdl, instruction: mockInstruction });

        expect(result.current.pdaAccount).toBeDefined();
        expect(result.current.pdaAccount.generated).not.toBeNull();
        expect(result.current.pdaAccount.seeds).toHaveLength(1);
        expect(result.current.pdaAccount.seeds[0]).toEqual({ name: '0x74657374', value: '0x74657374' });
    });

    it('should return null when account seed value is missing', () => {
        const { createMockForm, mockIdl, mockInstruction, renderUsePdas } = setup(
            votingIdl030Variations,
            'instruction_with_account_seed'
        );
        const form = createMockForm();

        const result = renderUsePdas({ form, idl: mockIdl, instruction: mockInstruction });

        expect(result.current.pdaAccount.generated).toBeNull();
        expect(result.current.pdaAccount.seeds).toHaveLength(1);
        expect(result.current.pdaAccount.seeds[0]).toEqual({ name: 'authority', value: null });
    });

    // 0.30 tests - these need 0.30 IDL for PDA seeds
    it('should skip accounts without PDA', () => {
        const { createMockForm, mockIdl, mockInstruction, renderUsePdas } = setup(votingIdl030, 'initialize_candidate');
        const form = createMockForm();
        form.setValue('arguments.initializeCandidate.pollId', '123');
        form.setValue('arguments.initializeCandidate.candidateName', 'Eve');

        const result = renderUsePdas({ form, idl: mockIdl, instruction: mockInstruction });

        // signer account should not be in result since it doesn't have PDA
        expect(result.current.signer).toBeUndefined();
        // Only PDA accounts should be present
        expect(result.current.poll).toBeDefined();
        expect(result.current.poll.generated).not.toBeNull();
        expect(result.current.candidate).toBeDefined();
        expect(result.current.candidate.generated).not.toBeNull();
    });

    it('should generate consistent PDA addresses for same inputs', () => {
        const { createMockForm, mockIdl, mockInstruction, renderUsePdas } = setup(votingIdl030, 'initialize_candidate');
        const form = createMockForm();
        form.setValue('arguments.initializeCandidate.pollId', '123');
        form.setValue('arguments.initializeCandidate.candidateName', 'Frank');

        const result1 = renderUsePdas({ form, idl: mockIdl, instruction: mockInstruction });
        const result2 = renderUsePdas({ form, idl: mockIdl, instruction: mockInstruction });

        expect(result1.current.poll.generated).toBe(result2.current.poll.generated);
        expect(result1.current.candidate.generated).toBe(result2.current.candidate.generated);
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
