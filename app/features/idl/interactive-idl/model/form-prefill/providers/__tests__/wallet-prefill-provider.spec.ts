import type { InstructionAccountData, InstructionData, NestedInstructionAccountsData } from '@entities/idl';
import { Keypair, PublicKey } from '@solana/web3.js';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useInstructionForm } from '../../../use-instruction-form';
import { createWalletPrefillDependency } from '../wallet-prefill-provider';

const PREFILLED_ADDRESS = Keypair.generate().publicKey.toBase58();

const SIGNER_ACCOUNT: InstructionAccountData = {
    docs: [],
    name: 'signer',
    optional: false,
    signer: true,
};

const NON_SIGNER_ACCOUNT: InstructionAccountData = {
    docs: [],
    name: 'nonSigner',
    optional: false,
    signer: false,
};

const NESTED_SIGNER_GROUP: NestedInstructionAccountsData = {
    accounts: [
        {
            docs: [],
            name: 'nestedSigner',
            optional: false,
            signer: true,
        },
    ],
    name: 'group',
};

const INSTRUCTION_WITH_SIGNER: InstructionData = {
    accounts: [SIGNER_ACCOUNT],
    args: [],
    docs: [],
    name: 'testInstruction',
};

const INSTRUCTION_WITH_SIGNER_AND_NON_SIGNER: InstructionData = {
    accounts: [SIGNER_ACCOUNT, NON_SIGNER_ACCOUNT],
    args: [],
    docs: [],
    name: 'testInstruction',
};

const INSTRUCTION_WITH_NESTED_SIGNER: InstructionData = {
    accounts: [NESTED_SIGNER_GROUP],
    args: [],
    docs: [],
    name: 'testInstruction',
};

const INSTRUCTION_WITH_TWO_SIGNERS: InstructionData = {
    accounts: [
        { ...SIGNER_ACCOUNT, name: 'signer1' },
        { ...SIGNER_ACCOUNT, name: 'signer2' },
    ],
    args: [],
    docs: [],
    name: 'testInstruction',
};

const EMPTY_INSTRUCTION: InstructionData = {
    accounts: [],
    args: [],
    docs: [],
    name: 'testInstruction',
};

describe('createWalletPrefillDependency', () => {
    it('should fill signer accounts with wallet address', () => {
        const { result } = renderHook(() =>
            useInstructionForm({
                instruction: INSTRUCTION_WITH_SIGNER_AND_NON_SIGNER,
                onSubmit: vi.fn(),
            }),
        );
        const { form, fieldNames } = result.current;

        const walletPublicKey = PublicKey.default;
        const dependency = createWalletPrefillDependency(INSTRUCTION_WITH_SIGNER_AND_NON_SIGNER, null, {
            account: fieldNames.account,
        });

        const walletAddress = walletPublicKey.toBase58();
        dependency.onValueChange(walletPublicKey, form);

        expect(form.getValues('accounts.testInstruction.signer')).toBe(walletAddress);
        expect(form.getValues('accounts.testInstruction.nonSigner')).toBe('');
    });

    it('should not fill when wallet is null', () => {
        const { result } = renderHook(() =>
            useInstructionForm({
                instruction: INSTRUCTION_WITH_SIGNER,
                onSubmit: vi.fn(),
            }),
        );
        const { form, fieldNames } = result.current;

        const dependency = createWalletPrefillDependency(INSTRUCTION_WITH_SIGNER, null, {
            account: fieldNames.account,
        });

        const setValueSpy = vi.spyOn(form, 'setValue');
        dependency.onValueChange(null, form);

        expect(setValueSpy).not.toHaveBeenCalled();
    });

    it('should handle nested signer accounts', () => {
        const { result } = renderHook(() =>
            useInstructionForm({
                instruction: INSTRUCTION_WITH_NESTED_SIGNER,
                onSubmit: vi.fn(),
            }),
        );
        const { form, fieldNames } = result.current;

        const walletPublicKey = PublicKey.default;
        const dependency = createWalletPrefillDependency(INSTRUCTION_WITH_NESTED_SIGNER, null, {
            account: fieldNames.account,
        });

        const walletAddress = walletPublicKey.toBase58();
        dependency.onValueChange(walletPublicKey, form);

        expect(form.getValues('accounts.testInstruction.group.nestedSigner')).toBe(walletAddress);
    });

    it('should return correct dependency id and getValue', () => {
        const walletPublicKey = PublicKey.default;
        const dependency = createWalletPrefillDependency(EMPTY_INSTRUCTION, walletPublicKey, {
            account: () => 'accounts.testInstruction.test' as any,
        });

        expect(dependency.id).toBe('wallet');
        expect(dependency.getValue()).toBe(walletPublicKey);
    });

    it('should update signer fields when wallet changes', () => {
        const { result } = renderHook(() =>
            useInstructionForm({
                instruction: INSTRUCTION_WITH_SIGNER,
                onSubmit: vi.fn(),
            }),
        );
        const { form, fieldNames } = result.current;

        const walletA = Keypair.generate().publicKey;
        const walletB = Keypair.generate().publicKey;

        // Simulate wallet connecting: create dependency with walletA, trigger fill
        const depA = createWalletPrefillDependency(INSTRUCTION_WITH_SIGNER, walletA, {
            account: fieldNames.account,
        });
        expect(depA.getValue()).toBe(walletA);
        depA.onValueChange(depA.getValue(), form);
        expect(form.getValues('accounts.testInstruction.signer')).toBe(walletA.toBase58());

        // Simulate wallet change: new dependency with walletB, field was not dirty so it updates
        const depB = createWalletPrefillDependency(INSTRUCTION_WITH_SIGNER, walletB, {
            account: fieldNames.account,
        });
        expect(depB.getValue()).toBe(walletB);
        depB.onValueChange(depB.getValue(), form);
        expect(form.getValues('accounts.testInstruction.signer')).toBe(walletB.toBase58());
    });

    it('should ignore non-PublicKey values in onValueChange', () => {
        const { result } = renderHook(() =>
            useInstructionForm({
                instruction: INSTRUCTION_WITH_SIGNER,
                onSubmit: vi.fn(),
            }),
        );
        const { form, fieldNames } = result.current;

        const dependency = createWalletPrefillDependency(INSTRUCTION_WITH_SIGNER, null, {
            account: fieldNames.account,
        });

        const setValueSpy = vi.spyOn(form, 'setValue');
        dependency.onValueChange('not-a-public-key', form);
        dependency.onValueChange(null, form);
        dependency.onValueChange(undefined, form);

        expect(setValueSpy).not.toHaveBeenCalled();
    });

    it('should not overwrite user-typed values', () => {
        const { result } = renderHook(() =>
            useInstructionForm({
                instruction: INSTRUCTION_WITH_SIGNER,
                onSubmit: vi.fn(),
            }),
        );
        const { form, fieldNames } = result.current;

        form.setValue('accounts.testInstruction.signer', PREFILLED_ADDRESS, { shouldDirty: true });

        const walletPublicKey = PublicKey.default;
        const dependency = createWalletPrefillDependency(INSTRUCTION_WITH_SIGNER, null, {
            account: fieldNames.account,
        });

        dependency.onValueChange(walletPublicKey, form);

        expect(form.getValues('accounts.testInstruction.signer')).toBe(PREFILLED_ADDRESS);
    });

    it('should overwrite a signer field that still contains the previous wallet address', () => {
        const { result } = renderHook(() =>
            useInstructionForm({
                instruction: INSTRUCTION_WITH_SIGNER,
                onSubmit: vi.fn(),
            }),
        );
        const { form, fieldNames } = result.current;

        const walletAAddress = Keypair.generate().publicKey.toBase58();
        const walletB = Keypair.generate().publicKey;

        form.setValue('accounts.testInstruction.signer', walletAAddress, { shouldDirty: false });

        const dependency = createWalletPrefillDependency(INSTRUCTION_WITH_SIGNER, null, {
            account: fieldNames.account,
        });
        dependency.onValueChange(walletB, form);

        expect(form.getValues('accounts.testInstruction.signer')).toBe(walletB.toBase58());
    });

    it('should fill only non-dirty signer fields when some are already user-typed', () => {
        const { result } = renderHook(() =>
            useInstructionForm({
                instruction: INSTRUCTION_WITH_TWO_SIGNERS,
                onSubmit: vi.fn(),
            }),
        );
        const { form, fieldNames } = result.current;

        // Simulate user typing into signer1
        form.setValue('accounts.testInstruction.signer1', PREFILLED_ADDRESS, { shouldDirty: true });

        const walletPublicKey = PublicKey.default;
        const walletAddress = walletPublicKey.toBase58();
        const dependency = createWalletPrefillDependency(INSTRUCTION_WITH_TWO_SIGNERS, null, {
            account: fieldNames.account,
        });

        dependency.onValueChange(walletPublicKey, form);

        expect(form.getValues('accounts.testInstruction.signer1')).toBe(PREFILLED_ADDRESS);
        expect(form.getValues('accounts.testInstruction.signer2')).toBe(walletAddress);
    });
});
