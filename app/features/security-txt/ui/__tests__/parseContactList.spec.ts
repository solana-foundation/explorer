import { describe, expect, it } from 'vitest';

import { parseContactList } from '../utils';

describe('parseContactList', () => {
    it('should parse a single email contact', () => {
        expect(parseContactList('email:security@example.com')).toEqual([
            { info: 'security@example.com', kind: 'contact', type: 'email' },
        ]);
    });

    it('should parse multiple comma-separated contacts', () => {
        expect(parseContactList('email:a@b.com,link:https://example.com,discord:Handle#1234')).toEqual([
            { info: 'a@b.com', kind: 'contact', type: 'email' },
            { info: 'https://example.com', kind: 'contact', type: 'link' },
            { info: 'Handle#1234', kind: 'contact', type: 'discord' },
        ]);
    });

    it('should handle whitespace around commas', () => {
        expect(parseContactList('email:a@b.com , telegram:@handle')).toEqual([
            { info: 'a@b.com', kind: 'contact', type: 'email' },
            { info: '@handle', kind: 'contact', type: 'telegram' },
        ]);
    });

    it('should render unrecognized parts as text without discarding valid contacts', () => {
        expect(parseContactList('email:a@b.com,See our site,link:https://x.com')).toEqual([
            { info: 'a@b.com', kind: 'contact', type: 'email' },
            { kind: 'text', value: 'See our site' },
            { info: 'https://x.com', kind: 'contact', type: 'link' },
        ]);
    });

    it('should treat unknown prefixes as text', () => {
        expect(parseContactList('fax:12345,email:a@b.com')).toEqual([
            { kind: 'text', value: 'fax:12345' },
            { info: 'a@b.com', kind: 'contact', type: 'email' },
        ]);
    });

    it('should be case-insensitive for contact type', () => {
        expect(parseContactList('Email:a@b.com,TWITTER:@handle')).toEqual([
            { info: 'a@b.com', kind: 'contact', type: 'Email' },
            { info: '@handle', kind: 'contact', type: 'TWITTER' },
        ]);
    });

    it('should handle all known contact types', () => {
        const input = 'email:a@b.com,link:https://x.com,discord:srv,telegram:@t,twitter:@tw,other:misc';
        const result = parseContactList(input);
        expect(result).toHaveLength(6);
        expect(result.every(e => e.kind === 'contact')).toBe(true);
    });

    it('should return text entry for plain string without colon', () => {
        expect(parseContactList('just plain text')).toEqual([{ kind: 'text', value: 'just plain text' }]);
    });

    it('should return empty array for empty string', () => {
        expect(parseContactList('')).toEqual([]);
    });

    it('should preserve colons in the information part', () => {
        expect(parseContactList('link:https://example.com:8080/path')).toEqual([
            { info: 'https://example.com:8080/path', kind: 'contact', type: 'link' },
        ]);
    });
});
