import { parseInstruction } from '@codama/dynamic-parsers';
import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';
import {
    bytesTypeNode,
    bytesValueNode,
    constantDiscriminatorNode,
    constantValueNode,
    fixedSizeTypeNode,
    type RootNode,
} from 'codama';

import { toKitInstruction } from '@/app/shared/lib/web3js-compat';

import { CodamaInstructionCard } from '../codama/CodamaInstructionDetailsCard';
import { UnknownDetailsCard } from '../UnknownDetailsCard';

/**
 * Programs with a single instruction and no discriminators (e.g. Memo) can't be
 * identified by the standard parser. This injects a zero-length constant
 * discriminator that matches any byte payload, letting parseInstruction proceed
 * with codec-based decoding.
 */
function withCatchAllDiscriminator(idl: RootNode): RootNode | null {
    if (idl.kind !== 'rootNode') return null;
    const { instructions } = idl.program;
    if (instructions.length !== 1) return null;

    const ix = instructions[0];
    if (ix.discriminators && ix.discriminators.length > 0) return null;

    return {
        ...idl,
        program: {
            ...idl.program,
            instructions: [
                {
                    ...ix,
                    discriminators: [
                        constantDiscriminatorNode(
                            constantValueNode(fixedSizeTypeNode(bytesTypeNode(), 0), bytesValueNode('base16', '')),
                        ),
                    ],
                },
            ],
        },
    } as RootNode;
}

export function ProgramMetadataIdlInstructionDetailsCard({
    ix,
    result,
    index,
    innerCards,
    idl,
}: {
    ix: TransactionInstruction;
    result: SignatureResult;
    index: number;
    innerCards?: JSX.Element[];
    idl: any;
}) {
    const props = {
        index,
        innerCards,
        ix,
        result,
    };
    const kitIx = toKitInstruction(ix);

    const tryParse = (idlRoot: RootNode) => {
        try {
            const parsedIx = parseInstruction(idlRoot, kitIx);
            if (parsedIx) {
                return <CodamaInstructionCard {...props} parsedIx={parsedIx} />;
            }
        } catch {
            // ignore and fallback
        }
        return null;
    };

    let parsedCard = tryParse(idl as RootNode);
    if (!parsedCard) {
        try {
            parsedCard = tryParse(rootNodeFromAnchor(idl) as unknown as RootNode);
        } catch {
            // ignore and fallback
        }
    }

    // Fallback for single-instruction programs without discriminators (e.g. Memo)
    if (!parsedCard) {
        const modified = withCatchAllDiscriminator(idl as RootNode);
        if (modified) {
            parsedCard = tryParse(modified);
        }
    }

    return parsedCard ?? <UnknownDetailsCard {...props} />;
}
