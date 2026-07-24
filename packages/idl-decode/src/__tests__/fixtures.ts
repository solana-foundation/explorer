import { createHash } from 'node:crypto';

import { createProgramClient, type ProgramClient } from '@codama/dynamic-client';
import { expect } from 'vitest';

import ammV3Idl from '@explorer/test-idl-program-amm-v3/idl';
import exampleNativeTokenTransfersIdl from '@explorer/test-idl-program-example-native-token-transfers/idl';
import type { ExampleNativeTokenTransfers } from '@explorer/test-idl-program-example-native-token-transfers/generated-types';
import letMeBuyIdl from '@explorer/test-idl-program-let-me-buy/idl';
import letMeBuyPmpIdl from '@explorer/test-idl-program-let-me-buy/pmp-idl';
import memoIdl from '@explorer/test-idl-program-memo/idl';
import simpleIdl from '@explorer/test-idl-program-simple/idl';
import type { Simple } from '@explorer/test-idl-program-simple/generated-types';
import simple031Idl from '@explorer/test-idl-program-simple-031/idl';
import type { Simple031 } from '@explorer/test-idl-program-simple-031/generated-types';
import tokenkegIdl from '@explorer/test-idl-program-tokenkeg/idl';
import { address, getU64Encoder, type Instruction } from '@solana/kit';

import type { Result } from '../errors';
import type { AnchorIdl, AnchorV00Idl, CodamaIdl, CodamaIdlInput } from '../types';

export type { ExampleNativeTokenTransfers, Simple, Simple031 };

// Loaders clone the package snapshots — module imports are singletons, and a mutating test must not leak into the next.
/** let_me_buy's IDL from its Anchor PDA (mainnet snapshot). */
export const loadLetMeBuyIdl = (): AnchorIdl => structuredClone(letMeBuyIdl) as AnchorIdl;
/** let_me_buy's IDL from its PMP `idl` account — Anchor-format there too. */
export const loadLetMeBuyPmpIdl = (): AnchorIdl => structuredClone(letMeBuyPmpIdl) as AnchorIdl;
/** SPL Token's PMP-stored Codama root node (mainnet snapshot). */
export const loadTokenkegIdl = (): CodamaIdl => structuredClone(tokenkegIdl) as unknown as CodamaIdl;
/** SPL Memo v4's PMP-stored Codama root (mainnet snapshot) — one discriminator-less instruction. */
export const loadMemoIdl = (): CodamaIdl => structuredClone(memoIdl) as unknown as CodamaIdl;
/** IDL emitted by `anchor build` (anchor-lang 1.1.2) for `test-anchor-programs/simple`. */
export const loadSimpleIdl = (): AnchorIdl => structuredClone(simpleIdl) as AnchorIdl;
/** Same document typed with anchor's companion type — its camelCase view matches decoded payload keys. */
export const loadSimpleIdlTyped = (): Simple => structuredClone(simpleIdl) as Simple;
/** IDL emitted by `anchor build` (anchor-lang 0.31.1) for `test-anchor-programs/simple-031`. */
export const loadSimple031Idl = (): AnchorIdl => structuredClone(simple031Idl) as AnchorIdl;
/** Same document typed with anchor's companion type. */
export const loadSimple031IdlTyped = (): Simple031 => structuredClone(simple031Idl) as Simple031;
/** Real anchor-0.29 (legacy, pre-0.30) IDL — wormhole NTT `example_native_token_transfers` v3.0.0, vendored as a test sample. */
export const loadNtt029Idl = (): AnchorV00Idl => structuredClone(exampleNativeTokenTransfersIdl) as AnchorV00Idl;
/** `amm_v3` in v0.1 shape — the app's convert-legacy-idl output over the on-chain 0.29 doc; its spec-correct alias typedef (`kind: 'type'`) is what pristine nodes-from-anchor 1.3.8 rejects. */
export const loadAmmV3Idl = (): AnchorIdl => structuredClone(ammV3Idl) as AnchorIdl;
/** The same document typed with anchor 0.29's companion type (`export type` + a runtime `IDL` const). */
export const loadNtt029IdlTyped = (): ExampleNativeTokenTransfers =>
    structuredClone(exampleNativeTokenTransfersIdl) as ExampleNativeTokenTransfers;

// kit's u64 codec is little-endian — no hand-rolled DataView layout to keep in sync
export const u64le = (value: bigint): number[] => Array.from(getU64Encoder().encode(value));

/** `increment(amount: 42)` built from the program's own declared discriminator, as a kit instruction. */
export const incrementIx = (idl: AnchorIdl): Instruction & { accounts: []; data: Uint8Array } => {
    const increment = idl.instructions.find(item => item.name === 'increment');
    if (!increment) throw new Error('program must declare increment');
    return {
        accounts: [],
        data: new Uint8Array([...increment.discriminator, ...u64le(42n)]),
        programAddress: address(idl.address),
    };
};

/** `deposit(amount: 42)` for the vault literal — stands in for an instruction arriving from a transaction. */
export const depositIx = (idl: CodamaIdlInput): Instruction & { accounts: []; data: Uint8Array } => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- literal IDLs narrow structurally; the branded root is only needed to walk instructions
    const root = idl as unknown as CodamaIdl;
    const deposit = root.program.instructions.find(item => item.name === 'deposit');
    const discriminator = deposit?.arguments[0]?.defaultValue;
    if (!discriminator || !('number' in discriminator)) {
        throw new Error('program must declare deposit with a constant discriminator');
    }
    return {
        accounts: [],
        data: new Uint8Array([discriminator.number, ...u64le(42n)]),
        programAddress: address(root.program.publicKey),
    };
};

/** `transfer(amount: 42)` built from a Codama root's declared constant u8 field discriminator (SPL Token shape). */
export const transferIx = (idl: CodamaIdl): Instruction & { accounts: []; data: Uint8Array } => {
    const transfer = idl.program.instructions.find(item => item.name === 'transfer');
    const discriminator = transfer?.arguments[0]?.defaultValue;
    if (!discriminator || !('number' in discriminator)) {
        throw new Error('program must declare transfer with a constant discriminator');
    }
    return {
        accounts: [],
        data: new Uint8Array([discriminator.number, ...u64le(42n)]),
        programAddress: address(idl.program.publicKey),
    };
};

// wormhole NTT's real mainnet program id (declare_id! in example-native-token-transfers) — a real
// pre-0.30 Anchor program, so the legacy fixtures don't impersonate the System Program (`1111…`).
export const NTT_PROGRAM_ADDRESS = 'nttiK1SepaQt6sZ4WGW5whvc9tEnGXGxuKeptcQPCcS';
// Anchor (<= 0.29) derives an instruction discriminator as sha256('global:<snake_case_name>')[..8].
const legacyAnchorDiscriminator = (snakeName: string): number[] =>
    Array.from(createHash('sha256').update(`global:${snakeName}`).digest().subarray(0, 8));
// The real discriminator for NTT's `transfer_burn` instruction (its IDL name is the camelCase `transferBurn`).
export const NTT_TRANSFER_BURN_DISCRIMINATOR = legacyAnchorDiscriminator('transfer_burn');
// Valid discriminator width, intentionally undeclared by the simple program.
export const undeclaredInstructionData = () => Uint8Array.from([9, 9, 9, 9, 9, 9, 9, 9]);

/** A real anchor-0.29 instruction's bytes — NTT `transfer_burn` (real id + derived discriminator + a u64 arg). */
export const ntt029TransferIx: Instruction & { accounts: []; data: Uint8Array } = {
    accounts: [],
    data: new Uint8Array([...NTT_TRANSFER_BURN_DISCRIMINATOR, ...u64le(42n)]),
    programAddress: address(NTT_PROGRAM_ADDRESS),
};

// Codama drivers — codama's OWN tooling sits on the encode side, so the engine under test only ever
// sees what real consumers produce.
export const DEFAULT_ADDRESS = '11111111111111111111111111111111';

/** The PMP-fetch acquisition route for codama roots: plain untrusted JSON, no anchor client involved. */
export function fetchedJson(idl: CodamaIdlInput): unknown {
    return JSON.parse(JSON.stringify(idl));
}

/** Build the named zero-argument instruction with codama's OWN dynamic client (every account defaulted). */
export async function buildInstruction(idl: CodamaIdlInput, name: string): Promise<Instruction> {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- the input is a known codama root; the branded type is only needed to walk instructions
    const root = idl as unknown as CodamaIdl;
    const node = root.program.instructions.find(item => item.name === name);
    if (!node) throw new Error(`${name} must be declared by the IDL`);
    const accounts = Object.fromEntries(node.accounts.map(item => [item.name, DEFAULT_ADDRESS]));
    const built = await createProgramClient<ProgramClient>(root).methods[name]().accounts(accounts).instruction();
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- bridges codama tooling's instruction shape with kit's
    return built as Instruction;
}

// Infer the ok-arm value from the whole Result — inferring `T` through the tuple union leaks `undefined`.
type OkValue<R> = R extends readonly [undefined, infer T] ? T : never;

/** Assert an ok Result (fails the test via `expect` on error) and return its value — NOT the public decode-envelope `unwrap`. */
export function unwrapResult<R extends Result<unknown>>(result: R): OkValue<R> {
    const [error, value] = result;
    expect(error).toBeUndefined();
    if (value === undefined) throw error ?? new Error('unwrap: expected an ok Result'); // narrows value off undefined
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- the tuple checks above are the narrowing; TS cannot re-prove it through the conditional type
    return value as OkValue<R>;
}
