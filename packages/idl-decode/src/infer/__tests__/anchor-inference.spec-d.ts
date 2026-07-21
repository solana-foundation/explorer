// Compile-time guidance for the Anchor >= 0.30 routes — vitest typecheck only, nothing executes.
import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';
import type { BN, IdlAccounts, IdlEvents, web3 } from '@coral-xyz/anchor';
import { describe, expectTypeOf, it } from 'vitest';

import { createIdlClient, type IdlClient, isAnchorStandard } from '../../client';
import { type AnchorIdl, type CodamaIdl, IdlStandard, type InstructionDecode } from '../../types';
import { incrementIx, loadSimpleIdl, type Simple } from '../../__tests__/fixtures';

const anchorIdl = loadSimpleIdl();
const anchorIncrementIx = incrementIx(anchorIdl);
// the generated literal type ships separately from the runtime JSON (camelCase view vs original casing)
declare const simpleGeneratedIdl: Simple;

describe('sample: Anchor >= 0.30 IDL — native vs nodes-from-anchor', () => {
    it('should keep the Anchor IDL type accessible on the native Anchor client', () => {
        const client = createIdlClient(anchorIdl);

        expectTypeOf(client).toEqualTypeOf<IdlClient<AnchorIdl>>();
        // the Anchor variant carries Anchor's own IDL type — anchor-typed guidance stays available
        expectTypeOf(client.idl).toEqualTypeOf<AnchorIdl>();
        if (isAnchorStandard(client)) {
            expectTypeOf(client.idl.instructions).toEqualTypeOf<AnchorIdl['instructions']>();
        }
        // all three decode arms stay possible (codama decode with the injected anchor fallback)
        expectTypeOf(client.decodeInstruction(anchorIncrementIx)).toEqualTypeOf<InstructionDecode>();
    });

    it('should collapse to the codama-only surface once converted with nodes-from-anchor', () => {
        // nodes-from-anchor ships its own (narrower) Anchor IDL + RootNode types — same cast the app uses
        const root = rootNodeFromAnchor(anchorIdl as Parameters<typeof rootNodeFromAnchor>[0]) as unknown as CodamaIdl;
        const converted = createIdlClient(root);

        // normalize-first trades the anchor arm away STATICALLY — the compiler stops offering it
        expectTypeOf(converted).toEqualTypeOf<IdlClient<CodamaIdl>>();
        expectTypeOf(converted.decodeInstruction(anchorIncrementIx)).toEqualTypeOf<
            Exclude<InstructionDecode, { kind: IdlStandard.Anchor }>
        >();
    });
});

describe('sample: Anchor >= 0.30 with generated types (simple program)', () => {
    it('should preserve the generated literal type through the client', () => {
        const client = createIdlClient(simpleGeneratedIdl);

        expectTypeOf(client).toEqualTypeOf<IdlClient<Simple>>();
        // literal guidance survives: the compiler knows the exact instruction and argument
        expectTypeOf(client.idl.instructions[0].name).toEqualTypeOf<'increment'>();
        expectTypeOf(client.idl.instructions[0].args[0].type).toEqualTypeOf<'u64'>();
        expectTypeOf(client.idl.instructions[0].accounts[0].name).toEqualTypeOf<'counter'>();
        // all decode arms stay open on the Anchor route
        expectTypeOf(client.decodeInstruction(incrementIx(simpleGeneratedIdl))).toEqualTypeOf<InstructionDecode>();
    });

    it("should keep anchor's own type machinery usable on the client's idl", () => {
        type SimpleIdl = IdlClient<Simple>['idl'];

        // account struct decoded type: pubkey field maps to web3 PublicKey, u64 to BN
        type CounterAccount = IdlAccounts<SimpleIdl>['counter'];
        expectTypeOf<CounterAccount['authority']>().toEqualTypeOf<web3.PublicKey>();
        expectTypeOf<CounterAccount['count']>().toEqualTypeOf<BN>();
        // event payload type: one event, one u64 field
        expectTypeOf<IdlEvents<SimpleIdl>['counterIncremented']>().toEqualTypeOf<{ count: BN }>();
        // error table: one literal-typed error entry (anchor does not export IdlErrors — index directly)
        type SimpleError = SimpleIdl['errors'][number];
        expectTypeOf<SimpleError['code']>().toEqualTypeOf<6000>();
        expectTypeOf<SimpleError['name']>().toEqualTypeOf<'overflow'>();
    });

    it('should degrade the same document to non-guidance once widened to the runtime Idl type', () => {
        // this is the runtime-fetched situation: same value, wide type — literal guidance is gone
        const widened: AnchorIdl = simpleGeneratedIdl;
        const client = createIdlClient(widened);

        expectTypeOf(client).toEqualTypeOf<IdlClient<AnchorIdl>>();
        expectTypeOf(client.idl.instructions[0].name).toEqualTypeOf<string>();
    });
});
