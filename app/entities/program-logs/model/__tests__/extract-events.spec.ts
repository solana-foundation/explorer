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
        expect(extractEventsFromLogs(logs, 0, ['P'])).toEqual([
            { data: 'AAAAAAAAAAAA', kind: 'data' },
            { data: 'BBBBBBBBBBBB', kind: 'log' },
        ]);
    });

    it('should attribute an event past a non-logging precompile to the right instruction via program-id match', () => {
        // The Ed25519 precompile sits at index 1 and emits no `invoke` log.
        const logs = [
            'Program Comp invoke [1]',
            'Program Comp success',
            'Program Prog invoke [1]',
            'Program data: AAAAAAAAAAAA',
            'Program Prog success',
        ];
        const programIds = ['Comp', 'Ed25519', 'Prog'];

        expect(extractEventsFromLogs(logs, 2, programIds)).toHaveLength(1); // correct: the program at #2
        expect(extractEventsFromLogs(logs, 1, programIds)).toHaveLength(0); // not the precompile at #1
        // Without programIds, naive invoke-counting misattributes it to #1.
        expect(extractEventsFromLogs(logs, 1)).toHaveLength(1);
    });
});
