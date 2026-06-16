import type { Meta, StoryObj } from '@storybook/react';

import { JsonViewer, SolarizedJsonViewer } from '../JsonViewer';

const sampleData = {
    accounts: [
        { isSigner: true, isWritable: true, pubkey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
        { isSigner: false, isWritable: true, pubkey: '11111111111111111111111111111111' },
    ],
    data: '0xdeadbeef',
    programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
};

const meta: Meta<typeof JsonViewer> = {
    component: JsonViewer,
    tags: ['autodocs', 'test'],
    title: 'Components/Common/JsonViewer',
};

export default meta;
type Story = StoryObj<typeof meta>;

// text-dk-gray-700 is rendered in the dynamic-import loading state; usually only briefly visible.
export const Default: Story = {
    args: { collapsed: 1, name: null, src: sampleData },
};

export const Solarized: Story = {
    render: () => <SolarizedJsonViewer collapsed={1} name={null} src={sampleData} />,
};
