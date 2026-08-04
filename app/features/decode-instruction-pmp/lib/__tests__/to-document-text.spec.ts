import { Format } from '@solana-program/program-metadata';
import { describe, expect, it } from 'vitest';

import { toDocumentText } from '../decode-pmp-payload';

describe('toDocumentText', () => {
    it('should pretty-print a minified JSON document', () => {
        expect(toDocumentText('{"name":"company","version":"1.0.0"}', Format.Json)).toBe(
            '{\n  "name": "company",\n  "version": "1.0.0"\n}',
        );
    });

    it('should pretty-print a JSON array document', () => {
        expect(toDocumentText('[1,2]', Format.Json)).toBe('[\n  1,\n  2\n]');
    });

    it('should fall back to verbatim text when Format is Json but the text does not parse', () => {
        expect(toDocumentText('{not json', Format.Json)).toBe('{not json');
    });

    it('should round-trip a Json payload that parses to a scalar', () => {
        // A bare scalar has no structure to indent, so re-serialising it is a no-op rather than a special case.
        expect(toDocumentText('42', Format.Json)).toBe('42');
        expect(toDocumentText('null', Format.Json)).toBe('null');
        expect(toDocumentText('"hello"', Format.Json)).toBe('"hello"');
    });

    it('should render Yaml and Toml verbatim without pulling in a parser', () => {
        expect(toDocumentText('name: company\n', Format.Yaml)).toBe('name: company\n');
        expect(toDocumentText('name = "company"', Format.Toml)).toBe('name = "company"');
    });

    it('should render Format None verbatim', () => {
        expect(toDocumentText('deadbeef', Format.None)).toBe('deadbeef');
    });
});
