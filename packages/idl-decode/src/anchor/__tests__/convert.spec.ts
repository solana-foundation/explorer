import { describe, expect, it } from 'vitest';

import { convertToCodama } from '../convert';
import { isCodamaIdl } from '../../detect';
import { IDL_ERROR__IDL_PARSE_FAILED } from '../../errors';
import type { AnchorIdl } from '../../types';
import { loadLetMeBuyIdl, loadSimpleIdl } from '../../__tests__/fixtures';

describe('convertToCodama', () => {
    it('should normalize a modern Anchor IDL into a Codama root', () => {
        const [error, converted] = convertToCodama(loadSimpleIdl());
        expect(error).toBeUndefined();
        expect(converted && isCodamaIdl(converted)).toBe(true);
        expect(converted?.program.name).toBe('simple');
    });

    it('should carry declared instruction discriminator bytes through unchanged', () => {
        // read, never recomputed — a converter re-deriving bytes from the camelCase name would break identification silently
        const source = loadLetMeBuyIdl();
        const declared = source.instructions.find(ix => ix.name === 'add_product')?.discriminator;
        if (!declared) throw new Error('let_me_buy must declare add_product');

        const [, converted] = convertToCodama(source);
        const argument = converted?.program.instructions
            .find(ix => ix.name === 'addProduct')
            ?.arguments.find(arg => arg.name === 'discriminator');

        const declaredHex = declared.map(byte => byte.toString(16).padStart(2, '0')).join('');
        expect(argument?.defaultValue).toMatchObject({ data: declaredHex, encoding: 'base16' });
    });

    it('should return the parse-failed error for an IDL the converter cannot handle', () => {
        const broken = {
            instructions: [{ args: [{ name: 'x', type: 'not-a-type' }], name: 'boom' }],
        } as unknown as AnchorIdl;
        const [error, converted] = convertToCodama(broken);
        expect(converted).toBeUndefined();
        expect(error?.code).toBe(IDL_ERROR__IDL_PARSE_FAILED);
    });
});
