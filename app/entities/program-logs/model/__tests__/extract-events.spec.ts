import { describe, expect, it } from 'vitest';

import { extractEventsFromLogs } from '../extract-events';

describe('extractEventsFromLogs', () => {
    it('should tag Program data as data and base64 Program log as log, ignoring plain-text logs', () => {
        const logs = [
            'Program P invoke [1]',
            'Program data: AAAAAAAAAAAA',
            'Program log: BBBBBBBBBBBB',
            'Program log: Instruction: Foo',
            'Program P success',
        ];
        expect(extractEventsFromLogs({ index: 0, instructionProgramIds: ['P'], logs })).toEqual([
            { data: 'AAAAAAAAAAAA', kind: 'data' },
            { data: 'BBBBBBBBBBBB', kind: 'log' },
        ]);
    });

    it('should ignore a base64 Program log payload shorter than an event discriminator', () => {
        const logs = ['Program P invoke [1]', 'Program log: AAAAAAAA', 'Program P success'];
        expect(extractEventsFromLogs({ index: 0, instructionProgramIds: ['P'], logs })).toEqual([]);
    });

    it('should attribute an event past a non-logging precompile to the right instruction via program-id match', () => {
        const logs = [
            'Program Comp invoke [1]',
            'Program Comp success',
            'Program Prog invoke [1]',
            'Program data: AAAAAAAAAAAA',
            'Program Prog success',
        ];
        const instructionProgramIds = ['Comp', 'Ed25519', 'Prog'];

        expect(extractEventsFromLogs({ index: 2, instructionProgramIds, logs })).toHaveLength(1);
        expect(extractEventsFromLogs({ index: 1, instructionProgramIds, logs })).toHaveLength(0);
    });

    it('should capture a Program data payload whose base64 contains the substring "success"', () => {
        const logs = ['Program P invoke [1]', 'Program data: success', 'Program P success'];
        expect(extractEventsFromLogs({ index: 0, instructionProgramIds: ['P'], logs })).toEqual([
            { data: 'success', kind: 'data' },
        ]);
    });

    it('should not let a Program return line containing "success" close an invocation', () => {
        const logs = [
            'Program A invoke [1]',
            'Program B invoke [2]',
            'Program return: B successsuccess',
            'Program B success',
            'Program data: AAAAAAAAAAAA',
            'Program A success',
        ];
        expect(extractEventsFromLogs({ index: 0, instructionProgramIds: ['A'], logs })).toEqual([
            { data: 'AAAAAAAAAAAA', kind: 'data' },
        ]);
    });

    it('should not let user log text containing "failed" close an invocation and misattribute a later event', () => {
        const logs = [
            'Program A invoke [1]',
            'Program B invoke [2]',
            'Program log: request failed',
            'Program data: AAAAAAAAAAAA',
            'Program B success',
            'Program A success',
        ];
        const instructionProgramIds = ['A'];

        expect(extractEventsFromLogs({ childIndex: 0, index: 0, instructionProgramIds, logs })).toEqual([
            { data: 'AAAAAAAAAAAA', kind: 'data' },
        ]);
        expect(extractEventsFromLogs({ index: 0, instructionProgramIds, logs })).toHaveLength(0);
    });

    it('should attribute each payload to the invocation that logged it', () => {
        const logs = [
            'Program A invoke [1]',
            'Program data: AAAAAAAAAAAA',
            'Program B invoke [2]',
            'Program data: BBBBBBBBBBBB',
            'Program C invoke [3]',
            'Program data: CCCCCCCCCCCC',
            'Program C success',
            'Program data: DDDDDDDDDDDD',
            'Program B success',
            'Program D invoke [2]',
            'Program data: EEEEEEEEEEEE',
            'Program D success',
            'Program data: FFFFFFFFFFFF',
            'Program A success',
        ];
        const payloads = (childIndex?: number) =>
            extractEventsFromLogs({ childIndex, index: 0, instructionProgramIds: ['A'], logs }).map(({ data }) => data);

        expect(payloads()).toEqual(['AAAAAAAAAAAA', 'FFFFFFFFFFFF']);
        expect(payloads(0)).toEqual(['BBBBBBBBBBBB', 'DDDDDDDDDDDD']);
        expect(payloads(1)).toEqual(['CCCCCCCCCCCC']);
        expect(payloads(2)).toEqual(['EEEEEEEEEEEE']);
    });

    it('should restart the CPI child count at each top-level instruction', () => {
        const logs = [
            'Program A invoke [1]',
            'Program C invoke [2]',
            'Program data: AAAAAAAAAAAA',
            'Program C success',
            'Program A success',
            'Program B invoke [1]',
            'Program C invoke [2]',
            'Program data: BBBBBBBBBBBB',
            'Program C success',
            'Program B success',
        ];
        const instructionProgramIds = ['A', 'B'];

        expect(extractEventsFromLogs({ childIndex: 0, index: 1, instructionProgramIds, logs })).toEqual([
            { data: 'BBBBBBBBBBBB', kind: 'data' },
        ]);
        expect(extractEventsFromLogs({ childIndex: 1, index: 1, instructionProgramIds, logs })).toHaveLength(0);
    });
});
