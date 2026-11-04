import { identifyEventData, parseEventData } from '@codama/dynamic-parsers';
import { describe, expect, it, vi } from 'vitest';

import { decodeEventWithIdl } from '../decode-event';
import { IDL_ERROR__EVENT_DECODE_FAILED, IDL_ERROR__IDL_PARSE_FAILED } from '../../errors';
import { type AnchorIdl, IdlStandard } from '../../types';
import { loadTokenkegIdl } from '../../__tests__/fixtures';

const brokenAnchorIdl = () =>
    ({
        address: '11111111111111111111111111111111',
        instructions: [{ accounts: [], args: [{ name: 'x', type: 'not-a-type' }], discriminator: [9], name: 'boom' }],
        metadata: { name: 'broken', spec: '0.1.0', version: '0.0.1' },
        // eslint-disable-next-line typescript/consistent-type-assertions -- deliberately malformed to force a conversion failure
    }) as unknown as AnchorIdl;

// The happy path and a real plain miss are covered end-to-end (without the mock) in decode-event.spec.ts.
// Here the parser is mocked to drive the two failure classifications: a discriminator-match that will not
// decode, and a parser throw.
vi.mock('@codama/dynamic-parsers', () => ({
    identifyEventData: vi.fn(),
    parseEventData: vi.fn(),
}));

// eslint-disable-next-line typescript/consistent-type-assertions -- a minimal identify* path whose last node bears a discriminator
const discriminatorBearingPath = [
    { kind: 'rootNode' },
    { discriminators: [{ kind: 'constantDiscriminatorNode' }], kind: 'eventNode' },
] as unknown as ReturnType<typeof identifyEventData>;

describe('decodeEventWithIdl — failure classification', () => {
    it('should return the codama arm when the parser decodes the event', () => {
        const parsed = { data: { x: 1 }, path: [] };
        vi.mocked(parseEventData).mockReturnValue(parsed as unknown as ReturnType<typeof parseEventData>);

        const decode = decodeEventWithIdl(loadTokenkegIdl(), Uint8Array.from([1, 2, 3]));

        if (decode.kind !== IdlStandard.Codama) throw new Error('expected the codama arm');
        expect(decode.decoded).toBe(parsed);
    });

    it('should surface EVENT_DECODE_FAILED when the discriminator matches but the body will not decode', () => {
        vi.mocked(parseEventData).mockReturnValue(undefined);
        vi.mocked(identifyEventData).mockReturnValue(discriminatorBearingPath);

        const data = Uint8Array.from([1, 2, 3]);
        const decode = decodeEventWithIdl(loadTokenkegIdl(), data);

        if (decode.kind !== 'unknown') throw new Error('expected the unknown arm');
        expect(decode.errors.map(error => error.code)).toEqual([IDL_ERROR__EVENT_DECODE_FAILED]);
        expect(decode.errors[0]?.context).toMatchObject({ dataLength: data.length, standard: IdlStandard.Codama });
    });

    it('should stay a plain miss (no error) when no event discriminator matches', () => {
        vi.mocked(parseEventData).mockReturnValue(undefined);
        vi.mocked(identifyEventData).mockReturnValue(undefined);

        const decode = decodeEventWithIdl(loadTokenkegIdl(), Uint8Array.from([1, 2, 3]));

        if (decode.kind !== 'unknown') throw new Error('expected the unknown arm');
        expect(decode.errors).toEqual([]);
    });

    it('should return conversion errors for a detected-but-unconvertible Anchor IDL', () => {
        const decode = decodeEventWithIdl(brokenAnchorIdl(), Uint8Array.from([1, 2, 3]));

        if (decode.kind !== 'unknown') throw new Error('expected the unknown arm');
        expect(decode.errors.map(error => error.code)).toEqual([IDL_ERROR__IDL_PARSE_FAILED]);
    });

    it('should wrap a parser throw as an event-decode failure carrying the cause', () => {
        const cause = new Error('codec blew up');
        vi.mocked(parseEventData).mockImplementation(() => {
            throw cause;
        });

        const data = Uint8Array.from([1, 2, 3]);
        const decode = decodeEventWithIdl(loadTokenkegIdl(), data);

        if (decode.kind !== 'unknown') throw new Error('expected the unknown arm');
        expect(decode.errors.map(error => error.code)).toEqual([IDL_ERROR__EVENT_DECODE_FAILED]);
        expect(decode.errors[0]?.cause).toBe(cause);
    });
});
