import { Connection, PublicKey } from '@solana/web3.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveDomain } from '../resolve-domain';

vi.mock('@utils/logger', () => ({
    default: { error: vi.fn() },
}));

const KNOWN_OWNER = new PublicKey('86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdRrbukszb');
const NAME_SERVICE_PROGRAM = new PublicKey('namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX');

describe('resolveDomain', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('SNS domains (.sol)', () => {
        it('resolves a .sol domain when account exists', async () => {
            const connection = mockConnection(createSnsAccountData(KNOWN_OWNER));

            const result = await resolveDomain('test.sol', connection);

            expect(result).not.toBeNull();
            expect(result?.owner).toBe(KNOWN_OWNER.toString());
            expect(result?.address).toBeTruthy();
        });

        it('returns null when account does not exist', async () => {
            const connection = mockConnection(null);

            const result = await resolveDomain('nonexistent.sol', connection);

            expect(result).toBeNull();
        });

        it('strips .sol suffix before hashing', async () => {
            const connection = mockConnection(createSnsAccountData(KNOWN_OWNER));

            const result1 = await resolveDomain('alice.sol', connection);
            const result2 = await resolveDomain('bob.sol', connection);

            // Different domain names should derive different addresses
            expect(result1?.address).not.toBe(result2?.address);
        });
    });

    describe('ANS domains (non-.sol)', () => {
        it('resolves an ANS domain when account exists', async () => {
            const connection = mockConnection(createAnsAccountData(KNOWN_OWNER));

            const result = await resolveDomain('test.bonk', connection);

            expect(result).not.toBeNull();
            expect(result?.owner).toBe(KNOWN_OWNER.toString());
            expect(result?.address).toBeTruthy();
        });

        it('returns null when account does not exist', async () => {
            const connection = mockConnection(null);

            const result = await resolveDomain('nonexistent.bonk', connection);

            expect(result).toBeNull();
        });

        it('lowercases the domain before lookup', async () => {
            const upper = mockConnection(createAnsAccountData(KNOWN_OWNER));
            const lower = mockConnection(createAnsAccountData(KNOWN_OWNER));

            const result1 = await resolveDomain('TEST.BONK', upper);
            const result2 = await resolveDomain('test.bonk', lower);

            expect(result1?.address).toBe(result2?.address);
        });
    });

    describe('routing', () => {
        it('routes .sol to SNS and non-.sol to ANS', async () => {
            const snsConn = mockConnection(createSnsAccountData(KNOWN_OWNER));
            const ansConn = mockConnection(createAnsAccountData(KNOWN_OWNER));

            const solResult = await resolveDomain('test.sol', snsConn);
            const bonkResult = await resolveDomain('test.bonk', ansConn);

            // Same name, different name services → different derived addresses
            expect(solResult).not.toBeNull();
            expect(bonkResult).not.toBeNull();
            expect(solResult?.address).not.toBe(bonkResult?.address);
        });
    });
});

function mockConnection(accountData: Buffer | null): Connection {
    const connection = new Connection('https://unused.test');
    vi.spyOn(connection, 'getAccountInfo').mockResolvedValue(
        accountData
            ? {
                  data: accountData,
                  executable: false,
                  lamports: 1_000_000,
                  owner: NAME_SERVICE_PROGRAM,
                  rentEpoch: 0,
              }
            : null
    );
    return connection;
}

// SNS layout: [parentName(32)] [owner(32)] [class(32)]
function createSnsAccountData(owner: PublicKey): Buffer {
    const data = Buffer.alloc(96);
    owner.toBuffer().copy(new Uint8Array(data.buffer), 32);
    return data;
}

// ANS layout: [discriminator(8)] [parentName(32)] [owner(32)] [nclass(32)] [expiresAt(8)] [createdAt(8)] [nonTransferable(1)] [padding(79)]
function createAnsAccountData(owner: PublicKey): Buffer {
    const data = Buffer.alloc(200);
    // owner at offset 8 (discriminator) + 32 (parentName) = 40
    owner.toBuffer().copy(new Uint8Array(data.buffer), 40);
    // expiresAt = 0 means no expiry (always valid)
    return data;
}
