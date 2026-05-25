import type { Meta, StoryObj } from '@storybook/react';
import { createNextjsParameters, withClipboardMock, withCluster } from '@storybook-config/decorators';
import { expect, within } from 'storybook/test';

import { Signature } from '../Signature';

const EXAMPLE_SIG = '5KKsLVU6TcbVDK4BS6K1DGDxnh4Q9xjYJ8XaDCG5t8SnZeznkjtrfEpsXe87KXk5V5BfVMGAv2NhVJFSq7xvMJV';

const meta = {
    component: Signature,
    decorators: [withClipboardMock, withCluster],
    parameters: createNextjsParameters(),
    tags: ['test'],
    title: 'Components/Common/Signature',
} satisfies Meta<typeof Signature>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        signature: EXAMPLE_SIG,
    },
    async play({ canvasElement }) {
        const canvas = within(canvasElement);
        expect(canvas.getByText(EXAMPLE_SIG)).toBeInTheDocument();
    },
};

export const WithLink: Story = {
    args: {
        link: true,
        signature: EXAMPLE_SIG,
    },
    async play({ canvasElement }) {
        const canvas = within(canvasElement);
        expect(canvas.getByRole('link')).toBeInTheDocument();
    },
};

export const AlignRight: Story = {
    args: {
        alignRight: true,
        signature: EXAMPLE_SIG,
    },
    decorators: [
        Story => (
            <div style={{ width: '100%' }}>
                <Story />
            </div>
        ),
    ],
};

export const NoTruncate: Story = {
    args: {
        noTruncate: true,
        signature: EXAMPLE_SIG,
    },
    decorators: [
        Story => (
            <div style={{ width: '100%' }}>
                <Story />
            </div>
        ),
    ],
};

/** Narrow container triggers mid-truncation: "5KKsL...xvMJV" */
export const Truncated: Story = {
    args: {
        signature: EXAMPLE_SIG,
    },
    decorators: [
        Story => (
            <div style={{ width: 200 }}>
                <Story />
            </div>
        ),
    ],
};
