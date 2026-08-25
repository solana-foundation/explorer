import { address, type GetAccountInfoApi, getAddressEncoder, type Rpc } from '@solana/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeAnsNameRecordData } from '../../__tests__/fixtures';
import { getAnsDomainAddress } from '../../lib/ans-name-service';
import { resolveDomain } from '../resolve-domain';

vi.mock('../../lib/ans-name-service', async importOriginal => {
    const mod = await importOriginal<typeof import('../../lib/ans-name-service')>();
    return {
        ...mod,
        getAnsDomainAddress: vi.fn(mod.getAnsDomainAddress),
    };
});

const KNOWN_OWNER = address('86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdRrbukszb');
const addressEncoder = getAddressEncoder();

describe('resolveDomain', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('SNS domains (.sol)', () => {
        it('should resolve a .sol domain when account exists', async () => {
            const rpc = mockRpc(createSnsAccountData(KNOWN_OWNER));

            const result = await resolveDomain('test.sol', rpc);

            expect(result).not.toBeNull();
            expect(result?.owner).toBe(KNOWN_OWNER.toString());
            expect(result?.address).toBeTruthy();
        });

        it('should return null when account does not exist', async () => {
            const rpc = mockRpc(null);

            const result = await resolveDomain('nonexistent.sol', rpc);

            expect(result).toBeNull();
        });

        it('should return null when no account info exists for SNS domain', async () => {
            const rpc = mockRpc(null);

            const result = await resolveDomain('nonexistent.sol', rpc);

            expect(result).toBeNull();
            expect(rpc.getAccountInfo).toHaveBeenCalledTimes(1);
        });

        it('should strip .sol suffix before hashing', async () => {
            const rpc = mockRpc(createSnsAccountData(KNOWN_OWNER));

            const result1 = await resolveDomain('alice.sol', rpc);
            const result2 = await resolveDomain('bob.sol', rpc);

            // Different domain names should derive different addresses
            expect(result1?.address).not.toBe(result2?.address);
        });

        it('should throw when getAccountInfo rejects for SNS domain', async () => {
            const rpc = mockRpc(null);
            vi.mocked(rpc.getAccountInfo).mockReturnValueOnce({
                send: () => Promise.reject(new Error('RPC failure')),
            } as never);

            await expect(resolveDomain('test.sol', rpc)).rejects.toThrow('RPC failure');
        });

        it('should resolve mixed-case .sol domains the same as lowercase', async () => {
            const upper = mockRpc(createSnsAccountData(KNOWN_OWNER));
            const lower = mockRpc(createSnsAccountData(KNOWN_OWNER));

            const result1 = await resolveDomain('Toly.sol', upper);
            const result2 = await resolveDomain('toly.sol', lower);

            expect(result1?.address).toBe(result2?.address);
            expect(result1?.owner).toBe(result2?.owner);
        });
    });

    describe('ANS domains (non-.sol)', () => {
        it('should resolve an ANS domain when account exists', async () => {
            const rpc = mockRpc(createAnsAccountData(KNOWN_OWNER));

            const result = await resolveDomain('test.bonk', rpc);

            expect(result).not.toBeNull();
            expect(result?.owner).toBe(KNOWN_OWNER.toString());
            expect(result?.address).toBeTruthy();
        });

        it('should return null when account does not exist', async () => {
            const rpc = mockRpc(null);

            const result = await resolveDomain('nonexistent.bonk', rpc);

            expect(result).toBeNull();
        });

        it('should return null when no account info exists for ANS domain', async () => {
            const rpc = mockRpc(null);

            const result = await resolveDomain('test.co', rpc);

            expect(result).toBeNull();
            expect(rpc.getAccountInfo).toHaveBeenCalledTimes(1);
        });

        it('should return null when the record has expired past the grace period', async () => {
            const expiresAt = BigInt(Math.floor(Date.now() / 1000) - 46 * 24 * 60 * 60);
            const rpc = mockRpc(createAnsAccountData(KNOWN_OWNER, expiresAt));

            const result = await resolveDomain('test.bonk', rpc);

            expect(result).toBeNull();
        });

        it('should throw when the domain derivation rejects for ANS domain', async () => {
            vi.mocked(getAnsDomainAddress).mockRejectedValueOnce(new Error('ANS lookup failed'));
            const rpc = mockRpc(null);

            await expect(resolveDomain('test.bonk', rpc)).rejects.toThrow('ANS lookup failed');
        });

        it('should lowercase the domain before lookup', async () => {
            const upper = mockRpc(createAnsAccountData(KNOWN_OWNER));
            const lower = mockRpc(createAnsAccountData(KNOWN_OWNER));

            const result1 = await resolveDomain('TEST.BONK', upper);
            const result2 = await resolveDomain('test.bonk', lower);

            expect(result1?.address).toBe(result2?.address);
        });

        it('should return null for label counts ANS cannot register', async () => {
            const rpc = mockRpc(createAnsAccountData(KNOWN_OWNER));

            expect(await resolveDomain('bonk', rpc)).toBeNull();
            expect(await resolveDomain('a.b.c.d', rpc)).toBeNull();
            expect(rpc.getAccountInfo).not.toHaveBeenCalled();
        });
    });

    describe('routing', () => {
        it('should route .sol to SNS and non-.sol to ANS', async () => {
            const snsRpc = mockRpc(createSnsAccountData(KNOWN_OWNER));
            const ansRpc = mockRpc(createAnsAccountData(KNOWN_OWNER));

            const solResult = await resolveDomain('test.sol', snsRpc);
            const bonkResult = await resolveDomain('test.bonk', ansRpc);

            // Same name, different name services → different derived addresses
            expect(solResult).not.toBeNull();
            expect(bonkResult).not.toBeNull();
            expect(solResult?.address).not.toBe(bonkResult?.address);
        });
    });
});

function mockRpc(accountData: Uint8Array | null): Rpc<GetAccountInfoApi> {
    return {
        getAccountInfo: vi.fn().mockReturnValue({
            send: () =>
                Promise.resolve({
                    value: accountData ? { data: [Buffer.from(accountData).toString('base64'), 'base64'] } : null,
                }),
        }),
    } as unknown as Rpc<GetAccountInfoApi>;
}

// SNS layout: [parentName(32)] [owner(32)] [class(32)]
function createSnsAccountData(owner: ReturnType<typeof address>): Uint8Array {
    const data = new Uint8Array(96);
    data.set(addressEncoder.encode(owner), 32);
    return data;
}

function createAnsAccountData(owner: ReturnType<typeof address>, expiresAt = 0n): Uint8Array {
    return makeAnsNameRecordData({ expiresAt, owner });
}
