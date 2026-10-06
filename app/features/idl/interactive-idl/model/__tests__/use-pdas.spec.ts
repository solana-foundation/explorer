// @vitest-environment jsdom

import type { InstructionData, SupportedIdl } from '@entities/idl';
import { PublicKey } from '@solana/web3.js';
import { act, renderHook } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { invariant } from '@/app/shared/lib/invariant';
import { Logger } from '@/app/shared/lib/logger';

import votingIdl029 from '../__mocks__/anchor/anchor-0.29.0-voting-AXcxp15oz1L4YYtqZo6Qt6EkUj1jtLR6wXYqaJvn4oye.json';
import votingIdl030 from '../__mocks__/anchor/anchor-0.30.0-voting-AXcxp15oz1L4YYtqZo6Qt6EkUj1jtLR6wXYqaJvn4oye.json';
import votingIdl030Variations from '../__mocks__/anchor/anchor-0.30.0-voting-variations-AXcxp15oz1L4YYtqZo6Qt6EkUj1jtLR6wXYqaJvn4oye.json';
import donateIdl0301 from '../__mocks__/anchor/anchor-0.30.1-donate-DRLYxueWz6iymdsaRCER6iv6v9zL7gFWANwDL2V5VUx1.json';
import codamaVotingIdl from '../__mocks__/codama/codama-voting.json';
import { computePdas } from '../pda-generator/compute-pdas';
import type { InstructionFormData } from '../use-instruction-form';
import { usePdas } from '../use-pdas';
import { findInstruction } from './utils';

describe('usePdas', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('should compute PDAs from form values after the debounce delay', async () => {
        const { idl, instruction } = setup(votingIdl030, 'initialize_candidate');
        const form = createForm();
        form.setValue('arguments.initializeCandidate.pollId', '123');
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

        const { result } = renderHook(() => usePdas({ form, idl, instruction }));

        await act(() => vi.advanceTimersByTimeAsync(149));
        expect(result.current).toEqual({});
        await act(() => vi.advanceTimersByTimeAsync(1));
        expect(result.current.poll.generated).toEqual(expect.any(String));
        expect(result.current).toEqual(await computePdas(idl, instruction, form.getValues()));
    });

    it('should log and return empty object when PDA computation fails', async () => {
        const { instruction } = setup(codamaVotingIdl, 'initializeCandidate');
        const idlWithoutKey = {
            ...codamaVotingIdl,
            program: { ...codamaVotingIdl.program, publicKey: '' },
        } as unknown as SupportedIdl;
        const form = createForm();
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

        const { result } = renderHook(() => usePdas({ form, idl: idlWithoutKey, instruction }));
        await act(() => vi.advanceTimersByTimeAsync(150));

        expect(vi.mocked(Logger.error)).toHaveBeenCalledWith(expect.any(Error), {
            message: 'Failed to compute PDAs',
        });
        expect(result.current).toEqual({});
    });
});

describe('computePdas', () => {
    // Tests that work with both 0.29 and 0.30 - these don't need PDA seeds
    it.each([
        { idl: votingIdl029, instructionName: 'initializeCandidate', version: '0.29' },
        { idl: votingIdl030, instructionName: 'initialize_candidate', version: '0.30' },
    ])('should return empty object when IDL is undefined ($version)', async ({ idl, instructionName }) => {
        const { instruction } = setup(idl, instructionName);

        await expect(computePdas(undefined, instruction, {})).resolves.toEqual({});
    });

    it.each([
        { idl: votingIdl029, instructionName: 'initializeCandidate', version: '0.29' },
        { idl: votingIdl030, instructionName: 'initialize_candidate', version: '0.30' },
    ])('should return empty object when program ID is missing ($version)', async ({ idl, instructionName }) => {
        const { idl: supportedIdl, instruction } = setup(idl, instructionName);
        const idlWithoutAddress = { ...supportedIdl, address: undefined } as SupportedIdl;

        await expect(computePdas(idlWithoutAddress, instruction, {})).resolves.toEqual({});
    });

    it.each([
        { idl: votingIdl029, instructionName: 'initializeCandidate', version: '0.29' },
        { idl: votingIdl030, instructionName: 'initialize_candidate', version: '0.30' },
    ])('should return empty object when instruction is not found ($version)', async ({ idl, instructionName }) => {
        const { idl: supportedIdl, instruction } = setup(idl, instructionName);
        const unknownInstruction: InstructionData = { ...instruction, name: 'unknownInstruction' };

        await expect(computePdas(supportedIdl, unknownInstruction, {})).resolves.toEqual({});
    });

    // 0.29 variations tests - pda:true without seeds (backport check)
    it('should return empty object for 0.29 IDL with pda:true (no seeds)', async () => {
        const pdas = await pdasFor(votingIdl029, 'initializeCandidate', {
            arguments: { candidateName: 'Test', pollId: '123' },
        });

        expect(pdas).toEqual({});
    });

    // 0.30 tests - these need PDA seeds from 0.30 IDL
    it('should generate PDA for single seed (poll)', async () => {
        const pdas = await pdasFor(votingIdl030, 'initialize_candidate', { arguments: { pollId: '123' } });

        expect(pdas.poll.generated).not.toBeNull();
        expect(typeof pdas.poll.generated).toBe('string');
        expect(pdas.poll.seeds).toHaveLength(1);
        expect(pdas.poll.seeds[0]).toEqual({ name: 'pollId', value: '123' });
    });

    it('should generate PDA for multiple seeds (candidate)', async () => {
        const pdas = await pdasFor(votingIdl030, 'initialize_candidate', {
            arguments: { candidateName: 'Marco', pollId: '123' },
        });

        expect(pdas.candidate.generated).not.toBeNull();
        expect(typeof pdas.candidate.generated).toBe('string');
        expect(pdas.candidate.seeds).toHaveLength(2);
        expect(pdas.candidate.seeds[0]).toEqual({ name: 'pollId', value: '123' });
        expect(pdas.candidate.seeds[1]).toEqual({ name: 'candidateName', value: 'Marco' });
    });

    it('should handle underscore prefix in argument names (_poll_id vs poll_id)', async () => {
        const pdas = await pdasFor(votingIdl030, 'initialize_candidate', {
            arguments: { candidateName: 'Polo', pollId: '456' },
        });

        // Should still generate PDAs even though seed.path is "poll_id" and arg.name is "_poll_id"
        expect(pdas.poll.generated).not.toBeNull();
        expect(pdas.candidate.generated).not.toBeNull();
    });

    it('should return null for PDA when required argument is missing', async () => {
        const pdas = await pdasFor(votingIdl030, 'initialize_candidate', { arguments: { candidateName: 'Marco' } });

        expect(pdas.poll.generated).toBeNull();
        expect(pdas.poll.seeds).toHaveLength(1);
        expect(pdas.poll.seeds[0]).toEqual({ name: 'pollId', value: null });
        expect(pdas.candidate.generated).toBeNull();
        expect(pdas.candidate.seeds).toHaveLength(2);
        expect(pdas.candidate.seeds[0]).toEqual({ name: 'pollId', value: null });
        expect(pdas.candidate.seeds[1]).toEqual({ name: 'candidateName', value: 'Marco' });
    });

    it('should return null for PDA when numeric argument value cannot be converted to number', async () => {
        const pdas = await pdasFor(votingIdl030, 'initialize_candidate', {
            arguments: { candidateName: 'Test', pollId: 'invalid-number' },
        });

        expect(pdas.poll.generated).toBeNull();
        expect(pdas.poll.seeds).toHaveLength(1);
        expect(pdas.poll.seeds[0]).toEqual({ name: 'pollId', value: 'invalid-number' });
        expect(pdas.candidate.generated).toBeNull();
        expect(pdas.candidate.seeds).toHaveLength(2);
        expect(pdas.candidate.seeds[0]).toEqual({ name: 'pollId', value: 'invalid-number' });
        expect(pdas.candidate.seeds[1]).toEqual({ name: 'candidateName', value: 'Test' });
    });

    it('should handle different argument types (u64, string)', async () => {
        const pdas = await pdasFor(votingIdl030, 'initialize_candidate', {
            arguments: { candidateName: 'Marco', pollId: '789' },
        });

        expect(pdas.poll.generated).not.toBeNull();
        expect(pdas.candidate.generated).not.toBeNull();
    });

    // 0.30 variations tests - nested groups
    it('should skip nested account groups', async () => {
        const pdas = await pdasFor(votingIdl030Variations, 'instruction_with_nested', { arguments: { pollId: '999' } });

        expect(Object.keys(pdas)).toEqual(['poll']);
        expect(pdas.poll.generated).toEqual(expect.any(String));
    });

    // 0.30 variations tests
    it('should handle account seeds', async () => {
        const accountPubkey = PublicKey.default.toString();
        const pdas = await pdasFor(votingIdl030Variations, 'instruction_with_account_seed', {
            accounts: { authority: accountPubkey },
        });

        expect(pdas.pdaAccount.generated).not.toBeNull();
        expect(pdas.pdaAccount.seeds).toHaveLength(1);
        expect(pdas.pdaAccount.seeds[0]).toEqual({ name: 'authority', value: accountPubkey });
    });

    it('should handle const seeds', async () => {
        const pdas = await pdasFor(votingIdl030Variations, 'instruction_with_const_seed');

        expect(pdas.pdaAccount.generated).not.toBeNull();
        expect(pdas.pdaAccount.seeds).toHaveLength(1);
        expect(pdas.pdaAccount.seeds[0]).toEqual({ name: '0x74657374', value: '0x74657374' });
    });

    it('should return null when account seed value is missing', async () => {
        const pdas = await pdasFor(votingIdl030Variations, 'instruction_with_account_seed');

        expect(pdas.pdaAccount.generated).toBeNull();
        expect(pdas.pdaAccount.seeds).toHaveLength(1);
        expect(pdas.pdaAccount.seeds[0]).toEqual({ name: 'authority', value: null });
    });

    describe('donate IDL (close_donation_epoch_v1)', () => {
        const runDonateTest = (formValues: FormValues) => pdasFor(donateIdl0301, 'close_donation_epoch_v1', formValues);

        it('should generate PDA for account seeds (debouncer, tokenProgram, mint)', async () => {
            const pdas = await runDonateTest({
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

        it('should generate distribution, epochTracker, debouncer PDAs when config_id (hex) and epoch are set', async () => {
            const configId = '0'.repeat(64);
            const mint = PublicKey.default.toString();
            const pdas = await runDonateTest({
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

        it('should generate PDAs when config_id is comma-separated u8 bytes', async () => {
            const pdas = await runDonateTest({
                accounts: { mint: PublicKey.default.toString() },
                arguments: { configId: Array(32).fill(0).join(', '), epoch: '42' },
            });
            expect(pdas.distribution.generated).toBeTruthy();
            expect(pdas.epochTracker.generated).toBeTruthy();
            expect(pdas.debouncer.generated).toBeTruthy();
        });

        it('should return null for distribution/epochTracker/debouncer when config_id is missing', async () => {
            const pdas = await runDonateTest({
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
    it('should skip accounts without PDA', async () => {
        const pdas = await pdasFor(votingIdl030, 'initialize_candidate', {
            arguments: { candidateName: 'Eve', pollId: '123' },
        });

        // signer account should not be in result since it doesn't have PDA
        expect(pdas.signer).toBeUndefined();
        // Only PDA accounts should be present
        expect(pdas.poll.generated).not.toBeNull();
        expect(pdas.candidate.generated).not.toBeNull();
    });

    it('should generate consistent PDA addresses for same inputs', async () => {
        const formValues = { arguments: { candidateName: 'Frank', pollId: '123' } };
        const pdas = await pdasFor(votingIdl030, 'initialize_candidate', formValues);
        const pdas2 = await pdasFor(votingIdl030, 'initialize_candidate', formValues);

        expect(pdas.poll.generated).not.toBeNull();
        expect(pdas2.poll.generated).not.toBeNull();
        expect(pdas.poll.generated).toBe(pdas2.poll.generated);
        expect(pdas.candidate.generated).toBe(pdas2.candidate.generated);
    });

    it('should route a Codama IDL to the Codama provider', async () => {
        const pdas = await pdasFor(codamaVotingIdl, 'initializeCandidate', {
            arguments: { candidateName: 'Marco', pollId: '123' },
        });

        expect(pdas.candidate.generated).toEqual(expect.any(String));
        expect(pdas.candidate.seeds).toEqual([
            { name: 'pollId', value: '123' },
            { name: 'candidateName', value: 'Marco' },
        ]);
    });
});

type FormValues = { accounts?: Record<string, string>; arguments?: Record<string, string> };

function pdasFor(idl: unknown, instructionName: string, formValues: FormValues = {}) {
    const { idl: supportedIdl, instruction } = setup(idl, instructionName);
    return computePdas(supportedIdl, instruction, {
        accounts: { [instruction.name]: formValues.accounts ?? {} },
        arguments: { [instruction.name]: formValues.arguments ?? {} },
    });
}

function createForm() {
    return renderHook(() => useForm<InstructionFormData>({ defaultValues: { accounts: {}, arguments: {} } })).result
        .current;
}

function setup(idl: unknown, instructionName: string) {
    const instruction = findInstruction(idl, instructionName);
    invariant(instruction, `instruction ${instructionName} not found in IDL fixture`);
    return { idl: idl as SupportedIdl, instruction };
}
