import { describe, expect, it } from 'vitest';

import { extractEventsFromLogs } from '../program-logs';

const CB = 'ComputeBudget111111111111111111111111111111';
const ED = 'Ed25519SigVerify111111111111111111111111111';
const VEL = 'vELoC1audYbSYVRXn1vPaV8Axoa9oU6BYmNGZZBDZ1P';
const EVENT_B64 = '4DRDR8LtbQEP5D5qAAAAAAIGAAAB';

// Mirrors a real devnet tx: 2x ComputeBudget, an ed25519 precompile (emits no log), then two vELoC
// instructions. The 2nd vELoC instruction (FillPerpOrder, tx index 4) logs an event via `Program log:`.
const logs = [
    `Program ${CB} invoke [1]`,
    `Program ${CB} success`,
    `Program ${CB} invoke [1]`,
    `Program ${CB} success`,
    `Program ${VEL} invoke [1]`,
    'Program log: Instruction: PostPythLazerOracleUpdate',
    'Program log: Price updated to 7222851085',
    `Program ${VEL} consumed 8855 of 255700 compute units`,
    `Program ${VEL} success`,
    `Program ${VEL} invoke [1]`,
    'Program log: Instruction: FillPerpOrder',
    `Program log: ${EVENT_B64}`,
    `Program ${VEL} consumed 117497 of 246845 compute units`,
    `Program ${VEL} success`,
];
const programIds = [CB, CB, ED, VEL, VEL];

describe('extractEventsFromLogs', () => {
    it('should extract a base64 event logged via `Program log:` for the correct instruction', () => {
        // tx index 4 despite only 3 invoke logs preceding it (the ed25519 precompile emits none).
        expect(extractEventsFromLogs(logs, 4, programIds)).toEqual([EVENT_B64]);
    });

    it('should not attribute the event to other instructions', () => {
        expect(extractEventsFromLogs(logs, 3, programIds)).toEqual([]); // PostPyth — only text logs
        expect(extractEventsFromLogs(logs, 2, programIds)).toEqual([]); // ed25519 — no logs at all
    });

    it('should ignore plain-text `Program log:` lines', () => {
        const textLogs = [
            `Program ${VEL} invoke [1]`,
            'Program log: Instruction: FillPerpOrder',
            `Program ${VEL} success`,
        ];
        expect(extractEventsFromLogs(textLogs, 0, [VEL])).toEqual([]);
    });

    it('should still extract `Program data:` events (and work without programIds)', () => {
        const dataLogs = [`Program ${VEL} invoke [1]`, 'Program data: AAAAAAAAAAAA', `Program ${VEL} success`];
        expect(extractEventsFromLogs(dataLogs, 0)).toEqual(['AAAAAAAAAAAA']);
    });
});
