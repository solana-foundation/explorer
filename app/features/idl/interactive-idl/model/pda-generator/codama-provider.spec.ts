import { readFileSync } from 'node:fs';
import path from 'node:path';

import type { SupportedIdl } from '@entities/idl';
import { PublicKey } from '@solana/web3.js';
import type { RootNode } from 'codama';
import {
    accountValueNode,
    argumentValueNode,
    booleanValueNode,
    bytesTypeNode,
    conditionalValueNode,
    constantPdaSeedNode,
    constantPdaSeedNodeFromString,
    instructionAccountNode,
    instructionNode,
    noneValueNode,
    numberValueNode,
    pdaLinkNode,
    pdaNode,
    pdaSeedValueNode,
    pdaValueNode,
    publicKeyTypeNode,
    publicKeyValueNode,
    resolverValueNode,
    stringValueNode,
    variablePdaSeedNode,
} from 'codama';
import { describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { createCodamaPdaProvider } from './codama-provider';

vi.mock('@codama/dynamic-client', async () => {
    const actual = await vi.importActual<typeof import('@codama/dynamic-client')>('@codama/dynamic-client');
    return {
        ...actual,
        createProgramClient: vi.fn(actual.createProgramClient),
    };
});

function loadCodamaIdl(filename: string): RootNode {
    const idlPath = path.resolve(__dirname, '../__mocks__/codama', filename);
    return JSON.parse(readFileSync(idlPath, 'utf8')) as RootNode;
}

function loadPmpCodamaIdl(): RootNode {
    const idlPath = path.resolve(
        __dirname,
        '../../../../../entities/idl/mocks/codama',
        'codama-1.0.0-ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S.json',
    );
    return JSON.parse(readFileSync(idlPath, 'utf8')) as RootNode;
}

describe('createCodamaPdaProvider', () => {
    const votingIdl = loadCodamaIdl('codama-voting.json');

    describe('canHandle', () => {
        it('should return true for Codama IDL', () => {
            const provider = createCodamaPdaProvider();
            expect(provider.canHandle(votingIdl as unknown as SupportedIdl)).toBe(true);
        });

        it('should return false for non-Codama IDL', () => {
            const provider = createCodamaPdaProvider();
            const anchorIdl = { address: 'abc', instructions: [], metadata: { spec: '0.1.0' } };
            expect(provider.canHandle(anchorIdl as unknown as SupportedIdl)).toBe(false);
        });
    });

    describe('getProgramId', () => {
        it('should return PublicKey from Codama IDL', () => {
            const provider = createCodamaPdaProvider();
            const result = provider.getProgramId(votingIdl as unknown as SupportedIdl);
            expect(result).toBeInstanceOf(PublicKey);
            expect(result?.toBase58()).toBe('AXcxp15oz1L4YYtqZo6Qt6EkUj1jtLR6wXYqaJvn4oye');
        });

        it('should return null for invalid public key', () => {
            const provider = createCodamaPdaProvider();
            const badIdl = { ...votingIdl, program: { ...votingIdl.program, publicKey: 'not-a-key' } };
            expect(provider.getProgramId(badIdl as unknown as SupportedIdl)).toBeNull();
        });
    });

    describe('computePdas', () => {
        it('should return empty object for unknown instruction', async () => {
            const provider = createCodamaPdaProvider();
            const result = await provider.computePdas(votingIdl as unknown as SupportedIdl, 'nonExistent', {}, {});
            expect(result).toEqual({});
        });

        it('should derive PDAs with argument seeds', async () => {
            const provider = createCodamaPdaProvider();
            const result = await provider.computePdas(
                votingIdl as unknown as SupportedIdl,
                'initializeCandidate',
                { candidateName: 'Alice', pollId: '123' },
                {},
            );

            expect(result.poll).toBeDefined();
            expect(result.poll.generated).not.toBeNull();
            expect(typeof result.poll.generated).toBe('string');
            expect(result.poll.seeds).toHaveLength(1);
            expect(result.poll.seeds[0]).toEqual({ name: 'pollId', value: '123' });

            expect(result.candidate).toBeDefined();
            expect(result.candidate.generated).not.toBeNull();
            expect(result.candidate.seeds).toHaveLength(2);
            expect(result.candidate.seeds[0]).toEqual({ name: 'pollId', value: '123' });
            expect(result.candidate.seeds[1]).toEqual({ name: 'candidateName', value: 'Alice' });
        });

        it('should return null for generated when required argument seed is missing', async () => {
            const provider = createCodamaPdaProvider();
            const result = await provider.computePdas(
                votingIdl as unknown as SupportedIdl,
                'initializeCandidate',
                { candidateName: 'Alice' },
                {},
            );

            expect(result.poll.generated).toBeNull();
            expect(result.poll.seeds[0]).toEqual({ name: 'pollId', value: null });

            expect(result.candidate.generated).toBeNull();
            expect(result.candidate.seeds[0]).toEqual({ name: 'pollId', value: null });
            expect(result.candidate.seeds[1]).toEqual({ name: 'candidateName', value: 'Alice' });
        });

        it('should return generated=null and log when a seed fails conversion (raw form value preserved in seed info)', async () => {
            const errorSpy = vi.spyOn(Logger, 'error').mockImplementation(() => undefined);
            const provider = createCodamaPdaProvider();
            // pollId is u64 — "not-a-number" will fail BigInt conversion.
            // candidateName (string) converts fine.
            const result = await provider.computePdas(
                votingIdl as unknown as SupportedIdl,
                'initializeCandidate',
                { candidateName: 'Alice', pollId: 'not-a-number' },
                {},
            );

            // PDA not generated; raw form value preserved on the failing seed,
            // other seeds still appear in the display info.
            expect(result.poll.generated).toBeNull();
            expect(result.poll.seeds[0]).toEqual({ name: 'pollId', value: 'not-a-number' });
            expect(result.candidate.generated).toBeNull();
            expect(result.candidate.seeds).toHaveLength(2);
            expect(result.candidate.seeds[1]).toEqual({ name: 'candidateName', value: 'Alice' });

            expect(errorSpy).toHaveBeenCalled();
            const [firstArg] = errorSpy.mock.calls[0];
            expect(firstArg).toBeInstanceOf(Error);
            expect((firstArg as Error).message).toContain('conversion failed for seed pollId');
            errorSpy.mockRestore();
        });

        it('should return null for generated when argument seed value is empty', async () => {
            const provider = createCodamaPdaProvider();
            const result = await provider.computePdas(
                votingIdl as unknown as SupportedIdl,
                'initializeCandidate',
                { candidateName: 'Alice', pollId: '' },
                {},
            );

            expect(result.poll.generated).toBeNull();
            expect(result.poll.seeds[0]).toEqual({ name: 'pollId', value: null });
        });

        it('should derive PDA with account seeds', async () => {
            const provider = createCodamaPdaProvider();
            const authorityKey = PublicKey.default.toBase58();
            const result = await provider.computePdas(
                votingIdl as unknown as SupportedIdl,
                'instructionWithAccountSeed',
                {},
                { authority: authorityKey },
            );

            expect(result.pdaAccount).toBeDefined();
            expect(result.pdaAccount.generated).not.toBeNull();
            expect(result.pdaAccount.seeds).toHaveLength(1);
            expect(result.pdaAccount.seeds[0]).toEqual({ name: 'authority', value: authorityKey });
        });

        it('should return null when account seed value is missing', async () => {
            const provider = createCodamaPdaProvider();
            const result = await provider.computePdas(
                votingIdl as unknown as SupportedIdl,
                'instructionWithAccountSeed',
                {},
                {},
            );

            expect(result.pdaAccount.generated).toBeNull();
            expect(result.pdaAccount.seeds[0]).toEqual({ name: 'authority', value: null });
        });

        it('should return null when account seed is whitespace-only', async () => {
            const provider = createCodamaPdaProvider();
            const result = await provider.computePdas(
                votingIdl as unknown as SupportedIdl,
                'instructionWithAccountSeed',
                {},
                { authority: '   ' },
            );

            expect(result.pdaAccount.generated).toBeNull();
            expect(result.pdaAccount.seeds[0]).toEqual({ name: 'authority', value: null });
        });

        it('should handle constant string seeds', async () => {
            const provider = createCodamaPdaProvider();
            const result = await provider.computePdas(
                votingIdl as unknown as SupportedIdl,
                'instructionWithConstSeed',
                {},
                {},
            );

            expect(result.pdaAccount).toBeDefined();
            expect(result.pdaAccount.generated).not.toBeNull();
            expect(result.pdaAccount.seeds).toHaveLength(1);
            // "test" encoded as hex
            expect(result.pdaAccount.seeds[0]).toEqual({ name: '0x74657374', value: '0x74657374' });
        });

        it('should skip accounts without PDA default value', async () => {
            const provider = createCodamaPdaProvider();
            const result = await provider.computePdas(
                votingIdl as unknown as SupportedIdl,
                'initializeCandidate',
                { candidateName: 'Bob', pollId: '1' },
                {},
            );

            // signer and systemProgram have no pdaValueNode
            expect(result.signer).toBeUndefined();
            expect(result.systemProgram).toBeUndefined();
            // Only PDA accounts
            expect(result.poll).toBeDefined();
            expect(result.candidate).toBeDefined();
        });

        it('should generate consistent addresses for same inputs', async () => {
            const provider = createCodamaPdaProvider();
            const args = { candidateName: 'Consistent', pollId: '42' };

            const result1 = await provider.computePdas(
                votingIdl as unknown as SupportedIdl,
                'initializeCandidate',
                args,
                {},
            );
            const result2 = await provider.computePdas(
                votingIdl as unknown as SupportedIdl,
                'initializeCandidate',
                args,
                {},
            );

            expect(result1.poll.generated).toBe(result2.poll.generated);
            expect(result1.candidate.generated).toBe(result2.candidate.generated);
        });

        it('should handle pdaLinkNode by resolving from program pdas map', async () => {
            // Create an IDL with a pdaLinkNode reference instead of inline pdaNode
            const idlWithPdaLink = JSON.parse(JSON.stringify(votingIdl)) as RootNode;
            // Move the inline PDA to the program.pdas array and replace with a link
            const initCandidateIx = idlWithPdaLink.program.instructions.find(i => i.name === 'initializePoll');
            const pollAccount = initCandidateIx?.accounts.find(a => a.name === 'poll');
            const pdaValue = (pollAccount as any).defaultValue;
            const inlinePda = pdaValue.pda;

            // Add PDA to program.pdas
            idlWithPdaLink.program.pdas.push(inlinePda);

            // Replace inline pdaNode with pdaLinkNode
            pdaValue.pda = { kind: 'pdaLinkNode', name: 'poll' };

            const provider = createCodamaPdaProvider();
            const result = await provider.computePdas(
                idlWithPdaLink as unknown as SupportedIdl,
                'initializePoll',
                { pollId: '99' },
                {},
            );

            expect(result.poll).toBeDefined();
            expect(result.poll.generated).not.toBeNull();
            expect(result.poll.seeds[0]).toEqual({ name: 'pollId', value: '99' });
        });

        it('should cache client per program key and version, and rebuild on version change', async () => {
            const { createProgramClient } = await import('@codama/dynamic-client');
            const createSpy = vi.mocked(createProgramClient);
            createSpy.mockClear();

            const provider = createCodamaPdaProvider();

            // First call creates a client
            const result1 = await provider.computePdas(
                votingIdl as unknown as SupportedIdl,
                'initializeCandidate',
                { candidateName: 'A', pollId: '1' },
                {},
            );
            expect(createSpy).toHaveBeenCalledTimes(1);

            // Second call should reuse cached client and produce same results
            const result2 = await provider.computePdas(
                votingIdl as unknown as SupportedIdl,
                'vote',
                { candidateName: 'A', pollId: '1' },
                {},
            );
            expect(createSpy).toHaveBeenCalledTimes(1);

            // Both should work (proving the client was usable both times)
            expect(result1.poll.generated).not.toBeNull();
            expect(result2.poll.generated).not.toBeNull();
            // Same seeds should produce same PDA
            expect(result1.poll.generated).toBe(result2.poll.generated);

            // Different version → cache bust, new client created.
            const bumped = { ...votingIdl, version: `${votingIdl.version}-bumped` };
            await provider.computePdas(
                bumped as unknown as SupportedIdl,
                'vote',
                { candidateName: 'A', pollId: '1' },
                {},
            );
            expect(createSpy).toHaveBeenCalledTimes(2);
        });

        it('should key cache by object identity, not by publicKey+version string', async () => {
            const { createProgramClient } = await import('@codama/dynamic-client');
            const createSpy = vi.mocked(createProgramClient);
            createSpy.mockClear();

            const provider = createCodamaPdaProvider();

            // Prepare two distinct objects.
            // WeakMap keys by object identity, so each should get its own client.
            const idlA = JSON.parse(JSON.stringify(votingIdl)) as RootNode;
            const idlB = JSON.parse(JSON.stringify(votingIdl)) as RootNode;

            await provider.computePdas(
                idlA as unknown as SupportedIdl,
                'initializeCandidate',
                { candidateName: 'A', pollId: '1' },
                {},
            );
            expect(createSpy).toHaveBeenCalledTimes(1);

            await provider.computePdas(
                idlB as unknown as SupportedIdl,
                'initializeCandidate',
                { candidateName: 'A', pollId: '1' },
                {},
            );
            expect(createSpy).toHaveBeenCalledTimes(2);

            // Reusing the same object hits the cache — no new client built.
            await provider.computePdas(
                idlA as unknown as SupportedIdl,
                'vote',
                { candidateName: 'A', pollId: '1' },
                {},
            );
            expect(createSpy).toHaveBeenCalledTimes(2);
        });

        it('should handle constant seed with bytesValueNode (base16)', async () => {
            const idlWithBytesSeed = JSON.parse(JSON.stringify(votingIdl)) as RootNode;
            const constSeedIx = idlWithBytesSeed.program.instructions.find(i => i.name === 'instructionWithConstSeed');
            const pdaAccount = constSeedIx?.accounts.find(a => a.name === 'pdaAccount');
            const pdaNode = (pdaAccount as any).defaultValue.pda;

            // Replace the string seed with a bytes seed
            pdaNode.seeds[0] = {
                kind: 'constantPdaSeedNode',
                type: { kind: 'bytesTypeNode' },
                value: { data: 'deadbeef', encoding: 'base16', kind: 'bytesValueNode' },
            };

            const provider = createCodamaPdaProvider();
            const result = await provider.computePdas(
                idlWithBytesSeed as unknown as SupportedIdl,
                'instructionWithConstSeed',
                {},
                {},
            );

            expect(result.pdaAccount).toBeDefined();
            expect(result.pdaAccount.seeds[0]).toEqual({ name: '0xdeadbeef', value: '0xdeadbeef' });
        });

        it('should handle constant seed with bytesValueNode (base58)', async () => {
            const idlWithBytesSeed = JSON.parse(JSON.stringify(votingIdl)) as RootNode;
            const constSeedIx = idlWithBytesSeed.program.instructions.find(i => i.name === 'instructionWithConstSeed');
            const pdaAccount = constSeedIx?.accounts.find(a => a.name === 'pdaAccount');
            const pdaNode = (pdaAccount as any).defaultValue.pda;

            // base58 for bytes [1, 2, 3] is "Ldp"
            pdaNode.seeds[0] = {
                kind: 'constantPdaSeedNode',
                type: { kind: 'bytesTypeNode' },
                value: { data: 'Ldp', encoding: 'base58', kind: 'bytesValueNode' },
            };

            const provider = createCodamaPdaProvider();
            const result = await provider.computePdas(
                idlWithBytesSeed as unknown as SupportedIdl,
                'instructionWithConstSeed',
                {},
                {},
            );

            expect(result.pdaAccount).toBeDefined();
            // base58 "Ldp" decodes to bytes [1, 2, 3] → hex "010203"
            expect(result.pdaAccount.seeds[0]).toEqual({ name: '0x010203', value: '0x010203' });
        });

        it('should handle constant seed with bytesValueNode (base64)', async () => {
            const idlWithBytesSeed = JSON.parse(JSON.stringify(votingIdl)) as RootNode;
            const constSeedIx = idlWithBytesSeed.program.instructions.find(i => i.name === 'instructionWithConstSeed');
            const pdaAccount = constSeedIx?.accounts.find(a => a.name === 'pdaAccount');
            const pdaNode = (pdaAccount as any).defaultValue.pda;

            // base64 for "hello" is "aGVsbG8="
            pdaNode.seeds[0] = {
                kind: 'constantPdaSeedNode',
                type: { kind: 'bytesTypeNode' },
                value: { data: 'aGVsbG8=', encoding: 'base64', kind: 'bytesValueNode' },
            };

            const provider = createCodamaPdaProvider();
            const result = await provider.computePdas(
                idlWithBytesSeed as unknown as SupportedIdl,
                'instructionWithConstSeed',
                {},
                {},
            );

            expect(result.pdaAccount).toBeDefined();
            // "hello" in hex is "68656c6c6f"
            expect(result.pdaAccount.seeds[0]).toEqual({ name: '0x68656c6c6f', value: '0x68656c6c6f' });
        });

        it('should handle constant seed with bytesValueNode (utf8)', async () => {
            const idlWithBytesSeed = JSON.parse(JSON.stringify(votingIdl)) as RootNode;
            const constSeedIx = idlWithBytesSeed.program.instructions.find(i => i.name === 'instructionWithConstSeed');
            const pdaAccount = constSeedIx?.accounts.find(a => a.name === 'pdaAccount');
            const pdaNode = (pdaAccount as any).defaultValue.pda;

            pdaNode.seeds[0] = {
                kind: 'constantPdaSeedNode',
                type: { kind: 'bytesTypeNode' },
                value: { data: 'abc', encoding: 'utf8', kind: 'bytesValueNode' },
            };

            const provider = createCodamaPdaProvider();
            const result = await provider.computePdas(
                idlWithBytesSeed as unknown as SupportedIdl,
                'instructionWithConstSeed',
                {},
                {},
            );

            expect(result.pdaAccount).toBeDefined();
            // "abc" in hex is "616263"
            expect(result.pdaAccount.seeds[0]).toEqual({ name: '0x616263', value: '0x616263' });
        });

        it('should handle constant seed with publicKeyValueNode', async () => {
            const idlWithPubkeySeed = JSON.parse(JSON.stringify(votingIdl)) as RootNode;
            const constSeedIx = idlWithPubkeySeed.program.instructions.find(
                i => i.name === 'instructionWithConstSeed',
            );
            const pdaAccount = constSeedIx?.accounts.find(a => a.name === 'pdaAccount');
            const pdaNode = (pdaAccount as any).defaultValue.pda;

            const pubkey = PublicKey.default.toBase58();
            pdaNode.seeds[0] = {
                kind: 'constantPdaSeedNode',
                type: { kind: 'publicKeyTypeNode' },
                value: { kind: 'publicKeyValueNode', publicKey: pubkey },
            };

            const provider = createCodamaPdaProvider();
            const result = await provider.computePdas(
                idlWithPubkeySeed as unknown as SupportedIdl,
                'instructionWithConstSeed',
                {},
                {},
            );

            expect(result.pdaAccount).toBeDefined();
            // 32 zero bytes in hex = 64 hex chars
            expect(result.pdaAccount.seeds[0].name).toBe('0x' + '0'.repeat(64));
        });

        it('should handle constant seed with programIdValueNode', async () => {
            const idlWithProgIdSeed = JSON.parse(JSON.stringify(votingIdl)) as RootNode;
            const constSeedIx = idlWithProgIdSeed.program.instructions.find(
                i => i.name === 'instructionWithConstSeed',
            );
            const pdaAccount = constSeedIx?.accounts.find(a => a.name === 'pdaAccount');
            const pdaNode = (pdaAccount as any).defaultValue.pda;

            pdaNode.seeds[0] = {
                kind: 'constantPdaSeedNode',
                type: { kind: 'publicKeyTypeNode' },
                value: { kind: 'programIdValueNode' },
            };

            const provider = createCodamaPdaProvider();
            const result = await provider.computePdas(
                idlWithProgIdSeed as unknown as SupportedIdl,
                'instructionWithConstSeed',
                {},
                {},
            );

            expect(result.pdaAccount).toBeDefined();
            // Program ID bytes as hex
            const expectedHex = Array.from(new PublicKey(votingIdl.program.publicKey).toBytes())
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
            expect(result.pdaAccount.seeds[0]).toEqual({
                name: `0x${expectedHex}`,
                value: `0x${expectedHex}`,
            });
        });
    });

    describe('compute pda with conditionalValueNode branch', () => {
        const emptyPda = pdaNode({ name: 'syntheticEmpty', seeds: [] });
        const pdaBranch = pdaValueNode(pdaLinkNode('syntheticEmpty'));
        const ixName = 'initializePoll';
        const literalBranch = publicKeyValueNode('11111111111111111111111111111111');

        const cloneWithConditional = (conditional: ReturnType<typeof conditionalValueNode>): RootNode => {
            const idl = JSON.parse(JSON.stringify(votingIdl)) as RootNode;
            idl.program.pdas.push(emptyPda);
            const ix = idl.program.instructions.find(i => i.name === ixName);
            const pollAcc = ix?.accounts.find(a => a.name === 'poll');
            (pollAcc as any).defaultValue = conditional;
            return idl;
        };

        const buildEqualityIdl = (
            condition: ReturnType<typeof argumentValueNode> | ReturnType<typeof accountValueNode>,
            value: Parameters<typeof conditionalValueNode>[0]['value'],
        ) => {
            const idl = JSON.parse(JSON.stringify(votingIdl)) as RootNode;
            // Build two synthetic PDAs with CONSTANT seeds (no arg dependency).
            const truePda = pdaNode({
                name: 'eqTrueBranch',
                seeds: [constantPdaSeedNodeFromString('utf8', 'TRUE')],
            });
            const falsePda = pdaNode({
                name: 'eqFalseBranch',
                seeds: [constantPdaSeedNodeFromString('utf8', 'FALSE')],
            });
            idl.program.pdas.push(truePda, falsePda);

            const ix = idl.program.instructions.find(i => i.name === 'initializePoll');
            const pollAcc = ix?.accounts.find(a => a.name === 'poll');
            (pollAcc as any).defaultValue = conditionalValueNode({
                condition,
                ifFalse: pdaValueNode(pdaLinkNode('eqFalseBranch')),
                ifTrue: pdaValueNode(pdaLinkNode('eqTrueBranch')),
                value,
            });

            const programId = new PublicKey(votingIdl.program.publicKey);
            const [expectedTrueAddr] = PublicKey.findProgramAddressSync([new TextEncoder().encode('TRUE')], programId);
            const [expectedFalseAddr] = PublicKey.findProgramAddressSync(
                [new TextEncoder().encode('FALSE')],
                programId,
            );

            return { expectedFalseAddr, expectedTrueAddr, idl };
        };

        it('should evaluate condition.value equality and select the correct branch', async () => {
            // Two branches with different seed lists.
            const idl = JSON.parse(JSON.stringify(votingIdl)) as RootNode;
            const ix = idl.program.instructions.find(i => i.name === ixName);
            const pollAcc = ix?.accounts.find(a => a.name === 'poll');
            const basePda = (pollAcc as any).defaultValue.pda;
            const baseSeedValues = (pollAcc as any).defaultValue.seeds;

            const ifTruePda = { ...basePda, name: 'trueBranch' };
            const ifFalsePda = {
                ...basePda,
                name: 'falseBranch',
                seeds: [...basePda.seeds, constantPdaSeedNodeFromString('utf8', 'else')],
            };

            (pollAcc as any).defaultValue = conditionalValueNode({
                condition: argumentValueNode('pollId'),
                ifFalse: pdaValueNode(ifFalsePda, baseSeedValues),
                ifTrue: pdaValueNode(ifTruePda, baseSeedValues),
                value: numberValueNode(7),
            });
            idl.program.pdas.push(ifTruePda, ifFalsePda);

            const provider = createCodamaPdaProvider();
            const ifTrueBranch = await provider.computePdas(
                idl as unknown as SupportedIdl,
                'initializePoll',
                { pollId: '7' },
                {},
            );
            const ifFalseBranch = await provider.computePdas(
                idl as unknown as SupportedIdl,
                'initializePoll',
                { pollId: '8' },
                {},
            );

            expect(ifTrueBranch.poll.generated).not.toBeNull();
            expect(ifFalseBranch.poll.generated).not.toBeNull();
            expect(ifTrueBranch.poll.generated).not.toBe(ifFalseBranch.poll.generated);
        });

        it('should return no PDA when condition is true and ifTrue is not a pdaValueNode', async () => {
            // ifTrue = publicKey literal (user types it), ifFalse = PDA (auto-derived).
            // Arg present ⇒ condition truthy ⇒ correct answer is "user will type it" ⇒ no auto-derive.
            const idl = cloneWithConditional(
                conditionalValueNode({
                    condition: argumentValueNode('pollId'),
                    ifFalse: pdaBranch,
                    ifTrue: literalBranch,
                }),
            );
            const provider = createCodamaPdaProvider();
            const result = await provider.computePdas(idl as unknown as SupportedIdl, ixName, { pollId: '7' }, {});
            expect(result.poll).toBeUndefined();
        });

        it('should return no PDA when condition is false and ifFalse is not a pdaValueNode', async () => {
            const idl = cloneWithConditional(
                conditionalValueNode({
                    condition: argumentValueNode('pollId'),
                    ifFalse: literalBranch,
                    ifTrue: pdaBranch,
                }),
            );
            const provider = createCodamaPdaProvider();
            const result = await provider.computePdas(idl as unknown as SupportedIdl, ixName, { pollId: '' }, {});
            expect(result.poll).toBeUndefined();
        });

        it('should return no PDA when condition is true but only ifFalse exists', async () => {
            const idl = cloneWithConditional(
                conditionalValueNode({
                    condition: argumentValueNode('pollId'),
                    ifFalse: pdaBranch,
                }),
            );
            const provider = createCodamaPdaProvider();
            const result = await provider.computePdas(idl as unknown as SupportedIdl, ixName, { pollId: '7' }, {});
            expect(result.poll).toBeUndefined();
        });

        it('should return no PDA when condition is false but only ifTrue exists', async () => {
            const idl = cloneWithConditional(
                conditionalValueNode({
                    condition: argumentValueNode('pollId'),
                    ifTrue: pdaBranch,
                }),
            );
            const provider = createCodamaPdaProvider();
            const result = await provider.computePdas(idl as unknown as SupportedIdl, ixName, { pollId: '' }, {});
            expect(result.poll).toBeUndefined();
        });

        it('should compare numberValueNode by stringified number', async () => {
            const { idl, expectedTrueAddr, expectedFalseAddr } = buildEqualityIdl(
                argumentValueNode('pollId'),
                numberValueNode(0),
            );
            const provider = createCodamaPdaProvider();
            const ifTrueBranch = await provider.computePdas(
                idl as unknown as SupportedIdl,
                'initializePoll',
                { pollId: '0' },
                {},
            );
            const ifFalseBranch = await provider.computePdas(
                idl as unknown as SupportedIdl,
                'initializePoll',
                { pollId: '1' },
                {},
            );
            expect(ifTrueBranch.poll.generated).toBe(expectedTrueAddr.toBase58());
            expect(ifFalseBranch.poll.generated).toBe(expectedFalseAddr.toBase58());
        });

        it('should trim whitespace from user-supplied values before equality check', async () => {
            const { idl, expectedTrueAddr } = buildEqualityIdl(argumentValueNode('pollId'), numberValueNode(7));
            const provider = createCodamaPdaProvider();
            const padded = await provider.computePdas(
                idl as unknown as SupportedIdl,
                'initializePoll',
                { pollId: '  7  ' },
                {},
            );
            expect(padded.poll.generated).toBe(expectedTrueAddr.toBase58());
        });

        it('should compare booleanValueNode against string "true"/"false"', async () => {
            const { idl, expectedTrueAddr, expectedFalseAddr } = buildEqualityIdl(
                argumentValueNode('pollId'),
                booleanValueNode(true),
            );
            const provider = createCodamaPdaProvider();
            const ifTrueBranch = await provider.computePdas(
                idl as unknown as SupportedIdl,
                'initializePoll',
                { pollId: 'true' },
                {},
            );
            const ifFalseBranch = await provider.computePdas(
                idl as unknown as SupportedIdl,
                'initializePoll',
                { pollId: 'false' },
                {},
            );
            expect(ifTrueBranch.poll.generated).toBe(expectedTrueAddr.toBase58());
            expect(ifFalseBranch.poll.generated).toBe(expectedFalseAddr.toBase58());
        });

        it('should compare stringValueNode against string', async () => {
            const { idl, expectedTrueAddr, expectedFalseAddr } = buildEqualityIdl(
                argumentValueNode('pollId'),
                stringValueNode('hello'),
            );
            const provider = createCodamaPdaProvider();
            const ifTrueBranch = await provider.computePdas(
                idl as unknown as SupportedIdl,
                'initializePoll',
                { pollId: 'hello' },
                {},
            );
            const ifFalseBranch = await provider.computePdas(
                idl as unknown as SupportedIdl,
                'initializePoll',
                { pollId: 'world' },
                {},
            );
            expect(ifTrueBranch.poll.generated).toBe(expectedTrueAddr.toBase58());
            expect(ifFalseBranch.poll.generated).toBe(expectedFalseAddr.toBase58());
        });

        it('should compare publicKeyValueNode against accountValueNode source', async () => {
            const conditionalValue = '11111111111111111111111111111111';
            const otherValue = 'SysvarRent111111111111111111111111111111111';
            const { idl, expectedTrueAddr, expectedFalseAddr } = buildEqualityIdl(
                accountValueNode('signer'),
                publicKeyValueNode(conditionalValue),
            );
            const provider = createCodamaPdaProvider();
            const ifTrueBranch = await provider.computePdas(
                idl as unknown as SupportedIdl,
                'initializePoll',
                {},
                { signer: conditionalValue },
            );
            const ifFalseBranch = await provider.computePdas(
                idl as unknown as SupportedIdl,
                'initializePoll',
                {},
                { signer: otherValue },
            );
            expect(ifTrueBranch.poll.generated).toBe(expectedTrueAddr.toBase58());
            expect(ifFalseBranch.poll.generated).toBe(expectedFalseAddr.toBase58());
        });

        it('should treat an object-shaped account entry as empty (condition raw value)', async () => {
            const { idl, expectedFalseAddr } = buildEqualityIdl(accountValueNode('signer'), numberValueNode(1));
            const provider = createCodamaPdaProvider();

            const result = await provider.computePdas(
                idl as unknown as SupportedIdl,
                'initializePoll',
                {},
                // treated as empty and ifFalse branch is selected
                { signer: { nested: 'ignored' } },
            );

            expect(result.poll.generated).toBe(expectedFalseAddr.toBase58());
        });

        it('should treat a missing arg as empty (ifFalse)', async () => {
            const { idl, expectedFalseAddr } = buildEqualityIdl(argumentValueNode('pollId'), numberValueNode(7));
            const provider = createCodamaPdaProvider();
            const result = await provider.computePdas(idl as unknown as SupportedIdl, 'initializePoll', {}, {});
            expect(result.poll.generated).toBe(expectedFalseAddr.toBase58());
        });

        it('should fallback to ifTrue and warn when expected value-node kind is unsupported', async () => {
            const warnSpy = vi.spyOn(Logger, 'warn').mockImplementation(() => undefined);
            const { idl, expectedTrueAddr } = buildEqualityIdl(argumentValueNode('pollId'), noneValueNode());
            const provider = createCodamaPdaProvider();
            const result = await provider.computePdas(
                idl as unknown as SupportedIdl,
                'initializePoll',
                { pollId: '7' },
                {},
            );
            expect(result.poll.generated).toBe(expectedTrueAddr.toBase58());
            expect(warnSpy).toHaveBeenCalled();
            const [msg] = warnSpy.mock.calls[0];
            expect(msg).toContain('Could not evaluate conditional PDA');
            warnSpy.mockRestore();
        });

        it('should fallback to the only available branch when condition is unknown', async () => {
            const idlWithConditional = JSON.parse(JSON.stringify(votingIdl)) as RootNode;
            const initPollIx = idlWithConditional.program.instructions.find(i => i.name === 'initializePoll');
            const pollAccount = initPollIx?.accounts.find(a => a.name === 'poll');
            const originalDefault = (pollAccount as any).defaultValue;

            // resolverValueNode is unevaluable from form state — provider falls back to the only populated branch (ifFalse here).
            (pollAccount as any).defaultValue = conditionalValueNode({
                condition: resolverValueNode('unknown'),
                ifFalse: originalDefault,
            });

            const provider = createCodamaPdaProvider();
            const result = await provider.computePdas(
                idlWithConditional as unknown as SupportedIdl,
                'initializePoll',
                { pollId: '7' },
                {},
            );

            expect(result.poll).toBeDefined();
            expect(result.poll.generated).not.toBeNull();
        });

        describe('PMP conditional branch', () => {
            const pmpIdl = loadPmpCodamaIdl();
            const programKey = '5v4CbtQTxb4iYAW1MCJMpVu5Dud9ybmRqzXs4bTCJm3o';
            const authorityKey = '6hb98KJuyK4xfYEqMw8uLndqDMsx23ZcfzDxVRYHtdW9';
            const programDataKey = '8X6pQzHbYUDpmA5FyZ9hExgJ1b5fPexUoQWfu6cFvQhP';
            const seed = 'testtesttesttest';
            const seedBytes = new TextEncoder().encode(seed);
            const PMP = new PublicKey(pmpIdl.program.publicKey);

            it('should select canonical branch (ifTrue) when programData is provided', async () => {
                const provider = createCodamaPdaProvider();
                const result = await provider.computePdas(
                    pmpIdl as unknown as SupportedIdl,
                    'initialize',
                    { seed },
                    { authority: authorityKey, program: programKey, programData: programDataKey },
                );

                const [expectedCanonical] = PublicKey.findProgramAddressSync(
                    [new PublicKey(programKey).toBytes(), seedBytes],
                    PMP,
                );
                expect(result.metadata.generated).toBe(expectedCanonical.toBase58());
                // Canonical seeds [program, seed].
                expect(result.metadata.seeds.map(s => s.name)).toEqual(['program', 'seed']);
            });

            it('should select nonCanonical branch (ifFalse) when programData is empty', async () => {
                const provider = createCodamaPdaProvider();
                const result = await provider.computePdas(
                    pmpIdl as unknown as SupportedIdl,
                    'initialize',
                    { seed },
                    { authority: authorityKey, program: programKey },
                );

                const [expectedNonCanonical] = PublicKey.findProgramAddressSync(
                    [new PublicKey(programKey).toBytes(), new PublicKey(authorityKey).toBytes(), seedBytes],
                    PMP,
                );
                expect(result.metadata.generated).toBe(expectedNonCanonical.toBase58());
                // NonCanonical seeds [program, authority, seed].
                expect(result.metadata.seeds.map(s => s.name)).toEqual(['program', 'authority', 'seed']);
            });

            it('should treat whitespace-only programData as empty (nonCanonical)', async () => {
                const provider = createCodamaPdaProvider();
                const result = await provider.computePdas(
                    pmpIdl as unknown as SupportedIdl,
                    'initialize',
                    { seed },
                    { authority: authorityKey, program: programKey, programData: '   ' },
                );

                const [expectedNonCanonical] = PublicKey.findProgramAddressSync(
                    [new PublicKey(programKey).toBytes(), new PublicKey(authorityKey).toBytes(), seedBytes],
                    PMP,
                );
                expect(result.metadata.generated).toBe(expectedNonCanonical.toBase58());
                expect(result.metadata.seeds.map(s => s.name)).toEqual(['program', 'authority', 'seed']);
            });
        });
    });

    describe('self-referencing PDA cycles', () => {
        it('should return null for generated when account PDA seed references itself', async () => {
            const idlWithSelfRef = JSON.parse(JSON.stringify(votingIdl)) as RootNode;

            const selfRefPda = pdaNode({
                name: 'recursive',
                seeds: [variablePdaSeedNode('recursive', publicKeyTypeNode())],
            });

            (idlWithSelfRef.program.instructions as any[]).push(
                instructionNode({
                    accounts: [
                        instructionAccountNode({
                            defaultValue: pdaValueNode(selfRefPda, [
                                pdaSeedValueNode('recursive', accountValueNode('recursive')),
                            ]),
                            isSigner: false,
                            isWritable: true,
                            name: 'recursive',
                        }),
                    ],
                    name: 'selfReferencePda',
                }),
            );

            const provider = createCodamaPdaProvider();
            const result = await provider.computePdas(
                idlWithSelfRef as unknown as SupportedIdl,
                'selfReferencePda',
                {},
                { recursive: 'Htp9MGP8Tig923ZFY7Qf2zzbMUmYneFRAhSp7vSg4wxV' },
            );

            expect(result.recursive.generated).toBeNull();
        });

        it('should return null for generated when two PDA accounts reference each other (A->B, B->A)', async () => {
            const idlWithCycle = JSON.parse(JSON.stringify(votingIdl)) as RootNode;

            const pdaANode = pdaNode({
                name: 'pdaA',
                seeds: [variablePdaSeedNode('pdaB', publicKeyTypeNode())],
            });
            const pdaBNode = pdaNode({
                name: 'pdaB',
                seeds: [variablePdaSeedNode('pdaA', publicKeyTypeNode())],
            });

            (idlWithCycle.program.instructions as any[]).push(
                instructionNode({
                    accounts: [
                        instructionAccountNode({
                            defaultValue: pdaValueNode(pdaANode, [pdaSeedValueNode('pdaB', accountValueNode('pdaB'))]),
                            isSigner: false,
                            isWritable: true,
                            name: 'pdaA',
                        }),
                        instructionAccountNode({
                            defaultValue: pdaValueNode(pdaBNode, [pdaSeedValueNode('pdaA', accountValueNode('pdaA'))]),
                            isSigner: false,
                            isWritable: true,
                            name: 'pdaB',
                        }),
                    ],
                    name: 'twoNodeCyclePda',
                }),
            );

            const provider = createCodamaPdaProvider();
            const someKey = 'Htp9MGP8Tig923ZFY7Qf2zzbMUmYneFRAhSp7vSg4wxV';
            const result = await provider.computePdas(
                idlWithCycle as unknown as SupportedIdl,
                'twoNodeCyclePda',
                {},
                { pdaA: someKey, pdaB: someKey },
            );

            expect(result.pdaA.generated).toBeNull();
            expect(result.pdaB.generated).toBeNull();
        });

        it('should resolve chained PDAs that do not form a cycle (level4->level3->level2->level1->signer)', async () => {
            const idlWithChain = JSON.parse(JSON.stringify(votingIdl)) as RootNode;

            const makeLevelPda = (name: string, seedName: string) =>
                pdaNode({
                    name,
                    seeds: [
                        constantPdaSeedNode(bytesTypeNode(), stringValueNode(name)),
                        variablePdaSeedNode(seedName, publicKeyTypeNode()),
                    ],
                });

            (idlWithChain.program.instructions as any[]).push(
                instructionNode({
                    accounts: [
                        instructionAccountNode({
                            isSigner: true,
                            isWritable: true,
                            name: 'signer',
                        }),
                        instructionAccountNode({
                            defaultValue: pdaValueNode(makeLevelPda('level1', 'signer'), [
                                pdaSeedValueNode('signer', accountValueNode('signer')),
                            ]),
                            isSigner: false,
                            isWritable: true,
                            name: 'level1',
                        }),
                        instructionAccountNode({
                            defaultValue: pdaValueNode(makeLevelPda('level2', 'level1'), [
                                pdaSeedValueNode('level1', accountValueNode('level1')),
                            ]),
                            isSigner: false,
                            isWritable: true,
                            name: 'level2',
                        }),
                        instructionAccountNode({
                            defaultValue: pdaValueNode(makeLevelPda('level3', 'level2'), [
                                pdaSeedValueNode('level2', accountValueNode('level2')),
                            ]),
                            isSigner: false,
                            isWritable: true,
                            name: 'level3',
                        }),
                        instructionAccountNode({
                            defaultValue: pdaValueNode(makeLevelPda('level4', 'level3'), [
                                pdaSeedValueNode('level3', accountValueNode('level3')),
                            ]),
                            isSigner: false,
                            isWritable: true,
                            name: 'level4',
                        }),
                    ],
                    name: 'fourLevelPda',
                }),
            );

            const provider = createCodamaPdaProvider();
            const signerKey = PublicKey.default.toBase58();
            const programId = new PublicKey(idlWithChain.program.publicKey);
            const levels = ['level1', 'level2', 'level3', 'level4'];

            // Pre-compute expected PDAs.
            const expected: Map<string, string> = new Map();
            let prevKey = new PublicKey(signerKey);
            for (const level of levels) {
                const [pda] = PublicKey.findProgramAddressSync([Buffer.from(level), prevKey.toBytes()], programId);
                expected.set(level, pda.toBase58());
                prevKey = pda;
            }

            // Each round resolves one more level, feeding it back as form input as its done in the UI.
            const formAccounts: Record<string, string | undefined> = { signer: signerKey };
            for (const level of levels) {
                const result = await provider.computePdas(
                    idlWithChain as unknown as SupportedIdl,
                    'fourLevelPda',
                    {},
                    formAccounts,
                );

                expect(result[level].generated).toBe(expected.get(level));
                formAccounts[level] = result[level].generated ?? undefined;
            }
        });
    });
});
