import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ScrollAnchorProvider } from '@/app/providers/scroll-anchor';

import { type InstructionNode, toInstructionNode } from '../model/node';
import { type InstructionSurface, InstructionSurfaceProvider } from '../model/surface';
import { InstructionCardView } from '../ui/InstructionCardView';
import { InstructionNodeCards } from '../ui/InstructionNodeCards';

vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));
vi.mock('@/app/components/common/Address', () => ({ Address: () => <div /> }));
vi.mock('@components/inspector/AddressWithContext', () => ({
    AddressWithContext: () => <div>validated program</div>,
    programValidator: () => undefined,
}));

const IX = new TransactionInstruction({ data: Buffer.from([1]), keys: [], programId: PublicKey.default });

describe('InstructionNodeCards', () => {
    it('should render each node through the Card of the surface', () => {
        renderOnSurface(<InstructionNodeCards nodes={[node({ index: 0 }), node({ index: 1 })]} />);

        expect(screen.getAllByRole('article').map(card => card.textContent)).toEqual(['card #1', 'card #2']);
    });

    it('should number and anchor a top-level instruction the page cannot resolve', () => {
        renderOnSurface(<InstructionNodeCards nodes={[node({ index: 0 }), undefined]} />);

        expect(screen.getByText('Could not display instruction #2, please report')).toBeInTheDocument();
        expect(screen.getByText('Unknown Instruction')).toBeInTheDocument();
        // eslint-disable-next-line testing-library/no-node-access -- the anchor id is what is under test
        expect(document.getElementById('ix-2')).not.toBeNull();
    });
});

describe('InstructionCardView', () => {
    it('should render the children of the node inside the frame', () => {
        const parent = node({ children: [node({ childIndex: 0, index: 2 }), undefined], index: 2 });

        renderOnSurface(<InstructionCardView node={parent} title="Parent" />);

        expect(screen.getByText('Inner Instructions')).toBeInTheDocument();
        expect(screen.getByRole('article')).toHaveTextContent('card #3.1');
        expect(screen.getByText('Could not display instruction #3.2, please report')).toBeInTheDocument();
    });

    it.each([
        ['has no children', node({ index: 0 })],
        ['has an empty list of children', node({ children: [], index: 0 })],
    ])('should draw no Inner Instructions section when the node %s', (_, leaf) => {
        renderOnSurface(<InstructionCardView node={leaf} title="Leaf" />);

        expect(screen.getByText('Leaf')).toBeInTheDocument();
        expect(screen.queryByText('Inner Instructions')).not.toBeInTheDocument();
    });

    it.each([
        { validateProgram: true, validated: 1 },
        { validateProgram: false, validated: 0 },
    ])(
        'should check the program in the Raw view when validateProgram is $validateProgram',
        ({ validateProgram, validated }) => {
            renderOnSurface(<InstructionCardView node={node({ index: 0 })} title="Leaf" />, { validateProgram });

            expect(screen.queryAllByText('validated program')).toHaveLength(validated);
        },
    );
});

function node(fields: Omit<InstructionNode, 'ix' | 'programId'>): InstructionNode {
    return toInstructionNode({ ...fields, ix: IX });
}

function renderOnSurface(ui: JSX.Element, overrides: Partial<InstructionSurface> = {}) {
    const surface: InstructionSurface = {
        Card: StubCard,
        collapsible: false,
        instructionData: () => undefined,
        rawInstructions: undefined,
        result: { err: null },
        signature: undefined,
        validateProgram: false,
        ...overrides,
    };

    return render(
        <ScrollAnchorProvider>
            <InstructionSurfaceProvider surface={surface}>{ui}</InstructionSurfaceProvider>
        </ScrollAnchorProvider>,
    );
}

function StubCard({ node }: { node: InstructionNode }) {
    const position = node.childIndex === undefined ? `${node.index + 1}` : `${node.index + 1}.${node.childIndex + 1}`;
    return <article>{`card #${position}`}</article>;
}
