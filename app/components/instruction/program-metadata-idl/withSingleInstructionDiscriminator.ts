import {
    assertIsNode,
    bottomUpTransformerVisitor,
    bytesTypeNode,
    bytesValueNode,
    constantDiscriminatorNode,
    constantValueNode,
    fixedSizeTypeNode,
    type RootNode,
    visit,
} from 'codama';

// Zero-length constant matches any payload prefix, satisfying the parser's
// "must have a discriminator to be identifiable" requirement without consuming bytes.
const CATCH_ALL_DISCRIMINATOR = constantDiscriminatorNode(
    constantValueNode(fixedSizeTypeNode(bytesTypeNode(), 0), bytesValueNode('base16', '')),
);

// Single-instruction programs without a discriminator (e.g. Memo v4) can't be identified by
// the dynamic parser; inject a catch-all so its sole instruction always matches.
export function withSingleInstructionDiscriminator(root: RootNode): RootNode {
    if (root.program.instructions.length !== 1) return root;

    return visit(
        root,
        bottomUpTransformerVisitor([
            {
                select: '[instructionNode]',
                transform: node => {
                    assertIsNode(node, 'instructionNode');
                    return node.discriminators?.length ? node : { ...node, discriminators: [CATCH_ALL_DISCRIMINATOR] };
                },
            },
        ]),
    ) as RootNode;
}
