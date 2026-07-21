// Functional sweep of the codama engine over EXTERNAL real-program IDLs — codama's own
// dynamic-client test IDLs (external-fixtures.ts binds each to its buildable instruction) plus the
// memo PMP snapshot. The convert counterpart is convert-sweep.functional.spec.ts; the typed routes
// over these IDLs live in __tests__/readme-flows.integration.spec.ts.
import type { Instruction } from '@solana/kit';
import { getLastNodeFromPath } from 'codama';
import { describe, expect, it } from 'vitest';

import { createIdlClient, isCodamaStandard, tryCreateIdlClient } from '../client';
import { IDL_ERROR__INSTRUCTION_DECODE_FAILED } from '../errors';
import { IdlStandard } from '../types';
import { codamaFixtures } from './external-fixtures';
import { buildInstruction, fetchedJson, loadMemoIdl, unwrapResult } from './fixtures';

/* eslint-disable @typescript-eslint/consistent-type-assertions -- the Instruction cast bridges codama tooling with the client */

// Both tables derive from the one fixture map; the rows share one widened type (CodamaIdl), so a
// table loses no inference — typed routes live in the other suite.
const rows = Object.entries(codamaFixtures).map(([name, fixture]) => ({ name, ...fixture }));
// Each IDL decodes the one instruction codama's OWN dynamic client can build for it.
const DECODABLE_IDLS = rows.flatMap(({ instruction, ...row }) => (instruction ? [{ ...row, instruction }] : []));
// The rest declare no instruction discriminators — identification can only miss safely.
const DISCRIMINATOR_LESS_IDLS = rows.filter(row => row.instruction === undefined);

function decodeMemo() {
    const idl = loadMemoIdl();
    const client = createIdlClient(idl);
    const decode = client.decodeInstruction({
        accounts: [],
        data: new TextEncoder().encode('Hello, Memo!'),
        programAddress: idl.program.publicKey as Instruction['programAddress'],
    });
    return { client, decode };
}

describe('functional: codama IDLs (dynamic-client fixtures)', () => {
    describe.each(DECODABLE_IDLS)('$name', ({ load, instruction }) => {
        it('should wrap the untrusted IDL into a codama client', () => {
            const idl = load();
            const client = unwrapResult(tryCreateIdlClient(fetchedJson(idl)));

            expect(isCodamaStandard(client)).toBe(true);
            expect(client.programAddress()).toBe(idl.program.publicKey);
        });

        it(`should decode the ${instruction} instruction built by the dynamic client`, async () => {
            const idl = load();
            const client = createIdlClient(idl);

            const decode = client.decodeInstruction(await buildInstruction(idl, instruction));

            if (decode.kind !== IdlStandard.Codama) throw new Error('expected the codama arm');

            expect(getLastNodeFromPath(decode.decoded.path).name).toBe(instruction);
        });
    });

    describe.each(DISCRIMINATOR_LESS_IDLS)('$name', ({ load }) => {
        it('should wrap the untrusted IDL into a codama client', () => {
            const idl = load();
            const client = unwrapResult(tryCreateIdlClient(fetchedJson(idl)));

            expect(isCodamaStandard(client)).toBe(true);
            expect(client.programAddress()).toBe(idl.program.publicKey);
        });

        /** Case: identification is discriminator-driven — this IDL declares none, so decoding can only miss safely. */
        it('should stay on the unknown arm when instructions declare no discriminators', () => {
            const idl = load();
            const client = createIdlClient(idl);

            const decode = client.decodeInstruction({
                accounts: [],
                data: Uint8Array.from([1, 2, 3]),
                programAddress: idl.program.publicKey as Instruction['programAddress'],
            });

            if (decode.kind !== 'unknown') throw new Error('expected the unknown arm');
            // codama's parser throws on some discriminator-less IDLs — surfaced per the errors contract
            expect(decode.errors.every(error => error.code === IDL_ERROR__INSTRUCTION_DECODE_FAILED)).toBe(true);
        });
    });

    // SPL Memo v4: ONE instruction, remainder utf8 arg, no discriminator — a real PMP snapshot, the
    // fixtures tarball ships no such IDL. codama merged a single-candidate identification
    // fallback (https://github.com/codama-idl/codama/pull/1010); it ships with dynamic-parsers 1.2.3.
    describe('memo (single discriminator-less instruction)', () => {
        // DELETE this case when unskipping the one below — it pins the pre-fallback behavior on purpose
        it('should stay on the unknown arm until the dynamic-parsers fallback ships', () => {
            const { decode } = decodeMemo();

            if (decode.kind !== 'unknown') throw new Error('expected the unknown arm');
            expect(decode.errors.every(error => error.code === IDL_ERROR__INSTRUCTION_DECODE_FAILED)).toBe(true);
        });

        // unskip after bumping @codama/dynamic-parsers to >= 1.2.3
        it.skip('should decode the single discriminator-less instruction via the fallback', () => {
            const { client, decode } = decodeMemo();

            if (decode.kind !== IdlStandard.Codama) throw new Error('expected the codama arm');

            expect(getLastNodeFromPath(decode.decoded.path).name).toBe('addMemo');
            expect(client.getDecodedData<{ memo: string }>(decode)).toEqual({ memo: 'Hello, Memo!' });
        });
    });
});
