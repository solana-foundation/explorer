import { getIdlVersion, type SupportedIdl } from '../idl-version';
import { isInteractiveIdlSupported } from '../interactive-idl';

const createMockIdl = (type: 'legacy' | 'anchor' | 'codama', specVersion?: string): SupportedIdl => {
    if (type === 'codama') {
        return {
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
        address: 'test',
        instructions: [],
        metadata: { name: 'test', spec: specVersion || '0.1.0', version: '0.1.0' },
    } as unknown as SupportedIdl;
};

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

    it('should return false for Codama IDL', () => {
        const idl = createMockIdl('codama');
        expect(isInteractiveIdlSupported(idl)).toBe(false);
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
});
