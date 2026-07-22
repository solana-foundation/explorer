// Compile-time guidance for the Codama route — validated by vitest typecheck mode, nothing executes.
import { vaultIdl } from '@explorer/test-idl-program-vault';
import type { InstructionNode } from 'codama';
import { describe, expectTypeOf, it } from 'vitest';

import { createIdlClient, type IdlClient } from '../../client';
import { type CodamaIdl, IdlStandard, type InstructionDecode, unwrap } from '../../types';
import { loadTokenkegIdl, transferIx } from '../../__tests__/fixtures';

const codamaIdl = loadTokenkegIdl();
const codamaTransferIx = transferIx(codamaIdl);

describe('sample: Codama IDL', () => {
    it('should guide the developer into the codama-only surface', () => {
        const client = createIdlClient(codamaIdl);

        expectTypeOf(client).toEqualTypeOf<IdlClient<CodamaIdl>>();
        expectTypeOf(client.idl).toEqualTypeOf<CodamaIdl>();
        // the anchor arm is statically absent — no dead anchor branch can even be written
        expectTypeOf(client.decodeInstruction(codamaTransferIx)).toEqualTypeOf<
            Exclude<InstructionDecode, { kind: IdlStandard.Anchor }>
        >();
        // the handler map compiles with exactly the codama + unknown arms
        client.decodeInstruction(codamaTransferIx, { codama: () => 0, unknown: () => 0 });
    });

    // mirrors the decodeInstruction jsdoc example — keep the snippet honest if unwrap or the overloads move
    it('should keep the two-step seam typed: unwrap gives the node, getDecodedData keeps the inference', () => {
        const client = createIdlClient(vaultIdl);
        const decode = client.decodeInstruction(codamaTransferIx);
        if (decode.kind === IdlStandard.Codama) {
            const { node } = unwrap(decode);
            const data = client.getDecodedData(decode);
            expectTypeOf(node).toEqualTypeOf<InstructionNode>();
            expectTypeOf(data).toEqualTypeOf<{ amount: bigint; discriminator: number }>();
        }
    });
});
