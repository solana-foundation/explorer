import { AccountInfo, clusterApiUrl, ConfirmedSignatureInfo, Connection, PublicKey } from '@solana/web3.js';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { vi } from 'vitest';

const USE_REAL_RPC = process.env.TEST_USE_REAL_RPC === 'true';
const FIXTURES_DIR = join(__dirname, 'fixtures', 'rpc-responses');

type SerializedBigInt = {
    __type: 'bigint';
    __value: string;
};

type SerializedPublicKey = {
    __type: 'PublicKey';
    __value: string;
};

type SerializedUint8Array = {
    __type: 'Uint8Array';
    __value: number[];
};

function isPublicKey(value: unknown): value is PublicKey {
    const res =
        value !== null &&
        typeof value === 'object' &&
        'toBase58' in value &&
        typeof (value as any).toBase58 === 'function' &&
        'toBytes' in value &&
        typeof (value as any).toBytes === 'function';
    return res;
}

function isBigInt(value: unknown): value is bigint {
    return typeof value === 'bigint';
}

function isUint8Array(value: unknown): value is Uint8Array {
    return (
        value !== null &&
        typeof value === 'object' &&
        'buffer' in value &&
        'byteLength' in value &&
        'BYTES_PER_ELEMENT' in value &&
        (value as any).BYTES_PER_ELEMENT === 1
    );
}

type SerializedType = SerializedBigInt | SerializedPublicKey | SerializedUint8Array;

if (!existsSync(FIXTURES_DIR)) {
    mkdirSync(FIXTURES_DIR, { recursive: true });
}

function hashParams(method: string, params: any[]): string {
    const paramsStr = params
        .map(p => {
            if (typeof p === 'object' && p !== null && 'toString' in p) {
                return p.toString();
            }
            return JSON.stringify(p);
        })
        .join('|');

    let hash = 0;
    for (let i = 0; i < paramsStr.length; i++) {
        const char = paramsStr.charCodeAt(i);
        hash = (hash << 5) - hash + char;
    }

    return `${method}-${Math.abs(hash).toString(36)}`;
}

function preprocessForSerialization(data: any, seen = new WeakSet()): any {
    if (data === null || data === undefined) {
        return data;
    }

    if (isBigInt(data)) {
        return {
            __type: 'bigint',
            __value: data.toString(),
        } as SerializedBigInt;
    }

    if (typeof data !== 'object') {
        return data;
    }

    if (seen.has(data)) {
        throw Error(`Circular object. Cannot apply JSON.stringify()`);
    }
    seen.add(data);

    if (isPublicKey(data)) {
        return {
            __type: 'PublicKey',
            __value: data.toBase58(),
        } as SerializedPublicKey;
    }

    if (isUint8Array(data)) {
        return {
            __type: 'Uint8Array',
            __value: Array.from(data),
        } as SerializedUint8Array;
    }

    if (Array.isArray(data)) {
        return data.map(item => preprocessForSerialization(item, seen));
    }

    const result: any = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            result[key] = preprocessForSerialization(data[key], seen);
        }
    }
    return result;
}

function saveFixture(filename: string, data: any): void {
    const filepath = join(FIXTURES_DIR, `${filename}.json`);
    // Preprocess to catch PublicKey and other special types before JSON.stringify
    const preprocessed = preprocessForSerialization(data);
    writeFileSync(filepath, JSON.stringify(preprocessed, null, 2), 'utf-8');
}

function loadFixture(filename: string): any | null {
    const filepath = join(FIXTURES_DIR, `${filename}.json`);

    if (!existsSync(filepath)) {
        return null;
    }
    try {
        return JSON.parse(readFileSync(filepath, 'utf-8'), (_, value) => {
            if (value && typeof value === 'object' && '__type' in value) {
                const serialized = value as SerializedType;

                switch (serialized.__type) {
                    case 'bigint':
                        return BigInt((serialized as SerializedBigInt).__value);

                    case 'PublicKey':
                        return new PublicKey((serialized as SerializedPublicKey).__value);

                    case 'Uint8Array':
                        return new Uint8Array((serialized as SerializedUint8Array).__value);

                    default:
                        return value;
                }
            }
            return value;
        });
    } catch (error) {
        throw new Error(`Failed to load fixture ${filename}:`);
    }
}

function recordReplay<T>(testName: string, method: string, params: any[], realCall: () => Promise<T>): Promise<T> {
    const filename = `${testName}-${hashParams(method, params)}`;

    if (USE_REAL_RPC) {
        return realCall().then(result => {
            saveFixture(filename, result);
            return result;
        });
    }

    const fixture = loadFixture(filename);
    if (fixture !== null) {
        return Promise.resolve(fixture as T);
    }

    throw new Error(
        `No fixture found for ${method} with params: ${JSON.stringify(params)}\n` +
            `Expected fixture file: ${filename}.json\n` +
            `To record this fixture, run tests with: TEST_USE_REAL_RPC=true npm test`
    );
}

export function createMockConnection(testName: string, realConnection?: Connection): Connection {
    if (USE_REAL_RPC && !realConnection) {
        throw new Error(
            'TEST_USE_REAL_RPC is enabled but no real connection provided. ' +
                'Pass a real Connection instance as the second parameter.'
        );
    }

    const mockConnection = {
        getAccountInfo: vi.fn(
            async (publicKey: PublicKey, commitmentOrConfig?: any): Promise<AccountInfo<Buffer> | null> => {
                return recordReplay(testName, 'getAccountInfo', [publicKey.toString(), commitmentOrConfig], () =>
                    realConnection!.getAccountInfo(publicKey, commitmentOrConfig)
                );
            }
        ),

        getAddressLookupTable: vi.fn(async (accountKey: PublicKey) => {
            return recordReplay(testName, 'getAddressLookupTable', [accountKey.toString()], () =>
                realConnection!.getAddressLookupTable(accountKey)
            );
        }),

        getBalance: vi.fn(async (publicKey: PublicKey, commitmentOrConfig?: any): Promise<number> => {
            return recordReplay(testName, 'getBalance', [publicKey.toString(), commitmentOrConfig], () =>
                realConnection!.getBalance(publicKey, commitmentOrConfig)
            );
        }),

        getParsedAccountInfo: vi.fn(async (publicKey: PublicKey, commitmentOrConfig?: any) => {
            return recordReplay(testName, 'getParsedAccountInfo', [publicKey.toString(), commitmentOrConfig], () =>
                realConnection!.getParsedAccountInfo(publicKey, commitmentOrConfig)
            );
        }),

        getSignaturesForAddress: vi.fn(async (address: PublicKey, options?: any): Promise<ConfirmedSignatureInfo[]> => {
            return recordReplay(testName, 'getSignaturesForAddress', [address.toString(), options], () =>
                realConnection!.getSignaturesForAddress(address, options)
            );
        }),

        getTokenAccountBalance: vi.fn(async (tokenAccount: PublicKey, commitment?: any) => {
            return recordReplay(testName, 'getTokenAccountBalance', [tokenAccount.toString(), commitment], () =>
                realConnection!.getTokenAccountBalance(tokenAccount, commitment)
            );
        }),
    };

    return mockConnection as unknown as Connection;
}

export function mockSolanaWeb3(testName: string, actual: any, realConnection?: Connection) {
    return {
        ...actual,
        Connection: vi.fn(() => createMockConnection(testName, realConnection)),
        clusterApiUrl: vi.fn(() => 'https://mock-rpc.solana.com'),
    };
}

export interface SolanaKitMockOptions {
    epochInfo?: {
        absoluteSlot: bigint;
        blockHeight: bigint;
        epoch: bigint;
        slotIndex: bigint;
        slotsInEpoch: bigint;
    };
    epochSchedule?: {
        firstNormalEpoch: bigint;
        firstNormalSlot: bigint;
        leaderScheduleSlotOffset: bigint;
        slotsPerEpoch: bigint;
        warmup: boolean;
    };
    firstAvailableBlock?: bigint;
}

export function mockSolanaKit(options: SolanaKitMockOptions = {}) {
    return {
        address: vi.fn((addr: string) => addr),
        createSolanaRpc: vi.fn(() => ({
            getEpochInfo: vi.fn(() => ({
                send: vi.fn().mockResolvedValue(
                    options.epochInfo ?? {
                        absoluteSlot: 0n,
                        blockHeight: 0n,
                        epoch: 0n,
                        slotIndex: 0n,
                        slotsInEpoch: 432000n,
                    }
                ),
            })),
            getEpochSchedule: vi.fn(() => ({
                send: vi.fn().mockResolvedValue(
                    options.epochSchedule ?? {
                        firstNormalEpoch: 0n,
                        firstNormalSlot: 0n,
                        leaderScheduleSlotOffset: 0n,
                        slotsPerEpoch: 432000n,
                        warmup: false,
                    }
                ),
            })),
            getFirstAvailableBlock: vi.fn(() => ({
                send: vi.fn().mockResolvedValue(options.firstAvailableBlock ?? 0n),
            })),
        })),
    };
}

export const mockPresets = {
    empty: (testName: string) => createMockConnection(testName),
    forIdlTests: (testName: string, realConnection?: Connection) => createMockConnection(testName, realConnection),
    forInstructionTests: (testName: string, realConnection?: Connection) =>
        createMockConnection(testName, realConnection),
};

export function createRealConnection(
    cluster: 'mainnet-beta' | 'testnet' | 'devnet' = 'mainnet-beta'
): Connection | undefined {
    if (!USE_REAL_RPC) {
        return undefined;
    }

    return new Connection(clusterApiUrl(cluster));
}

export function isUsingRealRpc(): boolean {
    return USE_REAL_RPC;
}
