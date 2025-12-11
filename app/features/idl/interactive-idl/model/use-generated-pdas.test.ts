import type { InstructionData, SupportedIdl } from '@entities/idl';
import { renderHook } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { useGeneratedPdas } from './use-generated-pdas';
import type { InstructionFormData } from './use-instruction-form';

describe('useGeneratedPdas', () => {
    it('should return empty object when IDL is undefined', () => {
        const { createMockForm, mockInstruction } = setup();
        const form = createMockForm();

        const { result } = renderHook(() =>
            useGeneratedPdas({
                form,
                idl: undefined,
                instruction: mockInstruction,
            })
        );

        expect(result.current).toEqual({});
    });

    it('should return empty object when IDL is not Anchor IDL', () => {
        const { createMockForm, mockInstruction } = setup();
        const form = createMockForm();

        const { result } = renderHook(() =>
            useGeneratedPdas({
                form,
                idl: {} as SupportedIdl,
                instruction: mockInstruction,
            })
        );

        expect(result.current).toEqual({});
    });

    it('should return empty object when program ID is missing', () => {
        const { createMockForm, mockInstruction, mockIdl } = setup();
        const form = createMockForm();

        const idlWithoutAddress = { ...mockIdl, address: undefined } as unknown as SupportedIdl;

        const { result } = renderHook(() =>
            useGeneratedPdas({
                form,
                idl: idlWithoutAddress,
                instruction: mockInstruction,
            })
        );

        expect(result.current).toEqual({});
    });

    it('should return empty object when instruction is not found', () => {
        const { createMockForm, mockInstruction, mockIdl } = setup();
        const form = createMockForm();

        const unknownInstruction: InstructionData = {
            ...mockInstruction,
            name: 'unknownInstruction',
        };

        const { result } = renderHook(() =>
            useGeneratedPdas({
                form,
                idl: mockIdl,
                instruction: unknownInstruction,
            })
        );

        expect(result.current).toEqual({});
    });

    it('should generate PDA for single seed (poll)', () => {
        const { createMockForm, mockInstruction, mockIdl } = setup();
        const form = createMockForm();
        form.setValue('arguments.initializeCandidate.pollId', '123');

        const { result } = renderHook(() =>
            useGeneratedPdas({
                form,
                idl: mockIdl,
                instruction: mockInstruction,
            })
        );

        expect(result.current.poll).toBeDefined();
        expect(result.current.poll.generated).not.toBeNull();
        expect(typeof result.current.poll.generated).toBe('string');
        expect(result.current.poll.seeds).toHaveLength(1);
        expect(result.current.poll.seeds[0]).toEqual({
            name: 'pollId',
            value: '123',
        });
    });

    it('should generate PDA for multiple seeds (candidate)', () => {
        const { createMockForm, mockInstruction, mockIdl } = setup();
        const form = createMockForm();
        form.setValue('arguments.initializeCandidate.pollId', '123');
        form.setValue('arguments.initializeCandidate.candidateName', 'Alice');

        const { result } = renderHook(() =>
            useGeneratedPdas({
                form,
                idl: mockIdl,
                instruction: mockInstruction,
            })
        );

        expect(result.current.candidate).toBeDefined();
        expect(result.current.candidate.generated).not.toBeNull();
        expect(typeof result.current.candidate.generated).toBe('string');
        expect(result.current.candidate.seeds).toHaveLength(2);
        expect(result.current.candidate.seeds[0]).toEqual({
            name: 'pollId',
            value: '123',
        });
        expect(result.current.candidate.seeds[1]).toEqual({
            name: 'candidateName',
            value: 'Alice',
        });
    });

    it('should handle underscore prefix in argument names (_poll_id vs poll_id)', () => {
        const { createMockForm, mockInstruction, mockIdl } = setup();
        const form = createMockForm();
        form.setValue('arguments.initializeCandidate.pollId', '456');
        form.setValue('arguments.initializeCandidate.candidateName', 'Bob');

        const { result } = renderHook(() =>
            useGeneratedPdas({
                form,
                idl: mockIdl,
                instruction: mockInstruction,
            })
        );

        // Should still generate PDAs even though seed.path is "poll_id" and arg.name is "_poll_id"
        expect(result.current.poll).toBeDefined();
        expect(result.current.poll.generated).not.toBeNull();
        expect(result.current.candidate).toBeDefined();
        expect(result.current.candidate.generated).not.toBeNull();
    });

    it('should return null for PDA when required argument is missing', () => {
        const { createMockForm, mockInstruction, mockIdl } = setup();
        const form = createMockForm();
        form.setValue('arguments.initializeCandidate.candidateName', 'Charlie');
        // pollId is missing

        const { result } = renderHook(() =>
            useGeneratedPdas({
                form,
                idl: mockIdl,
                instruction: mockInstruction,
            })
        );

        expect(result.current.poll.generated).toBeNull();
        expect(result.current.poll.seeds).toHaveLength(1);
        expect(result.current.poll.seeds[0]).toEqual({
            name: 'pollId',
            value: null,
        });
        expect(result.current.candidate.generated).toBeNull();
        expect(result.current.candidate.seeds).toHaveLength(2);
        expect(result.current.candidate.seeds[0]).toEqual({
            name: 'pollId',
            value: null,
        });
        expect(result.current.candidate.seeds[1]).toEqual({
            name: 'candidateName',
            value: 'Charlie',
        });
    });

    it('should return null for PDA when numeric argument value cannot be converted to number', () => {
        const { createMockForm, mockInstruction, mockIdl } = setup();
        const form = createMockForm();
        form.setValue('arguments.initializeCandidate.pollId', 'invalid-number');
        form.setValue('arguments.initializeCandidate.candidateName', 'Test');

        const { result } = renderHook(() =>
            useGeneratedPdas({
                form,
                idl: mockIdl,
                instruction: mockInstruction,
            })
        );

        expect(result.current.poll.generated).toBeNull();
        expect(result.current.poll.seeds).toHaveLength(1);
        expect(result.current.poll.seeds[0]).toEqual({
            name: 'pollId',
            value: 'invalid-number',
        });
        expect(result.current.candidate.generated).toBeNull();
        expect(result.current.candidate.seeds).toHaveLength(2);
        expect(result.current.candidate.seeds[0]).toEqual({
            name: 'pollId',
            value: 'invalid-number',
        });
        expect(result.current.candidate.seeds[1]).toEqual({
            name: 'candidateName',
            value: 'Test',
        });
    });

    it('should handle different argument types (u64, string)', () => {
        const { createMockForm, mockInstruction, mockIdl } = setup();
        const form = createMockForm();
        form.setValue('arguments.initializeCandidate.pollId', '789');
        form.setValue('arguments.initializeCandidate.candidateName', 'David');

        const { result } = renderHook(() =>
            useGeneratedPdas({
                form,
                idl: mockIdl,
                instruction: mockInstruction,
            })
        );

        expect(result.current.poll).toBeDefined();
        expect(result.current.poll.generated).not.toBeNull();
        expect(result.current.candidate).toBeDefined();
        expect(result.current.candidate.generated).not.toBeNull();
    });

    it('should skip nested account groups', () => {
        const { createMockForm, mockInstruction, mockIdl } = setup();
        const form = createMockForm();
        form.setValue('arguments.initializeCandidate.pollId', '999');

        const idlWithNestedAccounts = {
            ...mockIdl,
            instructions: [
                {
                    ...mockIdl.instructions[0],
                    accounts: [
                        ...mockIdl.instructions[0].accounts,
                        {
                            accounts: [
                                {
                                    name: 'nestedAccount',
                                    pda: {
                                        seeds: [
                                            {
                                                kind: 'arg',
                                                path: 'poll_id',
                                            },
                                        ],
                                    },
                                },
                            ],
                            name: 'nestedGroup',
                        },
                    ],
                },
            ],
        } as SupportedIdl;

        const { result } = renderHook(() =>
            useGeneratedPdas({
                form,
                idl: idlWithNestedAccounts,
                instruction: mockInstruction,
            })
        );

        // Nested accounts should be skipped, so nestedAccount should not be in result
        expect(result.current.nestedAccount).toBeUndefined();
    });

    it('should handle account seeds', () => {
        const { createMockForm, mockIdl } = setup();
        const form = createMockForm();
        const accountPubkey = '11111111111111111111111111111111';

        const idlWithAccountSeed = {
            ...mockIdl,
            instructions: [
                {
                    accounts: [
                        {
                            name: 'pda_account',
                            pda: {
                                seeds: [
                                    {
                                        kind: 'account',
                                        path: 'authority',
                                    },
                                ],
                            },
                        },
                    ],
                    args: [],
                    discriminator: [1, 2, 3, 4, 5, 6, 7, 8],
                    name: 'test_instruction',
                },
            ],
        } as SupportedIdl;

        form.setValue('accounts.testInstruction.authority', accountPubkey);

        const testInstruction: InstructionData = {
            accounts: [
                {
                    docs: [],
                    name: 'pdaAccount',
                    pda: true,
                },
            ],
            args: [],
            docs: [],
            name: 'testInstruction',
        };

        const { result } = renderHook(() =>
            useGeneratedPdas({
                form,
                idl: idlWithAccountSeed,
                instruction: testInstruction,
            })
        );

        expect(result.current.pdaAccount).toBeDefined();
        expect(result.current.pdaAccount.generated).not.toBeNull();
        expect(result.current.pdaAccount.seeds).toHaveLength(1);
        expect(result.current.pdaAccount.seeds[0]).toEqual({
            name: 'authority',
            value: accountPubkey,
        });
    });

    it('should handle const seeds', () => {
        const { createMockForm, mockIdl } = setup();
        const form = createMockForm();

        const idlWithConstSeed = {
            ...mockIdl,
            instructions: [
                {
                    accounts: [
                        {
                            name: 'pda_account',
                            pda: {
                                seeds: [
                                    {
                                        kind: 'const',
                                        value: [116, 101, 115, 116], // "test" in bytes
                                    },
                                ],
                            },
                        },
                    ],
                    args: [],
                    discriminator: [1, 2, 3, 4, 5, 6, 7, 8],
                    name: 'test_instruction',
                },
            ],
        } as SupportedIdl;

        const testInstruction: InstructionData = {
            accounts: [
                {
                    docs: [],
                    name: 'pdaAccount',
                    pda: true,
                },
            ],
            args: [],
            docs: [],
            name: 'testInstruction',
        };

        const { result } = renderHook(() =>
            useGeneratedPdas({
                form,
                idl: idlWithConstSeed,
                instruction: testInstruction,
            })
        );

        expect(result.current.pdaAccount).toBeDefined();
        expect(result.current.pdaAccount.generated).not.toBeNull();
        expect(result.current.pdaAccount.seeds).toHaveLength(1);
        expect(result.current.pdaAccount.seeds[0]).toEqual({
            name: '0x74657374', // "test" in hex
            value: '0x74657374',
        });
    });

    it('should return null when account seed value is missing', () => {
        const { createMockForm, mockIdl } = setup();
        const form = createMockForm();

        const idlWithAccountSeed = {
            ...mockIdl,
            instructions: [
                {
                    accounts: [
                        {
                            name: 'pda_account',
                            pda: {
                                seeds: [
                                    {
                                        kind: 'account',
                                        path: 'authority',
                                    },
                                ],
                            },
                        },
                    ],
                    args: [],
                    discriminator: [1, 2, 3, 4, 5, 6, 7, 8],
                    name: 'test_instruction',
                },
            ],
        } as SupportedIdl;

        // authority is missing - form values remain empty

        const testInstruction: InstructionData = {
            accounts: [
                {
                    docs: [],
                    name: 'pdaAccount',
                    pda: true,
                },
            ],
            args: [],
            docs: [],
            name: 'testInstruction',
        };

        const { result } = renderHook(() =>
            useGeneratedPdas({
                form,
                idl: idlWithAccountSeed,
                instruction: testInstruction,
            })
        );

        expect(result.current.pdaAccount.generated).toBeNull();
        expect(result.current.pdaAccount.seeds).toHaveLength(1);
        expect(result.current.pdaAccount.seeds[0]).toEqual({
            name: 'authority',
            value: null,
        });
    });

    it('should skip accounts without PDA', () => {
        const { createMockForm, mockIdl, mockInstruction } = setup();
        const form = createMockForm();
        form.setValue('arguments.initializeCandidate.pollId', '123');
        form.setValue('arguments.initializeCandidate.candidateName', 'Eve');

        const { result } = renderHook(() =>
            useGeneratedPdas({
                form,
                idl: mockIdl,
                instruction: mockInstruction,
            })
        );

        // signer account should not be in result since it doesn't have PDA
        expect(result.current.signer).toBeUndefined();
        // Only PDA accounts should be present
        expect(result.current.poll).toBeDefined();
        expect(result.current.poll.generated).not.toBeNull();
        expect(result.current.candidate).toBeDefined();
        expect(result.current.candidate.generated).not.toBeNull();
    });

    it('should generate consistent PDA addresses for same inputs', () => {
        const { createMockForm, mockIdl, mockInstruction } = setup();
        const form = createMockForm();
        form.setValue('arguments.initializeCandidate.pollId', '123');
        form.setValue('arguments.initializeCandidate.candidateName', 'Frank');

        const { result: result1 } = renderHook(() =>
            useGeneratedPdas({
                form,
                idl: mockIdl,
                instruction: mockInstruction,
            })
        );

        const { result: result2 } = renderHook(() =>
            useGeneratedPdas({
                form,
                idl: mockIdl,
                instruction: mockInstruction,
            })
        );

        expect(result1.current.poll.generated).toBe(result2.current.poll.generated);
        expect(result1.current.candidate.generated).toBe(result2.current.candidate.generated);
    });
});

function setup() {
    const programId = 'AXcxp15oz1L4YYtqZo6Qt6EkUj1jtLR6wXYqaJvn4oye';

    const mockIdl: SupportedIdl = {
        address: programId,
        instructions: [
            {
                accounts: [
                    {
                        name: 'signer',
                        signer: true,
                        writable: true,
                    },
                    {
                        name: 'poll',
                        pda: {
                            seeds: [
                                {
                                    kind: 'arg',
                                    path: 'poll_id',
                                },
                            ],
                        },
                        writable: true,
                    },
                    {
                        name: 'candidate',
                        pda: {
                            seeds: [
                                {
                                    kind: 'arg',
                                    path: 'poll_id',
                                },
                                {
                                    kind: 'arg',
                                    path: 'candidate_name',
                                },
                            ],
                        },
                        writable: true,
                    },
                ],
                args: [
                    {
                        name: 'candidate_name',
                        type: 'string',
                    },
                    {
                        name: '_poll_id',
                        type: 'u64',
                    },
                ],
                discriminator: [210, 107, 118, 204, 255, 97, 112, 26],
                name: 'initialize_candidate',
            },
            {
                accounts: [
                    {
                        name: 'poll',
                        pda: {
                            seeds: [
                                {
                                    kind: 'arg',
                                    path: 'poll_id',
                                },
                            ],
                        },
                        writable: true,
                    },
                ],
                args: [
                    {
                        name: 'poll_id',
                        type: 'u64',
                    },
                ],
                discriminator: [193, 22, 99, 197, 18, 33, 115, 117],
                name: 'initialize_poll',
            },
        ],
        metadata: {
            name: 'voting',
            spec: '0.1.0',
            version: '0.1.0',
        },
    };

    const mockInstruction: InstructionData = {
        accounts: [
            {
                docs: [],
                name: 'signer',
                signer: true,
                writable: true,
            },
            {
                docs: [],
                name: 'poll',
                pda: true,
                writable: true,
            },
            {
                docs: [],
                name: 'candidate',
                pda: true,
                writable: true,
            },
        ],
        args: [
            {
                docs: [],
                name: 'candidateName',
                type: 'string',
            },
            {
                docs: [],
                name: 'pollId',
                type: 'u64',
            },
        ],
        docs: [],
        name: 'initializeCandidate',
    };

    const createMockForm = () => {
        return renderHook(() =>
            useForm<InstructionFormData>({
                defaultValues: {
                    accounts: {},
                    arguments: {},
                },
            })
        ).result.current;
    };

    return { createMockForm, mockIdl, mockInstruction };
}
