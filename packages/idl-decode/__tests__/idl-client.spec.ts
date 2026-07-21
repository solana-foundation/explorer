// The @explorer/idl-decode client in action — consumer-style flows over the BUILT package ('@explorer/idl-decode'
// resolves to dist/ — build first). Creation/summary/naming sections group by client capability;
// decoding sections group by IDL flavor (modern Anchor / converted / Codama).
// Runtime flows over real IDLs — the typed acquisition routes are demonstrated in readme-flows.integration.spec.ts.
// All IDLs are real:
//   tokenkeg  — SPL Token's PMP-stored Codama root (mainnet snapshot)
//   converted — the generated Anchor IDL normalized with nodes-from-anchor
//   simple    — modern Anchor program (anchor-lang 1.1.2, test-anchor-programs/simple)
//   simple031 — Anchor 0.31 program (test-anchor-programs/simple-031), fetched through anchor's client (mocked Program.fetchIdl)
//   letMeBuy  — real mainnet Anchor program (Anchor-PDA + PMP snapshots)
import {
    type AnchorIdl,
    type CodamaIdl,
    createIdlClient,
    createIdlMetaClient,
    getIdlStandard,
    IDL_ERROR__IDL_PARSE_FAILED,
    IDL_ERROR__UNSUPPORTED_IDL_FORMAT,
    type IdlDecodeProvider,
    type IdlError,
    IdlStandard,
    type InstructionDecodeFor,
    isAnchorStandard,
    isCodamaStandard,
    isIdlError,
    isLegacyAnchorIdl,
    tryCreateIdlClient,
} from '@explorer/idl-decode';
// conversion is anchor-input-only — it lives behind its own entry
import { convertToCodama } from '@explorer/idl-decode/anchor';
import { codamaProvider } from '@explorer/idl-decode/codama';
// a literal `as const` codama root — its literal type drives zero-generic inference
import { vaultIdl } from '@explorer/test-idl-program-vault';
import { address, type Instruction } from '@solana/kit';
import { describe, expect, expectTypeOf, it } from 'vitest';

import {
    depositIx,
    incrementIx,
    loadLetMeBuyIdl,
    loadLetMeBuyPmpIdl,
    loadNtt029Idl,
    loadSimpleIdl,
    loadTokenkegIdl,
    NTT_PROGRAM_ADDRESS,
    ntt029TransferIx,
    transferIx,
    u64le,
    undeclaredInstructionData,
} from '../src/__tests__/fixtures';
import { unwrapResult } from '../src/__tests__/fixtures';
import { fetchAnchorIdl } from './anchor-helpers';

const TOKENKEG_ADDRESS = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

/** App flow: label an instruction from a transaction using the program's IDL. */
function labelInstruction(rawIdl: unknown, ix: Instruction): string {
    const [error, client] = tryCreateIdlClient(rawIdl);
    if (error) return 'Unknown'; // use the Result — degrade to a label, don't throw
    const name = ix.data ? client.instructionName(Uint8Array.from(ix.data)) : undefined;
    return name ?? 'Unknown';
}

const borshString = (value: string): number[] => {
    const bytes = new TextEncoder().encode(value);
    const length = new Uint8Array(4);
    new DataView(length.buffer).setUint32(0, bytes.length, true);
    return [...length, ...bytes];
};

/** `add_product('store', 'thing', 42)` against the real let_me_buy IDL, from its own discriminator. */
function addProductIx(idl: AnchorIdl): Instruction {
    const addProduct = idl.instructions.find(item => item.name === 'add_product');
    if (!addProduct) throw new Error('let_me_buy must declare add_product');
    return {
        accounts: [],
        data: new Uint8Array([
            ...addProduct.discriminator,
            ...borshString('store'),
            ...borshString('thing'),
            ...u64le(42n),
        ]),
        programAddress: address(idl.address),
    };
}

describe('capability: client creation from untrusted IDLs', () => {
    /** Case: untrusted JSON → error-first wrap → guard narrowing → parsed names, on the real codama root. */
    it('should go error-first tuple → guards → parsed data (real codama IDL)', () => {
        // 1. an IDL arrives as unknown JSON (resolve-program-idls, PMP fetch, user upload)
        const fetched: unknown = loadTokenkegIdl();

        // 2. wrap it — no throw on garbage, a typed error instead
        const client = unwrapResult(tryCreateIdlClient(fetched));

        // 3. custom logic via guards (ErrorBoundary/Suspense composition happens out here)
        expect(isCodamaStandard(client)).toBe(true);
        expect(isAnchorStandard(client)).toBe(false);

        // 4. parsed data, no decode needed
        expect(client.programName()).toBe('Token');
        expect(client.instructionName(Uint8Array.from([3, ...u64le(42n)]))).toBe('Transfer');
    });

    /** Case: the identical untrusted flow accepts a real mainnet Anchor IDL. */
    it('should handle a real anchor IDL through the same flow', () => {
        const client = unwrapResult(tryCreateIdlClient(loadLetMeBuyIdl()));

        expect(isCodamaStandard(client)).toBe(false);
        expect(isAnchorStandard(client)).toBe(true);
        expect(client.programName()).toBe('Let Me Buy');
    });

    /** Case: garbage input never throws — it returns a code-discriminated IdlError. */
    it('should report unsupported IDLs with a typed, code-discriminated error', () => {
        const [error, client] = tryCreateIdlClient({ some: 'garbage' });
        expect(client).toBeUndefined();
        // the consumer maps codes — to MCP payload errors, to Logger severities, to UI states
        expect(error && isIdlError(error, IDL_ERROR__UNSUPPORTED_IDL_FORMAT)).toBe(true);
    });
});

describe('capability: engine selection (default codama, swappable)', () => {
    /** Case: the name-only flow (MCP tools) — the meta client serves names with no decode surface. */
    it('should serve names and metadata through the meta client', () => {
        const simple = loadSimpleIdl();
        const client = createIdlMetaClient(simple);

        expect(client.programName()).toBe('Simple');
        expect(client.instructionName(incrementIx(simple).data)).toBe('Increment');
        // decoding is structurally AND statically absent
        expect('decodeInstruction' in client).toBe(false);
        expectTypeOf(client).not.toHaveProperty('decodeInstruction');
    });

    /** Case: the zero-config default-engine path — untrusted input straight to a decoding client. */
    it('should decode untrusted input through the default codama engine', () => {
        const tokenkeg = loadTokenkegIdl();
        const client = unwrapResult(tryCreateIdlClient(tokenkeg as unknown));

        const decode = client.decodeInstruction(transferIx(tokenkeg));
        expect(client.getDecodedData<{ amount: bigint }>(decode)).toMatchObject({ amount: 42n });
    });

    /** Case: the default engine chosen explicitly — the literal IDL keeps zero-generic inference through the explicit form. */
    it('should decode through an explicitly passed codama provider', () => {
        const client = createIdlClient(vaultIdl, { provider: codamaProvider() });

        const decode = client.decodeInstruction(depositIx(vaultIdl));
        const result = client.getDecodedData(decode);

        expectTypeOf(result).toEqualTypeOf<{ amount: bigint; discriminator: number } | undefined>();
        expect(result).toEqual({ amount: 42n, discriminator: 1 });
    });

    /** Case: the provider seam heavier engines (the Anchor-rich path) plug into — same client surface. */
    it('should run a consumer-supplied provider through the same client surface', () => {
        const simple = loadSimpleIdl();
        const customEngine: IdlDecodeProvider = {
            decodeAccount: () => ({ errors: [], kind: 'unknown' }),
            decodeInstruction: () => ({ decoded: { note: 'from the custom engine' }, kind: IdlStandard.Anchor }),
        };
        const client = createIdlClient(simple, { provider: customEngine });

        const decode = client.decodeInstruction(incrementIx(simple));
        expect(decode.kind).toBe(IdlStandard.Anchor);
        expect(client.getDecodedData<{ note: string }>(decode)).toEqual({ note: 'from the custom engine' });
    });
});

describe('capability: program summary (address, name, standard)', () => {
    /** Case: address/name/standard read from SPL Token's PMP-stored codama root. */
    it('should summarize SPL Token from its real PMP codama root', () => {
        const client = unwrapResult(tryCreateIdlClient(loadTokenkegIdl()));

        expect(client.programAddress()).toBe(TOKENKEG_ADDRESS);
        expect(client.programName()).toBe('Token');
        expect(getIdlStandard(client.idl)).toBe(IdlStandard.Codama);
    });

    /** Case: a nodes-from-anchor conversion result summarizes as a Codama program. */
    it('should summarize the converted Anchor IDL as a Codama program', () => {
        const simple = loadSimpleIdl();
        const converted = unwrapResult(convertToCodama(simple));

        const client = unwrapResult(tryCreateIdlClient(converted));

        expect(client.programAddress()).toBe(simple.address);
        expect(client.programName()).toBe('Simple');
        expect(client.programVersion()).toBe('0.1.0'); // the program's own semver survives conversion
        // post-conversion the format version is codama's (a codama root), not anchor's spec — value tracks @codama/nodes-from-anchor
        expect(client.formatVersion()).toMatch(/^\d+\.\d+\.\d+$/);
        expect(getIdlStandard(client.idl)).toBe(IdlStandard.Codama);
    });

    /** Case: the workspace anchor-lang 1.1.2 program summarizes as Anchor. */
    it('should summarize the modern Anchor program', () => {
        const client = unwrapResult(tryCreateIdlClient(loadSimpleIdl()));

        expect(client.programAddress()).toBe('7u9qtZPjJcQ1jZsZxAGyRM4aGLNXqK5pzawpULopWFqB');
        expect(client.programName()).toBe('Simple');
        expect(client.programVersion()).toBe('0.1.0'); // metadata.version
        expect(client.formatVersion()).toBe('0.1.0'); // metadata.spec — anchor's format version
        expect(getIdlStandard(client.idl)).toBe(IdlStandard.Anchor);
    });

    /** Case: the workspace Anchor 0.31 program, fetched through anchor's client, summarizes as Anchor. */
    it('should summarize the Anchor 0.31 program', async () => {
        const client = unwrapResult(tryCreateIdlClient(await fetchAnchorIdl()));

        expect(client.programAddress()).toBe('391y4fKGKUEt7n6HuKrkfGYLdkvnk6rvneR7snKe6wzy');
        expect(client.programName()).toBe('Simple 031');
        expect(getIdlStandard(client.idl)).toBe(IdlStandard.Anchor);
    });

    /** Case: a mainnet program's IDL from its Anchor PDA leg. */
    it('should summarize the real mainnet Anchor program (let_me_buy, Anchor PDA leg)', () => {
        const client = unwrapResult(tryCreateIdlClient(loadLetMeBuyIdl()));

        expect(client.programAddress()).toBe('BUYuxRfhCMWavaUWxhGtPP3ksKEDZxCD5gzknk3JfAya');
        expect(client.programName()).toBe('Let Me Buy');
        expect(getIdlStandard(client.idl)).toBe(IdlStandard.Anchor);
    });

    /** Case: the same program's PMP leg carries the same Anchor-format IDL. */
    it('should summarize the same program from its PMP leg — Anchor-format there too (PMP is storage, not a format)', () => {
        const client = unwrapResult(tryCreateIdlClient(loadLetMeBuyPmpIdl()));

        expect(client.programAddress()).toBe('BUYuxRfhCMWavaUWxhGtPP3ksKEDZxCD5gzknk3JfAya');
        expect(client.programName()).toBe('Let Me Buy');
        expect(getIdlStandard(client.idl)).toBe(IdlStandard.Anchor);
    });
});

describe('capability: instruction naming (discriminator table)', () => {
    /** Case: a PMP-style constant-u8 discriminator resolves through the codama name table. */
    it("should label SPL Token's transfer through the real codama root", () => {
        const tokenkeg = loadTokenkegIdl();
        const result = labelInstruction(tokenkeg, transferIx(tokenkeg));

        expectTypeOf(result).toEqualTypeOf<string>();
        expect(result).toBe('Transfer');
    });

    /** Case: converted IDLs keep byte-array discriminator resolution (fieldDiscriminatorNode with a bytes default). */
    it('should label instructions through the converted IDL', () => {
        const simple = loadSimpleIdl();
        const [, converted] = convertToCodama(simple);
        const result = labelInstruction(converted, incrementIx(simple));

        expectTypeOf(result).toEqualTypeOf<string>();
        expect(result).toBe('Increment');
    });

    /** Case: a real sha256 byte-array discriminator resolves through the native Anchor route. */
    it('should label the modern Anchor program instruction', () => {
        const simple = loadSimpleIdl();
        const result = labelInstruction(simple, incrementIx(simple));

        expectTypeOf(result).toEqualTypeOf<string>();
        expect(result).toBe('Increment');
    });

    /** Case: the same resolution works on the Anchor 0.31 IDL fetched through anchor's client. */
    it('should label the Anchor 0.31 program instruction', async () => {
        const simple031 = await fetchAnchorIdl();
        const result = labelInstruction(simple031, incrementIx(simple031));

        expectTypeOf(result).toEqualTypeOf<string>();
        expect(result).toBe('Increment');
    });

    /** Case: snake_case instruction names titleCase for display ('add_product' → 'Add Product'). */
    it('should label the real mainnet Anchor program instruction', () => {
        const letMeBuy = loadLetMeBuyIdl();
        const result = labelInstruction(letMeBuy, addProductIx(letMeBuy));

        expectTypeOf(result).toEqualTypeOf<string>();
        expect(result).toBe('Add Product');
    });
});

describe('decoding: modern Anchor IDLs', () => {
    /** Case: a mainnet IDL (runtime snapshot, wide) decodes borsh strings + u64 into camelCased args. */
    it('should decode the real mainnet add_product instruction', () => {
        const letMeBuy = loadLetMeBuyIdl();
        const client = createIdlClient(letMeBuy);

        const decode = client.decodeInstruction(addProductIx(letMeBuy));
        const result = client.getDecodedData<{ name: string; price: bigint; storeName: string }>(decode);

        expectTypeOf(result).toEqualTypeOf<{ name: string; price: bigint; storeName: string } | undefined>();
        expect(decode.kind).toBe(IdlStandard.Codama);
        expect(result).toMatchObject({
            name: 'thing',
            price: 42n,
            storeName: 'store',
        });
    });
});

describe('decoding: converted Anchor IDLs (nodes-from-anchor)', () => {
    /** Case: an Anchor IDL converted with the library conversion decodes like a native root. */
    it('should decode through the converted Anchor IDL', () => {
        const simple = loadSimpleIdl();
        const converted = unwrapResult(convertToCodama(simple));

        // the conversion result is the WIDE CodamaIdl (literal types do not survive a runtime
        // conversion), so the client narrows like a native root and the shape stays per-call
        const client = createIdlClient(converted);

        const decode = client.decodeInstruction(incrementIx(simple));
        const result = client.getDecodedData<{ amount: bigint }>(decode);

        expectTypeOf(result).toEqualTypeOf<{ amount: bigint } | undefined>();
        expect(decode.kind).toBe(IdlStandard.Codama);
        expect(result).toMatchObject({ amount: 42n });
    });
});

describe('decoding: Codama IDLs', () => {
    /** Case: a codama root decodes a kit instruction; the anchor arm is statically excluded. */
    it("should decode SPL Token's transfer through the real codama root", () => {
        const tokenkeg = loadTokenkegIdl();
        const client = createIdlClient(tokenkeg);

        const decode = client.decodeInstruction(transferIx(tokenkeg));
        const result = client.getDecodedData<{ amount: bigint }>(decode);

        // the codama client statically excludes the anchor arm
        expectTypeOf(decode).toEqualTypeOf<InstructionDecodeFor<typeof tokenkeg>>();
        expectTypeOf(result).toEqualTypeOf<{ amount: bigint } | undefined>();
        expect(decode.kind).toBe(IdlStandard.Codama);
        expect(result).toMatchObject({ amount: 42n });
    });
});

describe('built declarations type probe', () => {
    // These cases pin the BUILT surface — behavior is unit-covered at src; a dist build/.d.ts
    // regression (collapsed overload, dropped option or export) is what they exist to catch.
    /** Case: dist/*.d.ts must keep the Result tuple precise — toEqualTypeOf fails on `any` degradation. */
    it('should keep the convertToCodama result tuple precisely typed', () => {
        const [conversionError, converted] = convertToCodama(loadSimpleIdl());

        expectTypeOf(converted).toEqualTypeOf<CodamaIdl | undefined>();
        expectTypeOf(conversionError).toEqualTypeOf<IdlError<typeof IDL_ERROR__IDL_PARSE_FAILED> | undefined>();
        expect(conversionError).toBeUndefined();
        expect(converted).toBeDefined();
    });

    /** Case: the handler-map overload must survive the build — dispatch returns the handlers' R, not the decode envelope. */
    it('should keep the handler-map overload dispatching through the built client', () => {
        const simple = loadSimpleIdl();
        const client = createIdlClient(simple);

        const label = client.decodeInstruction(incrementIx(simple), {
            anchor: () => 'anchor',
            codama: () => 'codama',
            unknown: () => 'unknown',
        });

        expectTypeOf(label).toEqualTypeOf<string>();
        expect(label).toBe('codama');
    });

    /** Case: the fallbackDecoder option must survive the build — a rescue lands on the anchor arm. */
    it('should keep the fallbackDecoder option rescuing through the built client', () => {
        const simple = loadSimpleIdl();
        const client = createIdlClient(simple, {
            fallbackDecoder: {
                decodeInstruction: () => ({ name: 'airdrop' }),
            },
        });

        const decode = client.decodeInstruction({
            accounts: [],
            data: undeclaredInstructionData(),
            programAddress: address(simple.address),
        });

        expect(decode.kind).toBe(IdlStandard.Anchor);
        expect(client.getDecodedData<{ name: string }>(decode)).toEqual({ name: 'airdrop' });
    });

    /** Case: the legacy guard must survive the build as a named export. */
    it('should keep the legacy guard exported from the built package', () => {
        expect(isLegacyAnchorIdl(loadNtt029Idl())).toBe(true);
        expect(isLegacyAnchorIdl(loadSimpleIdl())).toBe(false);
    });

    /** Case: the legacy convert-at-creation route must survive the build — option plumbed, names derived. */
    it('should keep the legacy creation route working through the built client', () => {
        const client = createIdlClient(loadNtt029Idl(), { programAddress: NTT_PROGRAM_ADDRESS });

        expect(client.programAddress()).toBe(NTT_PROGRAM_ADDRESS);
        // legacy IDLs declare no discriminators — the name resolves off the conversion's derived table
        expect(client.instructionName(ntt029TransferIx.data)).toBe('Transfer Burn');
    });
});
