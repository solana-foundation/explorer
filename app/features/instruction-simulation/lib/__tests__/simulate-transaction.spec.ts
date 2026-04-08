import { type Connection, PublicKey, type VersionedMessage } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import type { InstructionLogs } from '@utils/program-logs';
import BN from 'bn.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { alloc, toBase64, writeU64LE, writeUint32LE } from '@/app/shared/lib/bytes';

// Mock VersionedTransaction so we don't need a real message header
vi.mock('@solana/web3.js', async () => {
    const actual = await vi.importActual('@solana/web3.js');
    return {
        ...actual,
        VersionedTransaction: vi.fn().mockImplementation((msg: unknown) => ({ message: msg })),
    };
});

const mockParseProgramLogs = vi.fn();
vi.mock('@utils/program-logs', () => ({
    parseProgramLogs: (...args: unknown[]) => mockParseProgramLogs(...args),
}));

import { simulateTransaction } from '../simulate-transaction';

const ACCOUNT_KEY_1 = new PublicKey('GjwcWFQYzemBtpUoN5fMAP2FZviTtMRWCmrppGuTthJS');
const ACCOUNT_KEY_2 = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const MOCK_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const MOCK_OWNER = new PublicKey('5ZiE3vAkrdXBgyFL7KqG3RoEGBws8CjY8AsGq1MuR5My');

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
                invokedProgram: '11111111111111111111111111111111',
                logs: [{ prefix: 'Program', style: 'success', text: 'success' }],
                truncated: false,
            },
        ];
        mockParseProgramLogs.mockReturnValue(mockLogs);

        const result = await simulate(createMockConnection());

        expect(result).toMatchObject({ error: undefined, logs: mockLogs });
    });

    it('should return units consumed from simulation response', async () => {
        const result = await simulate(createMockConnection());

        expect(result).toMatchObject({ unitsConsumed: 150 });
    });

    it('should compute SOL balance changes from simulation data', async () => {
        const result = await simulate(createMockConnection());

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

        const result = await simulate(createMockConnection(), undefined, accountBalances);

        const change1 = result.solBalanceChanges?.find(c => c.pubkey.equals(ACCOUNT_KEY_1));
        expect(change1?.delta.eq(new BN(3_000_000_000))).toBe(true);

        const change2 = result.solBalanceChanges?.find(c => c.pubkey.equals(ACCOUNT_KEY_2));
        expect(change2?.delta.eq(new BN(-1_000_000_000))).toBe(true);
    });

    it('should return undefined solBalanceChanges when all deltas are zero', async () => {
        const connection = createMockConnection({
            getMultipleParsedAccounts: vi.fn().mockResolvedValue({
                value: [
                    { data: {}, lamports: 2_000_000_000, owner: new PublicKey('11111111111111111111111111111111') },
                    { data: {}, lamports: 500_000_000, owner: new PublicKey('11111111111111111111111111111111') },
                ],
            }),
        });

        const result = await simulate(connection);

        expect(result.solBalanceChanges).toBeUndefined();
    });

    it('should throw when simulation response has no accounts', async () => {
        const connection = createMockConnection({
            simulateTransaction: vi.fn().mockResolvedValue({
                value: { accounts: null, err: null, logs: [] },
            }),
        });

        await expect(simulate(connection)).rejects.toThrow('RPC did not return account data after simulation');
    });

    it('should return TransactionError when simulation returns error string with empty logs', async () => {
        const connection = createMockConnection({
            simulateTransaction: vi.fn().mockResolvedValue(
                createSimulationResponse({
                    err: 'AccountNotFound',
                    logs: [],
                }),
            ),
        });

        const result = await simulate(connection);

        expect(result).toMatchObject({ error: 'TransactionError', logs: undefined });
    });

    it('should return TransactionError when simulation has logs and an error', async () => {
        const mockLogs: InstructionLogs[] = [
            {
                computeUnits: 100,
                failed: true,
                invokedProgram: '11111111111111111111111111111111',
                logs: [{ prefix: 'Program', style: 'warning', text: 'failed' }],
                truncated: false,
            },
        ];
        mockParseProgramLogs.mockReturnValue(mockLogs);

        const connection = createMockConnection({
            simulateTransaction: vi.fn().mockResolvedValue(
                createSimulationResponse({
                    err: { InstructionError: [0, 'Custom'] },
                    logs: ['Program 11111111111111111111111111111111 invoke [1]', 'Program failed'],
                }),
            ),
        });

        const result = await simulate(connection);

        expect(result).toMatchObject({ error: 'TransactionError', logs: mockLogs });
    });

    it('should pass logs, error, and cluster to parseProgramLogs', async () => {
        const connection = createMockConnection();
        await simulate(connection);

        expect(mockParseProgramLogs).toHaveBeenCalledWith(expect.any(Array), null, Cluster.Devnet);
    });

    it('should request simulation with replaceRecentBlockhash and account addresses', async () => {
        const connection = createMockConnection();
        await simulate(connection);

        expect(connection.simulateTransaction).toHaveBeenCalledWith(expect.anything(), {
            accounts: {
                addresses: [ACCOUNT_KEY_1.toBase58(), ACCOUNT_KEY_2.toBase58()],
                encoding: 'base64',
            },
            replaceRecentBlockhash: true,
        });
    });

    it('should resolve address lookup tables before simulation', async () => {
        const lookupTableKey = new PublicKey('9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin');
        const lookupAddress = new PublicKey('GjwcWFQYzemBtpUoN5fMAP2FZviTtMRWCmrppGuTthJS');
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

        const connection = createMockConnection({
            getMultipleAccountsInfo: vi.fn().mockResolvedValue([
                {
                    data: buf,
                    executable: false,
                    lamports: 1,
                    owner: new PublicKey('AddressLookupTab1e1111111111111111111111111'),
                    rentEpoch: 0,
                },
            ]),
        });

        await simulate(connection, message);

        expect(connection.getMultipleAccountsInfo).toHaveBeenCalledWith([lookupTableKey]);
    });

    it('should return epoch from epochInfo', async () => {
        const connection = createMockConnection({
            getEpochInfo: vi.fn().mockResolvedValue({ epoch: 42 }),
        });

        const result = await simulate(connection);

        expect(result.epoch).toBe(42n);
    });

    describe('token balance parsing', () => {
        const TOKEN_ACCOUNT_KEY = new PublicKey('3kzAHRgraoYwJY7CSS2HoNvfRXBM4rBUFh4x9mHBMbYW');
        const MINT_KEY = MOCK_MINT;
        const OWNER_KEY = MOCK_OWNER;

        function setupTokenAccountConnection(preAmount: bigint, postAmount: bigint, decimals = 6): Connection {
            const postTokenAccountBase64 = encodeTokenAccountBase64(MINT_KEY, OWNER_KEY, postAmount);
            const mintBase64 = encodeMintAccountBase64(decimals);

            return createMockConnection({
                getMultipleParsedAccounts: vi.fn().mockResolvedValue({
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
                            },
                            lamports: 2_039_280,
                            owner: new PublicKey(TOKEN_PROGRAM_ID),
                        },
                        {
                            data: {
                                parsed: {
                                    info: { decimals, supply: '1000000000000' },
                                    type: 'mint',
                                },
                                program: 'spl-token',
                            },
                            lamports: 1_000_000,
                            owner: new PublicKey(TOKEN_PROGRAM_ID),
                        },
                    ],
                }),
                simulateTransaction: vi.fn().mockResolvedValue({
                    value: {
                        accounts: [
                            {
                                data: [postTokenAccountBase64, 'base64'],
                                executable: false,
                                lamports: 2_039_280,
                                owner: TOKEN_PROGRAM_ID,
                                rentEpoch: 0,
                            },
                            {
                                data: [mintBase64, 'base64'],
                                executable: false,
                                lamports: 1_000_000,
                                owner: TOKEN_PROGRAM_ID,
                                rentEpoch: 0,
                            },
                        ],
                        err: null,
                        logs: [
                            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]',
                            'Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success',
                        ],
                        unitsConsumed: 200,
                    },
                }),
            });
        }

        function createTokenMessage(): VersionedMessage {
            return createMockMessage({
                getAccountKeys: () => ({
                    staticAccountKeys: [TOKEN_ACCOUNT_KEY, MINT_KEY],
                }),
            });
        }

        it('should decode post-simulation token account data and return token balance data', async () => {
            const preAmount = 1_000_000n;
            const postAmount = 2_500_000n;
            const connection = setupTokenAccountConnection(preAmount, postAmount);

            const result = await simulate(connection, createTokenMessage());

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
            const connection = setupTokenAccountConnection(0n, 0n);

            const result = await simulate(connection, createTokenMessage());

            expect(result).toMatchObject({ error: undefined });
            expect(result.tokenBalanceData?.postTokenBalances[0]).toMatchObject({ uiTokenAmount: { amount: '0' } });
        });

        it('should handle large token amounts without overflow', async () => {
            const largeAmount = 9_000_000_000_000_000n;
            const connection = setupTokenAccountConnection(0n, largeAmount);

            const result = await simulate(connection, createTokenMessage());

            expect(result).toMatchObject({ error: undefined });
            expect(result.tokenBalanceData?.postTokenBalances[0]).toMatchObject({
                uiTokenAmount: { amount: largeAmount.toString() },
            });
        });
    });
});

function createMockConnection(overrides?: Partial<Connection>): Connection {
    return {
        getEpochInfo: vi.fn().mockResolvedValue({ epoch: 100 }),
        getMultipleAccountsInfo: vi.fn().mockResolvedValue([]),
        getMultipleParsedAccounts: vi.fn().mockResolvedValue({
            value: [
                { data: {}, lamports: 1_000_000_000, owner: new PublicKey('11111111111111111111111111111111') },
                { data: {}, lamports: 1_000_000_000, owner: new PublicKey('11111111111111111111111111111111') },
            ],
        }),
        simulateTransaction: vi.fn().mockResolvedValue(createSimulationResponse()),
        ...overrides,
    } as unknown as Connection;
}

function createMockMessage(overrides?: Partial<VersionedMessage>): VersionedMessage {
    return {
        addressTableLookups: [],
        getAccountKeys: () => ({
            staticAccountKeys: [ACCOUNT_KEY_1, ACCOUNT_KEY_2],
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
                    lamports: 2_000_000_000,
                    owner: '11111111111111111111111111111111',
                    rentEpoch: 0,
                },
                {
                    data: ['', 'base64'],
                    executable: false,
                    lamports: 500_000_000,
                    owner: '11111111111111111111111111111111',
                    rentEpoch: 0,
                },
            ],
            err: null,
            logs: [
                'Program 11111111111111111111111111111111 invoke [1]',
                'Program 11111111111111111111111111111111 success',
            ],
            unitsConsumed: 150,
            ...overrides,
        },
    };
}

function simulate(
    connection: Connection,
    message?: VersionedMessage,
    accountBalances?: { preBalances: number[]; postBalances: number[] },
) {
    return simulateTransaction({
        accountBalances,
        cluster: Cluster.Devnet,
        connection,
        message: message ?? createMockMessage(),
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
