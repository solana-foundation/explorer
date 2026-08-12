import { PMP_DECODED_RENDER_CAP_BYTES } from '@entities/pmp-account';
import { getBase16Encoder, getUtf8Encoder } from '@solana/kit';
import { Compression, Format } from '@solana-program/program-metadata';
import { deflate, gzip } from 'pako';
import { describe, expect, it } from 'vitest';

import {
    hasPmpPayload,
    isBinaryPayload,
    isDetectionUncertain,
    resolveBufferConfigFromBytes,
} from '../resolve-buffer-config-from-bytes';

const utf8 = (text: string) => new TextEncoder().encode(text);
const JSON_DOC = '{"name":"orbit","version":"1.0.0"}';

describe('resolveBufferConfigFromBytes', () => {
    it('should report gzip text with a resolved Json format', () => {
        const result = resolveBufferConfigFromBytes(gzip(utf8(JSON_DOC)));

        expect(result).toMatchObject({ compression: Compression.Gzip, format: Format.Json, kind: 'text' });
    });

    it('should report zlib text with a resolved Json format', () => {
        const result = resolveBufferConfigFromBytes(deflate(utf8(JSON_DOC)));

        expect(result).toMatchObject({ compression: Compression.Zlib, format: Format.Json, kind: 'text' });
    });

    it('should pretty-print a minified Json document', () => {
        const result = resolveBufferConfigFromBytes(gzip(utf8(JSON_DOC)));

        expect(result.kind === 'text' && result.text).toContain('\n  "name": "orbit"');
    });

    it('should report an uncompressed Json body as Compression.None', () => {
        const result = resolveBufferConfigFromBytes(utf8(JSON_DOC));

        expect(result).toMatchObject({ compression: Compression.None, format: Format.Json, kind: 'text' });
    });

    it('should leave format unresolved for text that is not Json', () => {
        const result = resolveBufferConfigFromBytes(utf8('name: orbit\nversion: 1.0.0\n'));

        expect(result).toMatchObject({ compression: Compression.None, format: undefined, kind: 'text' });
    });

    it('should carry the unpacked payload so the caller never inflates twice', () => {
        const result = resolveBufferConfigFromBytes(gzip(utf8(JSON_DOC)));

        expect(result.kind === 'text' && new TextDecoder().decode(result.payload)).toBe(JSON_DOC);
    });

    it('should report a payload that fails a strict UTF-8 decode as binary', () => {
        const result = resolveBufferConfigFromBytes(new Uint8Array([0xff, 0xfe, 0x00, 0x80, 0x81]));

        expect(result).toMatchObject({ compression: Compression.None, kind: 'binary' });
    });

    // Both byte sequences below are what PMP stores for DIFFERENT documents under DIFFERENT declared encodings,
    // and they are byte-identical. No byte evidence can tell them apart, so detection must assert neither.
    // This is the test that stops someone reintroducing `encoding: Encoding.Utf8`.
    it('should assert no encoding for byte-identical payloads that declared different encodings', () => {
        const asHexDocument = new Uint8Array(getBase16Encoder().encode('68656c6c6f'));
        const asUtf8Document = new Uint8Array(getUtf8Encoder().encode('hello'));

        expect(asHexDocument).toEqual(asUtf8Document);
        expect(resolveBufferConfigFromBytes(asHexDocument)).not.toHaveProperty('encoding');
        expect(resolveBufferConfigFromBytes(asUtf8Document)).not.toHaveProperty('encoding');
    });

    it('should keep Compression.Gzip for a gzip body rather than diverting it to None', () => {
        const result = resolveBufferConfigFromBytes(gzip(utf8(JSON_DOC)));

        // A gzip stream opens `1f 8b`, and 0x8b is a UTF-8 continuation byte where a lead byte must be, so a gzip
        // stream can never itself be valid UTF-8. That is why the guard skips gzip - structural, not a shortcut.
        expect(result).toMatchObject({ compression: Compression.Gzip, kind: 'text' });
    });

    it('should trim trailing zero slack when that turns a failing Json parse into a passing one', () => {
        const body = new Uint8Array([...utf8(JSON_DOC), 0, 0, 0, 0]);
        const result = resolveBufferConfigFromBytes(body);

        expect(result).toMatchObject({ format: Format.Json, kind: 'text' });
        expect(result.kind === 'text' && result.payload.length).toBe(JSON_DOC.length);
    });

    it('should keep trailing zero slack on a text body that is not Json either way', () => {
        const body = new Uint8Array([...utf8('name: orbit'), 0, 0]);
        const result = resolveBufferConfigFromBytes(body);

        expect(result.kind === 'text' && result.payload.length).toBe(body.length);
    });

    it('should report a truncated compressed stream as incomplete', () => {
        const full = gzip(utf8(JSON_DOC));

        expect(resolveBufferConfigFromBytes(full.slice(0, full.length - 4))).toEqual({ kind: 'incomplete' });
    });

    it('should report a zero-length body as empty', () => {
        expect(resolveBufferConfigFromBytes(new Uint8Array(0))).toEqual({ kind: 'empty' });
    });

    it('should report a payload past the render cap as oversized', () => {
        const body = utf8('x'.repeat(PMP_DECODED_RENDER_CAP_BYTES + 1));

        expect(resolveBufferConfigFromBytes(body)).toMatchObject({
            budget: PMP_DECODED_RENDER_CAP_BYTES,
            kind: 'oversized',
        });
    });
});

describe('isBinaryPayload', () => {
    it('should accept bytes that fail a strict UTF-8 decode', () => {
        expect(isBinaryPayload(new Uint8Array([0xff, 0xfe, 0x00, 0x80]))).toBe(true);
    });

    it('should reject readable text', () => {
        expect(isBinaryPayload(utf8(JSON_DOC))).toBe(false);
    });

    it('should reject text carrying trailing zero slack', () => {
        expect(isBinaryPayload(new Uint8Array([...utf8('name: orbit'), 0, 0]))).toBe(false);
    });

    it('should agree with the arm detection reports for the same bytes', () => {
        const binary = new Uint8Array([0xff, 0x80, 0x81]);
        const text = utf8(JSON_DOC);

        expect(resolveBufferConfigFromBytes(binary).kind).toBe('binary');
        expect(isBinaryPayload(binary)).toBe(true);

        expect(resolveBufferConfigFromBytes(text).kind).toBe('text');
        expect(isBinaryPayload(text)).toBe(false);
    });
});

describe('hasPmpPayload', () => {
    it('should accept a text payload', () => {
        expect(hasPmpPayload(resolveBufferConfigFromBytes(utf8(JSON_DOC)))).toBe(true);
    });

    it('should accept a binary payload', () => {
        expect(hasPmpPayload(resolveBufferConfigFromBytes(new Uint8Array([0xff, 0x80])))).toBe(true);
    });

    it('should reject the outcomes that carry no payload', () => {
        expect(hasPmpPayload({ kind: 'empty' })).toBe(false);
        expect(hasPmpPayload({ kind: 'incomplete' })).toBe(false);
        expect(hasPmpPayload({ budget: 1, bytes: new Uint8Array(2), kind: 'oversized' })).toBe(false);
        expect(hasPmpPayload({ kind: 'overflow', limit: 1 })).toBe(false);
    });
});

describe('isDetectionUncertain', () => {
    it('should be certain for text that parses as Json', () => {
        expect(isDetectionUncertain(resolveBufferConfigFromBytes(utf8(JSON_DOC)))).toBe(false);
    });

    // A Url payload is a URL string: UTF-8 but not Json. This is the case the lookup exists for.
    it('should be uncertain for text that is not Json', () => {
        expect(isDetectionUncertain(resolveBufferConfigFromBytes(utf8('https://example.com/idl.json')))).toBe(true);
    });

    it('should be uncertain for a binary payload', () => {
        expect(isDetectionUncertain(resolveBufferConfigFromBytes(new Uint8Array([0xff, 0x80])))).toBe(true);
    });

    it('should be certain for a non-payload outcome, which has nothing to upgrade', () => {
        expect(isDetectionUncertain({ kind: 'empty' })).toBe(false);
    });
});
