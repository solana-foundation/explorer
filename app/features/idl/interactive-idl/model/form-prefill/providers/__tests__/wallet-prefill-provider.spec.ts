// @vitest-environment jsdom

import { Keypair, PublicKey } from '@solana/web3.js';
import { describe, expect, it, vi } from 'vitest';

import { createWalletPrefillDependency } from '../wallet-prefill-provider';
import { createNestedTestAccount, createTestInstruction, renderInstructionForm } from './utils';

const PREFILLED_ADDRESS = Keypair.generate().publicKey.toBase58();

const SIGNER_ACCOUNT = { name: 'signer', signer: true };

const INSTRUCTION_WITH_SIGNER = createTestInstruction([SIGNER_ACCOUNT]);

const INSTRUCTION_WITH_SIGNER_AND_NON_SIGNER = createTestInstruction([SIGNER_ACCOUNT, 'nonSigner']);

const INSTRUCTION_WITH_NESTED_SIGNER = createTestInstruction([
    createNestedTestAccount('group', [{ name: 'nestedSigner', signer: true }]),
]);

const INSTRUCTION_WITH_TWO_SIGNERS = createTestInstruction([
    { ...SIGNER_ACCOUNT, name: 'signer1' },
    { ...SIGNER_ACCOUNT, name: 'signer2' },
]);

const EMPTY_INSTRUCTION = createTestInstruction([]);

describe('createWalletPrefillDependency', () => {
    it('should fill signer accounts with wallet address', () => {
        const { form, fieldNames } = renderInstructionForm(INSTRUCTION_WITH_SIGNER_AND_NON_SIGNER);

        const walletPublicKey = PublicKey.default;
        const dependency = createWalletPrefillDependency(INSTRUCTION_WITH_SIGNER_AND_NON_SIGNER, undefined, {
            account: fieldNames.account,
        });

        const walletAddress = walletPublicKey.toBase58();
        dependency.onValueChange(walletPublicKey, form);

        expect(form.getValues('accounts.testInstruction.signer')).toBe(walletAddress);
        expect(form.getValues('accounts.testInstruction.nonSigner')).toBe('');
    });

    it('should handle nested signer accounts', () => {
        const { form, fieldNames } = renderInstructionForm(INSTRUCTION_WITH_NESTED_SIGNER);

        const walletPublicKey = PublicKey.default;
        const dependency = createWalletPrefillDependency(INSTRUCTION_WITH_NESTED_SIGNER, undefined, {
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
        const { form, fieldNames } = renderInstructionForm(INSTRUCTION_WITH_SIGNER);

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
        const { form, fieldNames } = renderInstructionForm(INSTRUCTION_WITH_SIGNER);

        const dependency = createWalletPrefillDependency(INSTRUCTION_WITH_SIGNER, undefined, {
            account: fieldNames.account,
        });

        const setValueSpy = vi.spyOn(form, 'setValue');
        dependency.onValueChange('not-a-public-key', form);
        dependency.onValueChange(null, form);
        dependency.onValueChange(undefined, form);

        expect(setValueSpy).not.toHaveBeenCalled();
    });

    it('should not overwrite user-typed values', () => {
        const { form, fieldNames } = renderInstructionForm(INSTRUCTION_WITH_SIGNER);

        form.setValue('accounts.testInstruction.signer', PREFILLED_ADDRESS, { shouldDirty: true });

        const walletPublicKey = PublicKey.default;
        const dependency = createWalletPrefillDependency(INSTRUCTION_WITH_SIGNER, undefined, {
            account: fieldNames.account,
        });

        dependency.onValueChange(walletPublicKey, form);

        expect(form.getValues('accounts.testInstruction.signer')).toBe(PREFILLED_ADDRESS);
    });

    it('should overwrite a signer field that still contains the previous wallet address', () => {
        const { form, fieldNames } = renderInstructionForm(INSTRUCTION_WITH_SIGNER);

        const walletAAddress = Keypair.generate().publicKey.toBase58();
        const walletB = Keypair.generate().publicKey;

        form.setValue('accounts.testInstruction.signer', walletAAddress, { shouldDirty: false });

        const dependency = createWalletPrefillDependency(INSTRUCTION_WITH_SIGNER, undefined, {
            account: fieldNames.account,
        });
        dependency.onValueChange(walletB, form);

        expect(form.getValues('accounts.testInstruction.signer')).toBe(walletB.toBase58());
    });

    it('should fill only non-dirty signer fields when some are already user-typed', () => {
        const { form, fieldNames } = renderInstructionForm(INSTRUCTION_WITH_TWO_SIGNERS);

        // Simulate user typing into signer1
        form.setValue('accounts.testInstruction.signer1', PREFILLED_ADDRESS, { shouldDirty: true });

        const walletPublicKey = PublicKey.default;
        const walletAddress = walletPublicKey.toBase58();
        const dependency = createWalletPrefillDependency(INSTRUCTION_WITH_TWO_SIGNERS, undefined, {
            account: fieldNames.account,
        });

        dependency.onValueChange(walletPublicKey, form);

        expect(form.getValues('accounts.testInstruction.signer1')).toBe(PREFILLED_ADDRESS);
        expect(form.getValues('accounts.testInstruction.signer2')).toBe(walletAddress);
    });
});
