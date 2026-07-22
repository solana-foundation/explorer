import { describe, expect, it } from 'vitest';

import { systemInstructionParser } from '../client.js';
import { parseSystemInstruction, parseSystemRpcInstruction } from '../parser.js';

describe('systemInstructionParser', () => {
    it('should describe the System program with both decode paths', () => {
        expect(systemInstructionParser.programId).toBe('11111111111111111111111111111111');
        expect(systemInstructionParser.programLabel).toBe('system');
        expect(systemInstructionParser.fromTransaction).toBe(parseSystemInstruction);
        expect(systemInstructionParser.fromParsed).toBe(parseSystemRpcInstruction);
    });
});
