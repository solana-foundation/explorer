import { parseInstruction } from '@codama/dynamic-parsers';
import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';
import { Idl, Program } from '@coral-xyz/anchor';
import { formatSerdeIdl, getFormattedIdl, getIdlDeclaredAddress, getProvider } from '@entities/idl';
import type { InstructionArg } from '@entities/instruction-card';
import { TransactionInstruction } from '@solana/web3.js';
import { type RootNode } from 'codama';

import { Logger } from '@/app/shared/lib/logger';
import { toKitInstruction } from '@/app/shared/lib/web3js-compat';

import { type AnchorInstructionDecoded, decodeAnchorInstruction } from './decode-anchor-instruction';
import { decodeSelfCpiEvent } from './decode-self-cpi-event';

type CodamaParsedInstruction = NonNullable<ReturnType<typeof parseInstruction>>;

export type IdlInstructionDecode =
    | { kind: 'codama'; parsedIx: CodamaParsedInstruction }
    | { kind: 'anchor'; program: Program<Idl>; details: AnchorInstructionDecoded }
    | { kind: 'self-cpi-event'; programName: string; name: string; args: readonly InstructionArg[] }
    | { kind: 'unknown' };

export function decodeInstructionWithIdl(ix: TransactionInstruction, idl: unknown, url: string): IdlInstructionDecode {
    const kitIx = toKitInstruction(ix);

    const declared = getIdlDeclaredAddress(idl);
    const declaredProgram = declared.kind === 'address' ? declared.address : undefined;
    if (declared.kind === 'malformed' || (declaredProgram && declaredProgram !== kitIx.programAddress)) {
        const error = new Error(
            `[decode-instruction-with-idl] IDL program ${declaredProgram ?? '(malformed)'} does not match instruction program ${kitIx.programAddress}`,
        );
        Logger.panic(error, { sentryExtras: { declaredProgram, programAddress: kitIx.programAddress } });
        throw error;
    }

    const tryCodama = (root: RootNode): CodamaParsedInstruction | undefined => {
        try {
            return parseInstruction(root, kitIx) ?? undefined;
        } catch (error) {
            Logger.error(new Error('Codama parseInstruction failed', { cause: error }), {
                sentry: true,
            });
            return undefined;
        }
    };

    // parseInstruction first; an emit_cpi self-CPI carries no IDL instruction, so decode it as an event.
    const codamaDecode = (root: RootNode): IdlInstructionDecode => {
        const parsedIx = tryCodama(root);
        if (parsedIx) return { kind: 'codama', parsedIx };
        // codama's RootNode type skews across @codama/node-types versions; the runtime shape is identical
        const selfCpi = decodeSelfCpiEvent(ix.data, root as unknown as Parameters<typeof decodeSelfCpiEvent>[1]);
        return selfCpi ? { kind: 'self-cpi-event', ...selfCpi } : { kind: 'unknown' };
    };

    // A codama root — native, or an Anchor IDL the resolver already converted (legacy pre-0.30) — decodes
    // through the codama engine. A legacy IDL must never reach `new Program()`: anchor 0.30.1 throws on it,
    // and its instructions, events and accounts now decode via codama.
    const isRootNode = (idl as { kind?: string })?.kind === 'rootNode';
    if (isRootNode) {
        return codamaDecode(idl as RootNode);
    }

    // A modern (0.30+) Anchor IDL builds a Program for the rich anchor decode.
    try {
        const program = new Program(
            getFormattedIdl(formatSerdeIdl, idl, kitIx.programAddress),
            getProvider(url),
        ) as Program<Idl>;
        return { details: decodeAnchorInstruction(program, ix), kind: 'anchor', program };
    } catch (error) {
        Logger.debug('[decode-instruction-with-idl] Anchor Program build failed; trying codama', { error });
    }

    try {
        const root = rootNodeFromAnchor(idl as Parameters<typeof rootNodeFromAnchor>[0]) as unknown as RootNode;
        const decode = codamaDecode(root);
        if (decode.kind !== 'unknown') return decode;
    } catch {
        // ignore — nothing could decode it
    }

    return { kind: 'unknown' };
}

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
