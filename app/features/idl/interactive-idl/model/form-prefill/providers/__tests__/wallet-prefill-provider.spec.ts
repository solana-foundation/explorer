import type { InstructionData } from '@entities/idl';
import { PublicKey } from '@solana/web3.js';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useInstructionForm } from '../../../use-instruction-form';
import { createWalletPrefillDependency } from '../wallet-prefill-provider';

describe('createWalletPrefillDependency', () => {
    it('should fill signer accounts with wallet address', () => {
        const instruction: InstructionData = {
            accounts: [
                {
                    docs: [],
                    name: 'signer',
                    optional: false,
                    signer: true,
                },
                {
                    docs: [],
                    name: 'nonSigner',
                    optional: false,
                    signer: false,
                },
            ],
            args: [],
            docs: [],
            name: 'testInstruction',
        };

        const { result } = renderHook(() =>
            useInstructionForm({
                instruction,
                onSubmit: vi.fn(),
            })
        );
        const { form, fieldNames } = result.current;

        const walletPublicKey = PublicKey.default;
        const dependency = createWalletPrefillDependency(instruction, walletPublicKey, {
            account: fieldNames.account,
        });

        const walletAddress = walletPublicKey.toBase58();
        dependency.onValueChange(walletPublicKey, form);

        expect(form.getValues('accounts.testInstruction.signer')).toBe(walletAddress);
        expect(form.getValues('accounts.testInstruction.nonSigner')).toBe('');
    });

    it('should not fill when wallet is null', () => {
        const instruction: InstructionData = {
            accounts: [
                {
                    docs: [],
                    name: 'signer',
                    optional: false,
                    signer: true,
                },
            ],
            args: [],
            docs: [],
            name: 'testInstruction',
        };

        const { result } = renderHook(() =>
            useInstructionForm({
                instruction,
                onSubmit: vi.fn(),
            })
        );
        const { form, fieldNames } = result.current;

        const dependency = createWalletPrefillDependency(instruction, null, {
            account: fieldNames.account,
        });

        const setValueSpy = vi.spyOn(form, 'setValue');
        dependency.onValueChange(null, form);

        expect(setValueSpy).not.toHaveBeenCalled();
    });

    it('should handle nested signer accounts', () => {
        const instruction: InstructionData = {
            accounts: [
                {
                    accounts: [
                        {
                            docs: [],
                            name: 'nestedSigner',
                            optional: false,
                            signer: true,
                        },
                    ],
                    name: 'group',
                },
            ],
            args: [],
            docs: [],
            name: 'testInstruction',
        };

        const { result } = renderHook(() =>
            useInstructionForm({
                instruction,
                onSubmit: vi.fn(),
            })
        );
        const { form, fieldNames } = result.current;

        const walletPublicKey = PublicKey.default;
        const dependency = createWalletPrefillDependency(instruction, walletPublicKey, {
            account: fieldNames.account,
        });

        const walletAddress = walletPublicKey.toBase58();
        dependency.onValueChange(walletPublicKey, form);

        expect(form.getValues('accounts.testInstruction.group.nestedSigner')).toBe(walletAddress);
    });

    it('should return correct dependency id and getValue', () => {
        const instruction: InstructionData = {
            accounts: [],
            args: [],
            docs: [],
            name: 'testInstruction',
        };

        const walletPublicKey = PublicKey.default;
        const dependency = createWalletPrefillDependency(instruction, walletPublicKey, {
            account: () => 'accounts.testInstruction.test' as any,
        });

        expect(dependency.id).toBe('wallet');
        expect(dependency.getValue()).toBe(walletPublicKey);
    });

    it('should ignore non-PublicKey values in onValueChange', () => {
        const instruction: InstructionData = {
            accounts: [
                {
                    docs: [],
                    name: 'signer',
                    optional: false,
                    signer: true,
                },
            ],
            args: [],
            docs: [],
            name: 'testInstruction',
        };

        const { result } = renderHook(() =>
            useInstructionForm({
                instruction,
                onSubmit: vi.fn(),
            })
        );
        const { form, fieldNames } = result.current;

        const dependency = createWalletPrefillDependency(instruction, null, {
            account: fieldNames.account,
        });

        const setValueSpy = vi.spyOn(form, 'setValue');
        dependency.onValueChange('not-a-public-key', form);
        dependency.onValueChange(null, form);
        dependency.onValueChange(undefined, form);

        expect(setValueSpy).not.toHaveBeenCalled();
    });
});
