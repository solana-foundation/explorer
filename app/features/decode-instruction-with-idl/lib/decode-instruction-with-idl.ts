import { parseInstruction } from '@codama/dynamic-parsers';
import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';
import { Idl, Program } from '@coral-xyz/anchor';
import { formatSerdeIdl, getFormattedIdl, getIdlDeclaredAddress, getProvider } from '@entities/idl';
import { TransactionInstruction } from '@solana/web3.js';
import { type RootNode } from 'codama';

import { Logger } from '@/app/shared/lib/logger';
import { toKitInstruction } from '@/app/shared/lib/web3js-compat';

import { type AnchorInstructionDecoded, decodeAnchorInstruction } from './decode-anchor-instruction';

type CodamaParsedInstruction = NonNullable<ReturnType<typeof parseInstruction>>;

export type IdlInstructionDecode =
    | { kind: 'codama'; parsedIx: CodamaParsedInstruction }
    | { kind: 'anchor'; program: Program<Idl>; details: AnchorInstructionDecoded }
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

    const isRootNode = (idl as { kind?: string })?.kind === 'rootNode';
    const legacyAnchorIdl = (idl as { legacyAnchorIdl?: unknown }).legacyAnchorIdl;

    if (isRootNode && !legacyAnchorIdl) {
        const parsedIx = tryCodama(idl as RootNode);
        return parsedIx ? { kind: 'codama', parsedIx } : { kind: 'unknown' };
    }

    const anchorIdl = legacyAnchorIdl ?? idl;
    try {
        const program = new Program(
            getFormattedIdl(formatSerdeIdl, anchorIdl, kitIx.programAddress),
            getProvider(url),
        ) as Program<Idl>;
        return { details: decodeAnchorInstruction(program, ix), kind: 'anchor', program };
    } catch (error) {
        Logger.debug('[decode-instruction-with-idl] Anchor Program build failed; trying codama', { error });
    }

    try {
        const root = isRootNode
            ? (idl as RootNode)
            : (rootNodeFromAnchor(idl as Parameters<typeof rootNodeFromAnchor>[0]) as unknown as RootNode);
        const parsedIx = tryCodama(root);
        if (parsedIx) return { kind: 'codama', parsedIx };
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
