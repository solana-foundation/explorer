import { PublicKey } from '@solana/web3.js';

import { getIdlVersion, type SupportedIdl } from '../idl-version';
import { isIdlProgramIdMismatch, isInteractiveIdlSupported } from '../interactive-idl';

const DEFAULT_PUBKEY = PublicKey.default.toString();

const createMockIdl = (type: 'legacy' | 'anchor' | 'codama', specVersion?: string, address?: string): SupportedIdl => {
    if (type === 'codama') {
        return {
            program: { publicKey: address ?? DEFAULT_PUBKEY },
            standard: 'codama',
            version: specVersion || '1.0.0',
        } as unknown as SupportedIdl;
    }

    if (type === 'legacy') {
        return {
            instructions: [],
            name: 'test',
            version: '0.0.0',
        } as unknown as SupportedIdl;
    }

    // Modern Anchor IDL with metadata.spec
    return {
        address: address ?? DEFAULT_PUBKEY,
        instructions: [],
        metadata: { name: 'test', spec: specVersion || '0.1.0', version: '0.1.0' },
    } as unknown as SupportedIdl;
};

const createAnchorIdlWithoutSpec = (address?: string): SupportedIdl =>
    ({
        address: address ?? DEFAULT_PUBKEY,
        instructions: [],
        metadata: { name: 'test', version: '0.1.0' },
    }) as unknown as SupportedIdl;

describe('getIdlVersion', () => {
    it('should return "Legacy" for legacy IDL', () => {
        const idl = createMockIdl('legacy');
        expect(getIdlVersion(idl)).toBe('Legacy');
    });

    it('should return "0.30.1" for modern Anchor IDL', () => {
        const idl = createMockIdl('anchor', '0.30.1');
        expect(getIdlVersion(idl)).toBe('0.30.1');
    });

    it('should return codama version for Codama IDL', () => {
        const idl = createMockIdl('codama', '1.2.3');
        expect(getIdlVersion(idl)).toBe('1.2.3');
    });
});

describe('isInteractiveIdlSupported', () => {
    it('should return false for legacy IDL', () => {
        const idl = createMockIdl('legacy');
        expect(isInteractiveIdlSupported(idl)).toBe(false);
    });

    it('should return true for Codama IDL', () => {
        const idl = createMockIdl('codama');
        expect(isInteractiveIdlSupported(idl)).toBe(true);
    });

    it('should return false for Anchor with spec < 0.1.0', () => {
        expect(isInteractiveIdlSupported(createMockIdl('anchor', '0.0.9'))).toBe(false);
    });

    it('should return true for Anchor with spec 0.1.0', () => {
        const idl = createMockIdl('anchor', '0.1.0');
        expect(isInteractiveIdlSupported(idl)).toBe(true);
    });

    it('should return true for Anchor with spec > 0.1.0', () => {
        expect(isInteractiveIdlSupported(createMockIdl('anchor', '0.1.1'))).toBe(true);
        expect(isInteractiveIdlSupported(createMockIdl('anchor', '0.2.0'))).toBe(true);
        expect(isInteractiveIdlSupported(createMockIdl('anchor', '1.0.0'))).toBe(true);
    });

    it('should return false for Anchor with malformed spec', () => {
        const malformed = {
            address: DEFAULT_PUBKEY,
            instructions: [],
            metadata: { name: 'test', spec: 'abc', version: '0.1.0' },
        } as unknown as SupportedIdl;
        const empty = {
            address: DEFAULT_PUBKEY,
            instructions: [],
            metadata: { name: 'test', spec: '', version: '0.1.0' },
        } as unknown as SupportedIdl;
        expect(isInteractiveIdlSupported(malformed)).toBe(false);
        expect(isInteractiveIdlSupported(empty)).toBe(false);
    });

    it('should return false for Anchor IDL missing metadata.spec', () => {
        expect(isInteractiveIdlSupported(createAnchorIdlWithoutSpec())).toBe(false);
    });
});

describe('isIdlProgramIdMismatch', () => {
    describe('Anchor IDL', () => {
        it('returns false when address matches programAddress', () => {
            const idl = createMockIdl('anchor', '0.1.0', DEFAULT_PUBKEY);
            expect(isIdlProgramIdMismatch(idl, DEFAULT_PUBKEY)).toBe(false);
        });

        it('returns true when address differs from programAddress', () => {
            const idl = createMockIdl('anchor', '0.1.0', DEFAULT_PUBKEY);
            const randomAddress = PublicKey.unique().toBase58();
            expect(isIdlProgramIdMismatch(idl, randomAddress)).toBe(true);
        });

        it('returns false when address is undefined', () => {
            const idl = { ...createMockIdl('anchor', '0.1.0'), address: undefined } as unknown as SupportedIdl;
            expect(isIdlProgramIdMismatch(idl, DEFAULT_PUBKEY)).toBe(false);
        });

        it('returns false when address is empty string', () => {
            const idl = createMockIdl('anchor', '0.1.0', '');
            expect(isIdlProgramIdMismatch(idl, DEFAULT_PUBKEY)).toBe(false);
        });

        it('returns true when IDL address is invalid', () => {
            const idl = createMockIdl('anchor', '0.1.0', 'not-a-key');
            expect(isIdlProgramIdMismatch(idl, DEFAULT_PUBKEY)).toBe(true);
        });

        it('returns true when programAddress is invalid', () => {
            const idl = createMockIdl('anchor', '0.1.0', DEFAULT_PUBKEY);
            expect(isIdlProgramIdMismatch(idl, 'not-a-key')).toBe(true);
        });
    });

    describe('Codama IDL', () => {
        it('returns false when program.publicKey matches programAddress', () => {
            const idl = createMockIdl('codama', '1.0.0', DEFAULT_PUBKEY);
            expect(isIdlProgramIdMismatch(idl, DEFAULT_PUBKEY)).toBe(false);
        });

        it('returns true when program.publicKey differs from programAddress', () => {
            const idl = createMockIdl('codama', '1.0.0', DEFAULT_PUBKEY);
            const randomAddress = PublicKey.unique().toBase58();
            expect(isIdlProgramIdMismatch(idl, randomAddress)).toBe(true);
        });

        it('returns false when program.publicKey is empty string', () => {
            const idl = createMockIdl('codama', '1.0.0', '');
            expect(isIdlProgramIdMismatch(idl, DEFAULT_PUBKEY)).toBe(false);
        });
    });
});
