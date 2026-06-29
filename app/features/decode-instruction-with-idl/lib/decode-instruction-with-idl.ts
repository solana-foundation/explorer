import { parseInstruction } from '@codama/dynamic-parsers';
import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';
import { Idl, Program } from '@coral-xyz/anchor';
import { formatSerdeIdl, getFormattedIdl, getProvider } from '@entities/idl';
import { TransactionInstruction } from '@solana/web3.js';
import { type RootNode } from 'codama';

import { Logger } from '@/app/shared/lib/logger';
import { toKitInstruction } from '@/app/shared/lib/web3js-compat';

import { withSingleInstructionDiscriminator } from './with-single-instruction-discriminator';

type CodamaParsedInstruction = NonNullable<ReturnType<typeof parseInstruction>>;

// Which renderer a decoded instruction maps to. The decode *strategy* is decided here; the caller only
// matches a result to a card.
export type IdlInstructionDecode =
    | { kind: 'codama'; parsedIx: CodamaParsedInstruction }
    | { kind: 'anchor'; program: Program<Idl> }
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

    let parsedIx = tryCodama(idl as RootNode);
    if (!parsedIx) {
        try {
            parsedIx = tryCodama(
                rootNodeFromAnchor(idl as Parameters<typeof rootNodeFromAnchor>[0]) as unknown as RootNode,
            );
        } catch {
            // ignore — fall through to the Anchor coder
        }
    }
    // Single-instruction programs without discriminators (e.g. Memo): inject a catch-all.
    if (!parsedIx && (idl as { kind?: string })?.kind === 'rootNode') {
        parsedIx = tryCodama(withSingleInstructionDiscriminator(idl as RootNode));
    }
    if (parsedIx) return { kind: 'codama', parsedIx };

    // Codama rejected it — most often an Anchor IDL `@codama/nodes-from-anchor` can't convert (e.g. an
    // unnamed arg). Anchor's BorshInstructionCoder is more lenient.
    try {
        const program = new Program(getFormattedIdl(formatSerdeIdl, idl, kitIx.programAddress), getProvider(url));
        return { kind: 'anchor', program: program as Program<Idl> };
    } catch (error) {
        Logger.debug('[decode-instruction-with-idl] Anchor fallback failed', { error });
    }

    return { kind: 'unknown' };
}
