import { describe, expect, it } from 'vitest';

import { parseSecurityTxt } from '../index.js';

const HEADER = '=======BEGIN SECURITY.TXT V1=======\0';
const FOOTER = '=======END SECURITY.TXT V1=======\0';

function encodeSecurityTxt(data: Record<string, string>): string {
    const parts: string[] = [];
    for (const [k, v] of Object.entries(data)) {
        parts.push(k, v);
    }
    const content = parts.join('\0') + '\0';
    return Buffer.from(HEADER + content + FOOTER, 'utf8').toString('base64');
}

const REQUIRED_FIELDS = {
    contacts: 'email:security@example.com',
    name: 'Test Program',
    policy: 'https://example.com/policy',
    project_url: 'https://example.com',
};

describe('parseSecurityTxt', () => {
    it('should parse valid security.txt with all required fields', () => {
        const base64 = encodeSecurityTxt(REQUIRED_FIELDS);

        expect(parseSecurityTxt(base64)).toEqual({
            fields: {
                acknowledgements: null,
                auditors: null,
                contacts: 'email:security@example.com',
                encryption: null,
                expiry: null,
                name: 'Test Program',
                policy: 'https://example.com/policy',
                preferred_languages: null,
                project_url: 'https://example.com',
                source_code: null,
                source_release: null,
                source_revision: null,
            },
            ok: true,
        });
    });

    it('should parse valid security.txt with all optional fields', () => {
        const base64 = encodeSecurityTxt({
            ...REQUIRED_FIELDS,
            acknowledgements: 'https://example.com/thanks',
            auditors: 'Audit Firm A',
            encryption: 'https://example.com/pgp-key',
            expiry: '2030-12-31',
            preferred_languages: 'en,de',
            source_code: 'https://github.com/example/test',
            source_release: 'v1.0.0',
            source_revision: 'abc123',
        });

        expect(parseSecurityTxt(base64)).toEqual({
            fields: {
                acknowledgements: 'https://example.com/thanks',
                auditors: 'Audit Firm A',
                contacts: 'email:security@example.com',
                encryption: 'https://example.com/pgp-key',
                expiry: '2030-12-31',
                name: 'Test Program',
                policy: 'https://example.com/policy',
                preferred_languages: 'en,de',
                project_url: 'https://example.com',
                source_code: 'https://github.com/example/test',
                source_release: 'v1.0.0',
                source_revision: 'abc123',
            },
            ok: true,
        });
    });

    it('should return no_markers when the begin marker is absent', () => {
        const base64 = Buffer.from('just some program data').toString('base64');

        expect(parseSecurityTxt(base64)).toEqual({ error: 'no_markers', ok: false });
    });

    it('should return no_markers when the end marker is absent', () => {
        const partial = HEADER + 'name\0Test\0';
        const base64 = Buffer.from(partial, 'utf8').toString('base64');

        expect(parseSecurityTxt(base64)).toEqual({ error: 'no_markers', ok: false });
    });

    it('should return no_markers when the input is not valid base64', () => {
        expect(parseSecurityTxt('!not base64!')).toEqual({ error: 'no_markers', ok: false });
    });

    it('should return invalid_content when the required field name is missing', () => {
        const base64 = encodeSecurityTxt({
            contacts: 'email:a@b.com',
            policy: 'policy',
            project_url: 'https://example.com',
        });

        expect(parseSecurityTxt(base64)).toEqual({ error: 'invalid_content', ok: false });
    });

    it('should return invalid_content when the required field contacts is missing', () => {
        const base64 = encodeSecurityTxt({
            name: 'Test',
            policy: 'policy',
            project_url: 'https://example.com',
        });

        expect(parseSecurityTxt(base64)).toEqual({ error: 'invalid_content', ok: false });
    });

    it('should return no_markers for an empty input string', () => {
        expect(parseSecurityTxt('')).toEqual({ error: 'no_markers', ok: false });
    });

    it('should ignore unknown keys and return only valid fields', () => {
        const base64 = encodeSecurityTxt({
            ...REQUIRED_FIELDS,
            another_unknown: 'also ignored',
            unknown_field: 'should be ignored',
        });

        const result = parseSecurityTxt(base64);
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.fields.name).toBe('Test Program');
            expect('unknown_field' in result.fields).toBe(false);
            expect('another_unknown' in result.fields).toBe(false);
        }
    });

    it('should preserve multi-line values like PGP keys', () => {
        const pgpKey = '-----BEGIN PGP PUBLIC KEY BLOCK-----\nxyz123\n-----END PGP PUBLIC KEY BLOCK-----';
        const base64 = encodeSecurityTxt({ ...REQUIRED_FIELDS, encryption: pgpKey });

        const result = parseSecurityTxt(base64);
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.fields.encryption).toBe(pgpKey);
        }
    });

    it('should ignore a dangling key without a value', () => {
        const pairs = Object.entries(REQUIRED_FIELDS)
            .flatMap(([k, v]) => [k, v])
            .join('\0');
        const content = pairs + '\0dangling_key\0';
        const base64 = Buffer.from(HEADER + content + FOOTER, 'utf8').toString('base64');

        const result = parseSecurityTxt(base64);
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect('dangling_key' in result.fields).toBe(false);
        }
    });

    it('should skip an empty key produced by consecutive null separators', () => {
        const pairs = Object.entries(REQUIRED_FIELDS)
            .flatMap(([k, v]) => [k, v])
            .join('\0');
        // Leading "\0value" pair yields an empty-string key token.
        const content = '\0orphan value\0' + pairs + '\0';
        const base64 = Buffer.from(HEADER + content + FOOTER, 'utf8').toString('base64');

        const result = parseSecurityTxt(base64);
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.fields.name).toBe('Test Program');
        }
    });

    it('should return empty strings as-is for optional fields', () => {
        const base64 = encodeSecurityTxt({
            ...REQUIRED_FIELDS,
            auditors: '',
            preferred_languages: '',
        });

        const result = parseSecurityTxt(base64);
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.fields.preferred_languages).toBe('');
            expect(result.fields.auditors).toBe('');
        }
    });
});
