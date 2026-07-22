import { PublicKey } from '@solana/web3.js';

import { type SupportedIdl } from '../../lib/types';
import { getIdlBadgeLabel, getIdlFormatVersion, getIdlVersion } from '../idl-version';
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

describe('getIdlFormatVersion', () => {
    it('should return the root version for Codama IDL', () => {
        expect(getIdlFormatVersion(createMockIdl('codama', '1.2.3'))).toBe('1.2.3');
    });

    it('should return metadata.spec for modern Anchor IDL', () => {
        expect(getIdlFormatVersion(createMockIdl('anchor', '0.1.0'))).toBe('0.1.0');
    });

    it('should return null for legacy Anchor IDL (no spec)', () => {
        expect(getIdlFormatVersion(createMockIdl('legacy'))).toBeNull();
        expect(getIdlFormatVersion(createAnchorIdlWithoutSpec())).toBeNull();
    });
});

describe('getIdlBadgeLabel', () => {
    it('should render "Codama (version X)" for Codama IDL', () => {
        expect(getIdlBadgeLabel(createMockIdl('codama', '1.5.1'))).toBe('Codama (version 1.5.1)');
    });

    it('should render "Anchor 0.30.1 (version X)" for modern Anchor IDL', () => {
        expect(getIdlBadgeLabel(createMockIdl('anchor', '0.1.0'))).toBe('Anchor 0.30.1 (version 0.1.0)');
    });

    it('should render "Anchor (legacy)" for legacy Anchor IDL', () => {
        expect(getIdlBadgeLabel(createMockIdl('legacy'))).toBe('Anchor (legacy)');
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
        it('should return false when address matches programAddress', () => {
            const idl = createMockIdl('anchor', '0.1.0', DEFAULT_PUBKEY);
            expect(isIdlProgramIdMismatch(idl, DEFAULT_PUBKEY)).toBe(false);
        });

        it('should return true when address differs from programAddress', () => {
            const idl = createMockIdl('anchor', '0.1.0', DEFAULT_PUBKEY);
            const randomAddress = PublicKey.unique().toBase58();
            expect(isIdlProgramIdMismatch(idl, randomAddress)).toBe(true);
        });

        it('should return false when address is undefined', () => {
            const idl = { ...createMockIdl('anchor', '0.1.0'), address: undefined } as unknown as SupportedIdl;
            expect(isIdlProgramIdMismatch(idl, DEFAULT_PUBKEY)).toBe(false);
        });

        it('should return false when address is empty string', () => {
            const idl = createMockIdl('anchor', '0.1.0', '');
            expect(isIdlProgramIdMismatch(idl, DEFAULT_PUBKEY)).toBe(false);
        });

        it('should return true when IDL address is invalid', () => {
            const idl = createMockIdl('anchor', '0.1.0', 'not-a-key');
            expect(isIdlProgramIdMismatch(idl, DEFAULT_PUBKEY)).toBe(true);
        });

        it('should return true when programAddress is invalid', () => {
            const idl = createMockIdl('anchor', '0.1.0', DEFAULT_PUBKEY);
            expect(isIdlProgramIdMismatch(idl, 'not-a-key')).toBe(true);
        });
    });

    describe('Codama IDL', () => {
        it('should return false when program.publicKey matches programAddress', () => {
            const idl = createMockIdl('codama', '1.0.0', DEFAULT_PUBKEY);
            expect(isIdlProgramIdMismatch(idl, DEFAULT_PUBKEY)).toBe(false);
        });

        it('should return true when program.publicKey differs from programAddress', () => {
            const idl = createMockIdl('codama', '1.0.0', DEFAULT_PUBKEY);
            const randomAddress = PublicKey.unique().toBase58();
            expect(isIdlProgramIdMismatch(idl, randomAddress)).toBe(true);
        });

        it('should return false when program.publicKey is empty string', () => {
            const idl = createMockIdl('codama', '1.0.0', '');
            expect(isIdlProgramIdMismatch(idl, DEFAULT_PUBKEY)).toBe(false);
        });
    });
});
