import type { SolanaRpc } from '@entities/cluster';
import { type AddressLookupTableAccount, Keypair, PublicKey, type VersionedMessage } from '@solana/web3.js';
import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { Cluster } from '@utils/cluster';
import type { InstructionLogs } from '@utils/program-logs';
import BN from 'bn.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createV1TransactionBytes, RECIPIENT } from '@/app/entities/transaction-data/__fixtures__/wire-transactions';
import { alloc, toBase64, writeU64LE, writeUint32LE } from '@/app/shared/lib/bytes';
import { parseTransactionBytes } from '@/app/shared/lib/parse-transaction-bytes';
import { bridgeV1MessageBytes } from '@/app/shared/lib/v1-message-bridge';
import { toKitAddress } from '@/app/shared/lib/web3js-compat';

// Mock VersionedTransaction so we don't need a real message header
vi.mock('@solana/web3.js', async () => {
    const actual = await vi.importActual('@solana/web3.js');
    return {
        ...actual,
        VersionedTransaction: vi.fn().mockImplementation(function (msg: unknown) {
            return { message: msg, serialize: () => new Uint8Array(0) };
        }),
    };
});

const mockParseProgramLogs = vi.fn();
vi.mock('@utils/program-logs', () => ({
    parseProgramLogs: (...args: unknown[]) => mockParseProgramLogs(...args),
}));

import { simulateTransaction } from '../simulate-transaction';

const ACCOUNT_KEY_1 = Keypair.generate().publicKey;
// Intentionally the Token program — this key doubles as an account key and a program owner
const ACCOUNT_KEY_2 = new PublicKey(TOKEN_PROGRAM_ADDRESS);
const MOCK_MINT = Keypair.generate().publicKey;
const MOCK_OWNER = Keypair.generate().publicKey;

describe('simulateTransaction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockParseProgramLogs.mockReturnValue([]);
    });

    it('should return parsed logs after successful simulation', async () => {
        const mockLogs: InstructionLogs[] = [
            {
                computeUnits: 150,
                failed: false,
                invokedProgram: SYSTEM_PROGRAM_ADDRESS,
                logs: [{ prefix: 'Program', style: 'success', text: 'success' }],
                truncated: false,
            },
        ];
        mockParseProgramLogs.mockReturnValue(mockLogs);

        const result = await simulate(createMockRpc());

        expect(result).toMatchObject({ error: undefined, logs: mockLogs });
    });

    it('should return units consumed from simulation response', async () => {
        const result = await simulate(createMockRpc());

        expect(result).toMatchObject({ unitsConsumed: 150 });
    });

    it('should compute SOL balance changes from simulation data', async () => {
        const result = await simulate(createMockRpc());

        expect(result.solBalanceChanges).toHaveLength(2);

        const change1 = result.solBalanceChanges?.find(c => c.pubkey.equals(ACCOUNT_KEY_1));
        expect(change1?.delta.eq(new BN(1_000_000_000))).toBe(true);
        expect(change1?.preBalance.eq(new BN(1_000_000_000))).toBe(true);
        expect(change1?.postBalance.eq(new BN(2_000_000_000))).toBe(true);

        const change2 = result.solBalanceChanges?.find(c => c.pubkey.equals(ACCOUNT_KEY_2));
        expect(change2?.delta.eq(new BN(-500_000_000))).toBe(true);
    });

    it('should use provided accountBalances instead of simulation data for SOL changes', async () => {
        const accountBalances = {
            postBalances: [5_000_000_000, 3_000_000_000],
            preBalances: [2_000_000_000, 4_000_000_000],
        };

        const result = await simulate(createMockRpc(), undefined, accountBalances);

        const change1 = result.solBalanceChanges?.find(c => c.pubkey.equals(ACCOUNT_KEY_1));
        expect(change1?.delta.eq(new BN(3_000_000_000))).toBe(true);

        const change2 = result.solBalanceChanges?.find(c => c.pubkey.equals(ACCOUNT_KEY_2));
        expect(change2?.delta.eq(new BN(-1_000_000_000))).toBe(true);
    });

    it('should return undefined solBalanceChanges when all deltas are zero', async () => {
        const rpc = createMockRpc({
            getMultipleAccounts: rpcCall({
                value: [
                    { data: {}, lamports: 2_000_000_000n, owner: SYSTEM_PROGRAM_ADDRESS },
                    { data: {}, lamports: 500_000_000n, owner: SYSTEM_PROGRAM_ADDRESS },
                ],
            }),
        });

        const result = await simulate(rpc);

        expect(result.solBalanceChanges).toBeUndefined();
    });

    it('should throw when simulation response has no accounts', async () => {
        const rpc = createMockRpc({
            simulateTransaction: rpcCall({
                value: { accounts: null, err: null, logs: [] },
            }),
        });

        await expect(simulate(rpc)).rejects.toThrow('RPC did not return account data after simulation');
    });

    it('should return raw error string when simulation returns error with empty logs', async () => {
        const rpc = createMockRpc({
            simulateTransaction: rpcCall(
                createSimulationResponse({
                    err: 'AccountNotFound',
                    logs: [],
                }),
            ),
        });

        const result = await simulate(rpc);

        expect(result).toMatchObject({ error: 'AccountNotFound', logs: undefined });
    });

    it('should return TransactionError when simulation has logs and an error', async () => {
        const mockLogs: InstructionLogs[] = [
            {
                computeUnits: 100,
                failed: true,
                invokedProgram: SYSTEM_PROGRAM_ADDRESS,
                logs: [{ prefix: 'Program', style: 'warning', text: 'failed' }],
                truncated: false,
            },
        ];
        mockParseProgramLogs.mockReturnValue(mockLogs);

        const rpc = createMockRpc({
            simulateTransaction: rpcCall(
                createSimulationResponse({
                    err: { InstructionError: [0, 'Custom'] },
                    logs: [`Program ${SYSTEM_PROGRAM_ADDRESS} invoke [1]`, 'Program failed'],
                }),
            ),
        });

        const result = await simulate(rpc);

        expect(result).toMatchObject({ error: 'TransactionError', logs: mockLogs });
    });

    it('should replace bigints inside a transaction error with numbers', async () => {
        mockParseProgramLogs.mockReturnValue([]);

        const rpc = createMockRpc({
            simulateTransaction: rpcCall(
                createSimulationResponse({
                    err: { InstructionError: [2n, { Custom: 6001n }] },
                    logs: ['Program failed'],
                }),
            ),
        });

        await simulate(rpc);

        expect(mockParseProgramLogs).toHaveBeenCalledWith(
            expect.any(Array),
            { InstructionError: [2, { Custom: 6001 }] },
            Cluster.Devnet,
        );
    });

    it('should pass logs, error, and cluster to parseProgramLogs', async () => {
        const rpc = createMockRpc();
        await simulate(rpc);

        expect(mockParseProgramLogs).toHaveBeenCalledWith(expect.any(Array), null, Cluster.Devnet);
    });

    it('should request simulation with replaceRecentBlockhash and account addresses', async () => {
        const rpc = createMockRpc();
        await simulate(rpc);

        expect(rpc.simulateTransaction).toHaveBeenCalledWith(expect.any(String), {
            accounts: {
                addresses: [toKitAddress(ACCOUNT_KEY_1), toKitAddress(ACCOUNT_KEY_2)],
                encoding: 'base64',
            },
            commitment: 'confirmed',
            encoding: 'base64',
            replaceRecentBlockhash: true,
        });
    });

    it('should resolve address lookup tables before simulation', async () => {
        const lookupTableKey = Keypair.generate().publicKey;
        const lookupAddress = Keypair.generate().publicKey;
        const message = createMockMessage({
            addressTableLookups: [{ accountKey: lookupTableKey, readonlyIndexes: [], writableIndexes: [0] }],
        });

        // Manually encode the lookup table binary format:
        // 4 bytes type, 8 bytes deactivation slot, 4+1 bytes padding, 1 byte authority option(0),
        // then 32-byte addresses
        const buf = alloc(56 + 32);
        const view = new DataView(buf.buffer);
        // Type discriminator (u32 LE) = 1
        writeUint32LE(buf, 1, 0);
        // Deactivation slot (u64 LE) = max u64
        view.setBigUint64(4, BigInt('18446744073709551615'), true);
        // Last extended slot (u64 LE) = 0
        view.setBigUint64(12, 0n, true);
        // Last extended slot start index (u8) = 0
        buf[20] = 0;
        // Authority option (u8) = 0 (none)
        buf[21] = 0;
        // Padding (2 bytes)
        // Addresses start at offset 56
        buf.set(lookupAddress.toBytes(), 56);

        const rpc = createMockRpc();
        // The first getMultipleAccounts call resolves the lookup table (base64); the second
        // fetches the parsed pre-simulation accounts and falls through to the factory default.
        vi.mocked(rpc.getMultipleAccounts).mockReturnValueOnce(
            sendResult({
                value: [
                    {
                        data: [toBase64(buf), 'base64'],
                        executable: false,
                        lamports: 1n,
                        owner: 'AddressLookupTab1e1111111111111111111111111',
                        rentEpoch: 0n,
                        space: 88n,
                    },
                ],
            }),
        );

        const result = await simulate(rpc, message);

        expect(rpc.getMultipleAccounts).toHaveBeenCalledWith(
            [toKitAddress(lookupTableKey)],
            expect.objectContaining({ encoding: 'base64' }),
        );
        // The resolved keys are what names each instruction's program downstream. A lookup-table address
        // appears only here, never in `staticAccountKeys`, so reading the program id from the message
        // alone would name the wrong program.
        expect(result.accountKeys).toEqual([ACCOUNT_KEY_1, ACCOUNT_KEY_2, lookupAddress]);
    });

    it('should return epoch from epochInfo', async () => {
        const rpc = createMockRpc({
            getEpochInfo: rpcCall({ epoch: 42n }),
        });

        const result = await simulate(rpc);

        expect(result.epoch).toBe(42n);
    });

    describe('token balance parsing', () => {
        const TOKEN_ACCOUNT_KEY = Keypair.generate().publicKey;
        const MINT_KEY = MOCK_MINT;
        const OWNER_KEY = MOCK_OWNER;

        function setupTokenAccountRpc(preAmount: bigint, postAmount: bigint, decimals = 6): SolanaRpc {
            const postTokenAccountBase64 = encodeTokenAccountBase64(MINT_KEY, OWNER_KEY, postAmount);
            const mintBase64 = encodeMintAccountBase64(decimals);

            return createMockRpc({
                getMultipleAccounts: rpcCall({
                    value: [
                        {
                            data: {
                                parsed: {
                                    info: {
                                        mint: MINT_KEY.toBase58(),
                                        owner: OWNER_KEY.toBase58(),
                                        tokenAmount: {
                                            amount: preAmount.toString(),
                                            decimals,
                                            uiAmount: Number(preAmount) / 10 ** decimals,
                                            uiAmountString: (Number(preAmount) / 10 ** decimals).toString(),
                                        },
                                    },
                                    type: 'account',
                                },
                                program: 'spl-token',
                                space: 165n,
                            },
                            lamports: 2_039_280n,
                            owner: TOKEN_PROGRAM_ADDRESS,
                        },
                        {
                            data: {
                                parsed: {
                                    info: { decimals, supply: '1000000000000' },
                                    type: 'mint',
                                },
                                program: 'spl-token',
                                space: 82n,
                            },
                            lamports: 1_000_000n,
                            owner: TOKEN_PROGRAM_ADDRESS,
                        },
                    ],
                }),
                simulateTransaction: rpcCall({
                    value: {
                        accounts: [
                            {
                                data: [postTokenAccountBase64, 'base64'],
                                executable: false,
                                lamports: 2_039_280n,
                                owner: TOKEN_PROGRAM_ADDRESS,
                                rentEpoch: 0n,
                            },
                            {
                                data: [mintBase64, 'base64'],
                                executable: false,
                                lamports: 1_000_000n,
                                owner: TOKEN_PROGRAM_ADDRESS,
                                rentEpoch: 0n,
                            },
                        ],
                        err: null,
                        logs: [
                            `Program ${TOKEN_PROGRAM_ADDRESS} invoke [1]`,
                            `Program ${TOKEN_PROGRAM_ADDRESS} success`,
                        ],
                        unitsConsumed: 200n,
                    },
                }),
            });
        }

        function createTokenMessage(): VersionedMessage {
            return createMockMessage({
                getAccountKeys: () => ({
                    keySegments: () => [[TOKEN_ACCOUNT_KEY, MINT_KEY]],
                }),
            });
        }

        it('should decode post-simulation token account data and return token balance data', async () => {
            const preAmount = 1_000_000n;
            const postAmount = 2_500_000n;
            const rpc = setupTokenAccountRpc(preAmount, postAmount);

            const result = await simulate(rpc, createTokenMessage());

            expect(result).toMatchObject({ error: undefined });
            if (!result.tokenBalanceData) throw new Error('expected tokenBalanceData');

            const { preTokenBalances, postTokenBalances } = result.tokenBalanceData;

            expect(preTokenBalances).toHaveLength(1);
            expect(preTokenBalances[0]).toMatchObject({ mint: MINT_KEY.toBase58(), owner: OWNER_KEY.toBase58() });

            expect(postTokenBalances).toHaveLength(1);
            expect(postTokenBalances[0]).toMatchObject({
                mint: MINT_KEY.toBase58(),
                owner: OWNER_KEY.toBase58(),
                uiTokenAmount: { amount: postAmount.toString(), decimals: 6 },
            });
        });

        it('should handle token accounts with zero amount', async () => {
            const rpc = setupTokenAccountRpc(0n, 0n);

            const result = await simulate(rpc, createTokenMessage());

            expect(result).toMatchObject({ error: undefined });
            expect(result.tokenBalanceData?.postTokenBalances[0]).toMatchObject({ uiTokenAmount: { amount: '0' } });
        });

        it('should handle large token amounts without overflow', async () => {
            const largeAmount = 9_000_000_000_000_000n;
            const rpc = setupTokenAccountRpc(0n, largeAmount);

            const result = await simulate(rpc, createTokenMessage());

            expect(result).toMatchObject({ error: undefined });
            expect(result.tokenBalanceData?.postTokenBalances[0]).toMatchObject({
                uiTokenAmount: { amount: largeAmount.toString() },
            });
        });
    });
});

describe('v1 transactions', () => {
    function v1Message(config: Parameters<typeof createV1TransactionBytes>[0] = {}): VersionedMessage {
        return bridgeV1MessageBytes(parseTransactionBytes(createV1TransactionBytes(config)).messageBytes).message;
    }

    function rpcWithFeature(activated: boolean, overrides?: Partial<Record<string, unknown>>): SolanaRpc {
        return createMockRpc({
            getAccountInfo: rpcCall({
                value: {
                    data: [
                        toBase64(activated ? new Uint8Array([1, 42, 0, 0, 0, 0, 0, 0, 0]) : new Uint8Array(9)),
                        'base64',
                    ],
                },
            }),
            ...overrides,
        });
    }

    it('should name the feature gate when the node rejects the simulation request outright', async () => {
        const rpc = rpcWithFeature(false, {
            simulateTransaction: rpcReject(new Error('invalid transaction: UnsupportedVersion')),
        });

        await expect(simulate(rpc, v1Message())).rejects.toThrow('does not support v1 transactions');
    });

    it('should name the feature gate when the node returns UnsupportedVersion as a simulation error', async () => {
        const rpc = rpcWithFeature(false, {
            simulateTransaction: rpcCall(createSimulationResponse({ err: 'UnsupportedVersion', logs: [] })),
        });

        const result = await simulate(rpc, v1Message());

        expect(result.error).toContain('does not support v1 transactions');
    });

    it('should surface the original failure when the cluster does support v1', async () => {
        const rpc = rpcWithFeature(true, {
            simulateTransaction: rpcReject(new Error('rpc down')),
        });

        await expect(simulate(rpc, v1Message())).rejects.toThrow('rpc down');
    });

    it('should surface the original failure when the feature gate cannot be read', async () => {
        const rpc = createMockRpc({
            getAccountInfo: rpcReject(new Error('gate unreadable')),
            simulateTransaction: rpcReject(new Error('rpc down')),
        });

        await expect(simulate(rpc, v1Message())).rejects.toThrow('rpc down');
    });

    it('should name the feature gate when UnsupportedVersion arrives alongside logs', async () => {
        const rpc = rpcWithFeature(false, {
            simulateTransaction: rpcCall(
                createSimulationResponse({ err: 'UnsupportedVersion', logs: ['Program log: something'] }),
            ),
        });

        const result = await simulate(rpc, v1Message());

        expect(result.error).toContain('does not support v1 transactions');
    });

    it('should keep the original failure as the cause of the feature gate error', async () => {
        const cause = new Error('429 Too Many Requests');
        const rpc = rpcWithFeature(false, {
            simulateTransaction: rpcReject(cause),
        });

        await expect(simulate(rpc, v1Message())).rejects.toMatchObject({ cause });
    });

    it('should not read the feature gate when a v1 simulation succeeds', async () => {
        const rpc = rpcWithFeature(true);

        await simulate(rpc, v1Message());

        expect(rpc.simulateTransaction).toHaveBeenCalled();
        expect(rpc.getAccountInfo).not.toHaveBeenCalled();
    });

    describe('MaxLoadedAccountsDataSizeExceeded', () => {
        const UPGRADEABLE_LOADER = new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');
        const PROGRAM_DATA_KEY = Keypair.generate().publicKey;

        // The fee payer is empty, the recipient does not exist, and the program holds 74,800 bytes:
        // the runtime loads 74,800 bytes of data and charges 64 bytes for each of the two accounts.
        const PARSED_ACCOUNTS = [
            { data: ['', 'base64'], owner: SYSTEM_PROGRAM_ADDRESS },
            null,
            { data: { parsed: {}, program: 'memo', space: 74_800n }, owner: SYSTEM_PROGRAM_ADDRESS },
        ];

        function rpcRejectingForSize(accounts: unknown[] = PARSED_ACCOUNTS, programData: unknown[] = []): SolanaRpc {
            return rpcWithFeature(true, {
                getMultipleAccounts: vi
                    .fn()
                    .mockReturnValueOnce(sendResult({ value: accounts }))
                    .mockReturnValue(sendResult({ value: programData })),
                simulateTransaction: rpcCall(
                    createSimulationResponse({ err: 'MaxLoadedAccountsDataSizeExceeded', logs: [] }),
                ),
            });
        }

        it('should report the size the runtime loaded against the limit the message sets', async () => {
            const message = v1Message({ loadedAccountsDataSizeLimit: 74_900 });

            const result = await simulate(rpcRejectingForSize(), message);

            expect(result.error).toContain('this transaction loads 74,928 bytes');
            expect(result.error).toContain('74,800 bytes of account data');
            expect(result.error).toContain('64 bytes of metadata for each of the 2 accounts it names');
            expect(result.error).toContain('above the 74,900 byte limit set in the v1 message config');
        });

        it('should count the program data account of an upgradeable program', async () => {
            const programAccount = {
                data: { parsed: { info: { programData: PROGRAM_DATA_KEY.toBase58() } }, program: 'x', space: 36n },
                executable: true,
                owner: UPGRADEABLE_LOADER.toBase58(),
            };
            // The first lookup returns the message's accounts, the second the program data account
            // behind the upgradeable program, which the message never lists
            const rpc = rpcRejectingForSize(
                [{ data: ['', 'base64'], owner: SYSTEM_PROGRAM_ADDRESS }, programAccount],
                [{ data: { parsed: {}, program: 'x', space: 500_000n }, owner: UPGRADEABLE_LOADER.toBase58() }],
            );

            const result = await simulate(rpc, v1Message({ loadedAccountsDataSizeLimit: 1024 }));

            // 500,036 bytes of data across three accounts, each charged 64 bytes of metadata
            expect(result.error).toContain('this transaction loads 500,228 bytes');
            expect(result.error).toContain('for each of the 3 accounts it names');
        });

        it('should count a program data account the message lists only once', async () => {
            const programAccount = {
                data: { parsed: { info: { programData: RECIPIENT } }, program: 'x', space: 36n },
                executable: true,
                owner: UPGRADEABLE_LOADER.toBase58(),
            };
            // RECIPIENT is the message's second account key, so the program's program data account
            // is already among the accounts the first lookup returned
            const rpc = rpcRejectingForSize([
                programAccount,
                { data: { parsed: {}, program: 'x', space: 500_000n }, owner: UPGRADEABLE_LOADER.toBase58() },
            ]);

            const result = await simulate(rpc, v1Message({ loadedAccountsDataSizeLimit: 1024 }));

            // 500,036 bytes of data across two accounts, each charged 64 bytes of metadata
            expect(result.error).toContain('this transaction loads 500,164 bytes');
            expect(result.error).toContain('for each of the 2 accounts it names');
        });

        it('should not look up program data for a non-executable loader-owned account', async () => {
            const rpc = rpcRejectingForSize([
                { data: ['', 'base64'], owner: SYSTEM_PROGRAM_ADDRESS },
                {
                    data: { parsed: {}, program: 'x', space: 500_000n },
                    executable: false,
                    owner: UPGRADEABLE_LOADER.toBase58(),
                },
            ]);

            const result = await simulate(rpc, v1Message({ loadedAccountsDataSizeLimit: 1024 }));

            expect(rpc.getMultipleAccounts).toHaveBeenCalledTimes(1);
            expect(result.error).toContain('this transaction loads 500,128 bytes');
        });

        it('should report the size as a floor when the accounts it can see fit under the limit', async () => {
            const result = await simulate(rpcRejectingForSize(), v1Message({ loadedAccountsDataSizeLimit: 200_000 }));

            expect(result.error).toContain('this transaction loads at least 74,928 bytes');
            expect(result.error).toContain('within the 200,000 byte limit set in the v1 message config');
            expect(result.error).toContain('accounts the message does not name');
            expect(result.error).not.toContain('above the');
        });

        it('should explain the failure even when the RPC returns it alongside logs', async () => {
            const rpc = rpcWithFeature(true, {
                getMultipleAccounts: vi
                    .fn()
                    .mockReturnValueOnce(sendResult({ value: PARSED_ACCOUNTS }))
                    .mockReturnValue(sendResult({ value: [] })),
                simulateTransaction: rpcCall(
                    createSimulationResponse({
                        err: 'MaxLoadedAccountsDataSizeExceeded',
                        logs: ['Program failed to load accounts'],
                    }),
                ),
            });

            const result = await simulate(rpc, v1Message({ loadedAccountsDataSizeLimit: 74_900 }));

            expect(result.error).toContain('this transaction loads 74,928 bytes');
        });

        it('should name the unset limit as zero when the message sets none', async () => {
            const result = await simulate(rpcRejectingForSize(), v1Message());

            expect(result.error).toContain('this transaction loads 74,928 bytes');
            expect(result.error).toContain('sets no loaded accounts data size limit');
        });

        it('should surface the raw error when the program data lookup fails', async () => {
            const rpc = rpcRejectingForSize([
                {
                    data: { parsed: { info: { programData: PROGRAM_DATA_KEY.toBase58() } }, program: 'x', space: 36n },
                    executable: true,
                    owner: UPGRADEABLE_LOADER.toBase58(),
                },
            ]);
            // The queue holds the message accounts first; this makes the second call — the
            // program data lookup — fail.
            vi.mocked(rpc.getMultipleAccounts).mockReturnValueOnce(sendError(new Error('rpc down')));

            const result = await simulate(rpc, v1Message({ loadedAccountsDataSizeLimit: 1024 }));

            expect(result.error).toBe('MaxLoadedAccountsDataSizeExceeded');
        });

        it('should surface the raw error for a non-v1 message', async () => {
            const rpc = createMockRpc({
                simulateTransaction: rpcCall(
                    createSimulationResponse({ err: 'MaxLoadedAccountsDataSizeExceeded', logs: [] }),
                ),
            });

            const result = await simulate(rpc);

            expect(result.error).toBe('MaxLoadedAccountsDataSizeExceeded');
        });
    });

    it('should not read the feature gate for a non-v1 message', async () => {
        const rpc = rpcWithFeature(false);

        await simulate(rpc);

        expect(rpc.getAccountInfo).not.toHaveBeenCalled();
    });
});

/** A pending kit rpc call: `rpc.method(...)` returns an object whose `send()` resolves the result. */
function sendResult(result: unknown) {
    return { send: vi.fn().mockResolvedValue(result) } as never;
}

/** Mock of a kit rpc method whose `send()` resolves `result` on every call. */
function rpcCall(result: unknown) {
    return vi.fn().mockReturnValue(sendResult(result));
}

/** A pending kit rpc call whose `send()` rejects with `error`. */
function sendError(error: Error) {
    return { send: vi.fn().mockRejectedValue(error) } as never;
}

/** Mock of a kit rpc method whose `send()` rejects with `error` on every call. */
function rpcReject(error: Error) {
    return vi.fn().mockReturnValue(sendError(error));
}

function createMockRpc(overrides?: Partial<Record<string, unknown>>): SolanaRpc {
    return {
        getAccountInfo: rpcCall({ value: null }),
        getEpochInfo: rpcCall({ epoch: 100n }),
        getMultipleAccounts: rpcCall({
            value: [
                { data: {}, lamports: 1_000_000_000n, owner: SYSTEM_PROGRAM_ADDRESS },
                { data: {}, lamports: 1_000_000_000n, owner: SYSTEM_PROGRAM_ADDRESS },
            ],
        }),
        simulateTransaction: rpcCall(createSimulationResponse()),
        ...overrides,
    } as unknown as SolanaRpc;
}

// Partial<VersionedMessage> is too strict for test mocks — getAccountKeys
// returns a minimal stub, not a full MessageAccountKeys.
function createMockMessage(overrides?: Partial<Record<string, unknown>>): VersionedMessage {
    return {
        addressTableLookups: [],
        // Mirrors MessageV0: the static keys first, then a segment per resolved lookup table. The
        // argument has to matter here — a mock that always returns the static keys cannot tell a
        // caller reading `staticAccountKeys` apart from one reading the resolved keys.
        getAccountKeys: ({
            addressLookupTableAccounts = [],
        }: { addressLookupTableAccounts?: AddressLookupTableAccount[] } = {}) => ({
            keySegments: () => [
                [ACCOUNT_KEY_1, ACCOUNT_KEY_2],
                ...addressLookupTableAccounts.map(table => table.state.addresses),
            ],
        }),
        ...overrides,
    } as unknown as VersionedMessage;
}

function createSimulationResponse(overrides?: Record<string, unknown>) {
    return {
        value: {
            accounts: [
                {
                    data: ['', 'base64'],
                    executable: false,
                    lamports: 2_000_000_000n,
                    owner: SYSTEM_PROGRAM_ADDRESS,
                    rentEpoch: 0n,
                },
                {
                    data: ['', 'base64'],
                    executable: false,
                    lamports: 500_000_000n,
                    owner: SYSTEM_PROGRAM_ADDRESS,
                    rentEpoch: 0n,
                },
            ],
            err: null,
            logs: [`Program ${SYSTEM_PROGRAM_ADDRESS} invoke [1]`, `Program ${SYSTEM_PROGRAM_ADDRESS} success`],
            unitsConsumed: 150n,
            ...overrides,
        },
    };
}

function simulate(
    rpc: SolanaRpc,
    message?: VersionedMessage,
    accountBalances?: { preBalances: number[]; postBalances: number[] },
) {
    return simulateTransaction({
        accountBalances,
        cluster: Cluster.Devnet,
        message: message ?? createMockMessage(),
        rpc,
    });
}

/**
 * Build a 165-byte token account buffer matching AccountLayout, so that
 * AccountLayout.decode in the production code exercises the real decode path.
 */
function encodeTokenAccountBase64(mint: PublicKey, owner: PublicKey, amount: bigint): string {
    const buf = alloc(165);
    let offset = 0;

    buf.set(mint.toBytes(), offset);
    offset += 32;
    buf.set(owner.toBytes(), offset);
    offset += 32;
    buf.set(writeU64LE(amount), offset);
    offset += 8;
    writeUint32LE(buf, 0, offset);
    offset += 4;
    offset += 32;
    buf[offset] = 1;

    return toBase64(buf);
}

/**
 * Build a mint account buffer (82 bytes) for getMintDecimals to parse.
 */
function encodeMintAccountBase64(decimals: number): string {
    const buf = alloc(82);
    buf[44] = decimals;
    buf[45] = 1;
    return toBase64(buf);
}
