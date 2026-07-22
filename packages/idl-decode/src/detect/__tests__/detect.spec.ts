// Detection + version helpers per standard — one section per input shape (anchor / codama);
// legacy recognition lives with its client route in __tests__/legacy-anchor.
import { describe, expect, it } from 'vitest';

import {
    getIdlProgramAddress,
    getIdlProgramVersion,
    getIdlStandard,
    getIdlVersion,
    isAnchorIdl,
    isCodamaIdl,
    isSupportedIdl,
} from '../index';
import { IdlStandard, type SupportedIdl } from '../../types';
import {
    loadLetMeBuyIdl,
    loadLetMeBuyPmpIdl,
    loadNtt029Idl,
    loadSimple031Idl,
    loadSimpleIdl,
    loadTokenkegIdl,
} from '../../__tests__/fixtures';

describe('isAnchorIdl', () => {
    it('should accept a modern Anchor IDL', () => {
        const letMeBuy = loadLetMeBuyIdl();
        expect(isAnchorIdl(letMeBuy)).toBe(true);
        expect(isSupportedIdl(letMeBuy)).toBe(true);
    });

    it('should reject a legacy Anchor IDL', () => {
        expect(isAnchorIdl(loadNtt029Idl())).toBe(false);
    });

    it('should reject a modern Anchor shape whose program address is missing or blank', () => {
        const { address: _drop, ...noAddress } = loadLetMeBuyIdl();
        expect(isAnchorIdl(noAddress)).toBe(false);
        expect(isAnchorIdl({ ...loadLetMeBuyIdl(), address: '' })).toBe(false);
        expect(isAnchorIdl({ ...loadLetMeBuyIdl(), address: '   ' })).toBe(false);
    });

    it('should reject a Codama root node', () => {
        expect(isAnchorIdl(loadTokenkegIdl())).toBe(false);
    });

    it.each([null, undefined, 42, 'idl', {}, []])('should reject non-IDL input %#', value => {
        expect(isAnchorIdl(value)).toBe(false);
    });
});

describe('Anchor version helpers', () => {
    it('should identify the Anchor standard', () => {
        expect(getIdlStandard(loadSimpleIdl())).toBe(IdlStandard.Anchor);
    });

    // every anchor-era acquisition point carries spec 0.1.0 — the spec is semver'd independently of anchor releases
    it.each([
        ['simple (anchor-lang 1.1.2 workspace build)', loadSimpleIdl],
        ['simple-031 (anchor-lang 0.31.1 workspace build)', loadSimple031Idl],
        ['let_me_buy (mainnet Anchor PDA leg)', loadLetMeBuyIdl],
        ['let_me_buy (mainnet PMP leg)', loadLetMeBuyPmpIdl],
    ])('should return the metadata.spec format version for %s', (_, loadIdl) => {
        expect(getIdlVersion(loadIdl())).toBe('0.1.0');
    });

    it('should return the program version from metadata.version', () => {
        expect(getIdlProgramVersion(loadSimpleIdl())).toBe('0.1.0');
    });

    it('should return undefined when runtime Anchor metadata omits optional program fields', () => {
        const idl = { instructions: [], metadata: { spec: '0.1.0' } } as unknown as SupportedIdl;
        expect(getIdlProgramAddress(idl)).toBeUndefined();
        expect(getIdlProgramVersion(idl)).toBeUndefined();
    });
});

describe('isCodamaIdl', () => {
    it('should accept a Codama root node', () => {
        const tokenkeg = loadTokenkegIdl();
        expect(isCodamaIdl(tokenkeg)).toBe(true);
        expect(isSupportedIdl(tokenkeg)).toBe(true);
    });

    it('should reject an Anchor IDL', () => {
        expect(isCodamaIdl(loadSimpleIdl())).toBe(false);
    });

    it('should reject a rootNode-shaped value without a program node', () => {
        expect(isCodamaIdl({ kind: 'rootNode' })).toBe(false);
    });

    it('should reject a root node whose program address is missing or blank', () => {
        const tokenkeg = loadTokenkegIdl();
        const { publicKey: _drop, ...bareProgram } = tokenkeg.program;
        expect(isCodamaIdl({ ...tokenkeg, program: bareProgram })).toBe(false);
        expect(isCodamaIdl({ ...tokenkeg, program: { ...tokenkeg.program, publicKey: '' } })).toBe(false);
        expect(isCodamaIdl({ ...tokenkeg, program: { ...tokenkeg.program, publicKey: '   ' } })).toBe(false);
    });

    it.each([null, undefined, 42, 'idl', {}, []])('should reject non-IDL input %#', value => {
        expect(isCodamaIdl(value)).toBe(false);
    });
});

describe('Codama version helpers', () => {
    it('should identify the Codama standard', () => {
        expect(getIdlStandard(loadTokenkegIdl())).toBe(IdlStandard.Codama);
    });

    it('should return the root version as the format version', () => {
        const tokenkeg = loadTokenkegIdl();
        expect(getIdlVersion(tokenkeg)).toBe(tokenkeg.version);
    });

    it('should return the program version from program.version', () => {
        expect(getIdlProgramVersion(loadTokenkegIdl())).toBe('3.3.0');
    });

    it('should return undefined when runtime Codama metadata omits optional program fields', () => {
        const idl = { kind: 'rootNode', program: {} } as unknown as SupportedIdl;
        expect(getIdlProgramAddress(idl)).toBeUndefined();
        expect(getIdlProgramVersion(idl)).toBeUndefined();
    });
});
