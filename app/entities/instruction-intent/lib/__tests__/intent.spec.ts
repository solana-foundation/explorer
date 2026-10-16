import { getLastNodeFromPath } from 'codama';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    amountToUiAmountInstruction,
    MINT,
    mintToInstruction,
    SYSTEM_PROGRAM_ADDRESS,
    SYSTEM_ROOT,
    TOKEN_ROOT,
    TOKEN_ROOT_WITHOUT_DISPLAY,
    transferSolInstruction,
    unknownSystemInstruction,
} from '../../mocks/fixtures';
import { checkInstructionIntentExists, checkIntentSupport } from '../intent';

type Parsers = typeof import('@codama/dynamic-parsers');
type Display = typeof import('@codama/dynamic-instructions');

const mocks = vi.hoisted(() => ({
    getRequiredAccountsForDisplay: vi.fn(),
    parseInstruction: vi.fn(),
    realGetRequiredAccounts: undefined as Display['getRequiredAccountsForDisplay'] | undefined,
    realParseInstruction: undefined as Parsers['parseInstruction'] | undefined,
}));

vi.mock('@codama/dynamic-parsers', async importOriginal => {
    const actual = await importOriginal<Parsers>();
    mocks.realParseInstruction = actual.parseInstruction;
    return { ...actual, parseInstruction: mocks.parseInstruction };
});
vi.mock('@codama/dynamic-instructions', async importOriginal => {
    const actual = await importOriginal<Display>();
    mocks.realGetRequiredAccounts = actual.getRequiredAccountsForDisplay;
    return { ...actual, getRequiredAccountsForDisplay: mocks.getRequiredAccountsForDisplay };
});

beforeEach(() => {
    vi.clearAllMocks();
    mocks.parseInstruction.mockImplementation((...args: Parameters<Parsers['parseInstruction']>) =>
        mocks.realParseInstruction?.(...args),
    );
    mocks.getRequiredAccountsForDisplay.mockImplementation(
        (...args: Parameters<Display['getRequiredAccountsForDisplay']>) => mocks.realGetRequiredAccounts?.(...args),
    );
});

describe('checkIntentSupport', () => {
    it('should report none when the program publishes no IDL', () => {
        expect(checkIntentSupport(undefined)).toEqual({ status: 'none' });
    });

    it('should report none when the IDL is an Anchor IDL', () => {
        const anchorIdl = { address: SYSTEM_PROGRAM_ADDRESS, instructions: [], metadata: { name: 'x' } };

        expect(checkIntentSupport(anchorIdl)).toEqual({ status: 'none' });
    });

    it('should report none when the Codama IDL has no intent templates', () => {
        expect(checkIntentSupport(TOKEN_ROOT_WITHOUT_DISPLAY)).toEqual({ status: 'none' });
    });

    it('should report unsupported when the Codama IDL has another major version', () => {
        expect(checkIntentSupport({ ...SYSTEM_ROOT, version: '2.0.0' })).toEqual({ status: 'unsupported' });
    });

    it('should report supported with the root when the Codama IDL has intent templates', () => {
        expect(checkIntentSupport(SYSTEM_ROOT)).toEqual({ root: SYSTEM_ROOT, status: 'supported' });
    });
});

describe('checkInstructionIntentExists', () => {
    it('should report exists without required accounts', () => {
        const ixIntentExist = checkInstructionIntentExists(SYSTEM_ROOT, transferSolInstruction());

        expect(ixIntentExist).toMatchObject({ addresses: [], status: 'exists' });
        expect(ixIntentExist.status === 'exists' && getLastNodeFromPath(ixIntentExist.parsed.path).name).toBe(
            'transferSol',
        );
    });

    it('should report exists with the required mint address', () => {
        const ixIntentExist = checkInstructionIntentExists(TOKEN_ROOT, mintToInstruction());

        expect(ixIntentExist).toMatchObject({ addresses: [MINT], status: 'exists' });
        expect(ixIntentExist.status === 'exists' && getLastNodeFromPath(ixIntentExist.parsed.path).name).toBe('mintTo');
    });

    it('should report no-instruction-intent when the instruction node has no template', () => {
        expect(checkInstructionIntentExists(TOKEN_ROOT, amountToUiAmountInstruction())).toEqual({
            reason: 'no-instruction-intent',
            status: 'unavailable',
        });
    });

    it('should report no-instruction-intent when the IDL does not describe the bytes', () => {
        expect(checkInstructionIntentExists(SYSTEM_ROOT, unknownSystemInstruction())).toEqual({
            reason: 'no-instruction-intent',
            status: 'unavailable',
        });
    });

    it('should report malformed-metadata when parsing throws', () => {
        mocks.parseInstruction.mockImplementationOnce(() => {
            throw new Error('broken IDL');
        });

        expect(checkInstructionIntentExists(SYSTEM_ROOT, transferSolInstruction())).toEqual({
            reason: 'malformed-metadata',
            status: 'unavailable',
        });
    });

    it('should report malformed-metadata when required accounts throws', () => {
        mocks.getRequiredAccountsForDisplay.mockImplementationOnce(() => {
            throw new Error('broken IDL');
        });

        expect(checkInstructionIntentExists(SYSTEM_ROOT, transferSolInstruction())).toEqual({
            reason: 'malformed-metadata',
            status: 'unavailable',
        });
    });
});
