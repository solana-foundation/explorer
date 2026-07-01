import { parseInstruction } from '@codama/dynamic-parsers';
import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';
import { Idl, Program } from '@coral-xyz/anchor';
import { formatSerdeIdl, getFormattedIdl, getProvider } from '@entities/idl';
import { TransactionInstruction } from '@solana/web3.js';
import { type RootNode } from 'codama';

import { Logger } from '@/app/shared/lib/logger';
import { toKitInstruction } from '@/app/shared/lib/web3js-compat';

import { type AnchorInstructionDecoded, decodeAnchorInstruction } from './decode-anchor-instruction';
import { withSingleInstructionDiscriminator } from './with-single-instruction-discriminator';

type CodamaParsedInstruction = NonNullable<ReturnType<typeof parseInstruction>>;

// Which renderer a decoded instruction maps to, fully decoded — the caller only matches a result to a
// card, it never finishes the decode. Routing is by IDL kind: Codama-native roots (PMP) decode through
// Codama; Anchor IDLs decode through the Anchor Program (the `anchor` result carries it, for events +
// nested account groups), with Codama-from-Anchor kept only as a last resort.
export type IdlInstructionDecode =
    | { kind: 'codama'; parsedIx: CodamaParsedInstruction }
    | { kind: 'anchor'; program: Program<Idl>; details: AnchorInstructionDecoded }
    | { kind: 'unknown' };

// Decode an instruction with the help of the program's IDL — in contrast to the program-specific
// `decode-instruction-*` slices, which know one program statically, this decodes any program given its
// (Codama or Anchor) IDL. Uses web3.js because the Anchor fallback (`Program`/`BorshInstructionCoder`)
// is web3.js-native.
// Codama root nodes carry the program id at `program.publicKey`; Anchor IDLs at `address` (0.30+) or `metadata.address`.
function idlProgramAddress(idl: unknown): string | undefined {
    const root = idl as { program?: { publicKey?: string }; address?: string; metadata?: { address?: string } };
    return root?.program?.publicKey ?? root?.address ?? root?.metadata?.address;
}

export function decodeInstructionWithIdl(ix: TransactionInstruction, idl: unknown, url: string): IdlInstructionDecode {
    const kitIx = toKitInstruction(ix);

    // A resolved IDL whose declared program differs from the instruction's is a wiring bug (wrong IDL
    // routed to this instruction) — fail loud rather than mis-decode against the wrong interface.
    const declaredProgram = idlProgramAddress(idl);
    if (declaredProgram && declaredProgram !== kitIx.programAddress) {
        const error = new Error(
            `[decode-instruction-with-idl] IDL program ${declaredProgram} does not match instruction program ${kitIx.programAddress}`,
        );
        Logger.panic(error, { sentryExtras: { declaredProgram, programAddress: kitIx.programAddress } });
        throw error;
    }

    const tryCodama = (root: RootNode): CodamaParsedInstruction | undefined => {
        try {
            return parseInstruction(root, kitIx) ?? undefined;
        } catch {
            return undefined;
        }
    };

    // Codama-native IDLs (PMP and any stored Codama root node) decode through Codama directly.
    if ((idl as { kind?: string })?.kind === 'rootNode') {
        // Single-instruction programs without discriminators (e.g. Memo): inject a catch-all.
        const parsedIx = tryCodama(idl as RootNode) ?? tryCodama(withSingleInstructionDiscriminator(idl as RootNode));
        return parsedIx ? { kind: 'codama', parsedIx } : { kind: 'unknown' };
    }

    // Anchor IDLs render through the rich Anchor card (events from the tx logs + collapsible nested account
    // groups), so decode against the Anchor Program first. `@codama/nodes-from-anchor` can convert many
    // Anchor IDLs, but the flat Codama card would drop those features — so keep it only as a last resort,
    // for IDLs the Anchor Program constructor rejects.
    try {
        const program = new Program(
            getFormattedIdl(formatSerdeIdl, idl, kitIx.programAddress),
            getProvider(url),
        ) as Program<Idl>;
        return { details: decodeAnchorInstruction(program, ix), kind: 'anchor', program };
    } catch (error) {
        Logger.debug('[decode-instruction-with-idl] Anchor Program build failed; trying codama', { error });
    }

    // Last resort: convert the Anchor IDL to a Codama root node.
    try {
        const parsedIx = tryCodama(
            rootNodeFromAnchor(idl as Parameters<typeof rootNodeFromAnchor>[0]) as unknown as RootNode,
        );
        if (parsedIx) return { kind: 'codama', parsedIx };
    } catch {
        // ignore — nothing could decode it
    }

    return { kind: 'unknown' };
}

// `decodeInstructionWithIdl` fail-louds (pages Sentry, then throws) on an IDL/program-id mismatch. This
// wrapper degrades that to an Unknown decode so a single mis-wired IDL can't throw the whole instruction
// list out. Shared by both surfaces so the degrade behaviour can't drift.
export function safeDecodeInstructionWithIdl(
    ix: TransactionInstruction,
    idl: unknown,
    url: string,
): IdlInstructionDecode {
    try {
        return decodeInstructionWithIdl(ix, idl, url);
    } catch {
        return { kind: 'unknown' };
    }
}
