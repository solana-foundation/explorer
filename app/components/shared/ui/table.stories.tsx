import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';

import { Card } from '@/app/shared/ui/Card';

import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from './table';

const meta: Meta<typeof Table> = {
    component: Table,
    tags: ['autodocs', 'test'],
    title: 'Components/Shared/Table',
};

export default meta;
type Story = StoryObj<typeof meta>;

const ROWS = [
    { activation: 235, key: '7bTK6Jis8Xpfrs8ZoUfiMDPazTcdPcTWheZFJTA5Z6X4', name: 'Curve25519 Restore' },
    { activation: 240, key: '5b9zKKqd8nKQfbtKZxYsFmFFShVN3Yc7gKW9bQbXq9rE', name: 'Disable Rent Fees' },
    { activation: 244, key: '9Vc4N7Wh7iz4eAaT41ARSscLg2v8gPzNDDekuJ8Lmcyk', name: 'Stake Raise Minimum Delegation' },
];

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Curve25519 Restore')).toBeInTheDocument();
    },
    render: () => (
        <Card variant="tight" className="w-[40rem] overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Feature</TableHead>
                        <TableHead>Activation</TableHead>
                        <TableHead>Key</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {ROWS.map(row => (
                        <TableRow key={row.key}>
                            <TableCell className="font-medium">{row.name}</TableCell>
                            <TableCell>{row.activation}</TableCell>
                            <TableCell className="font-mono text-dk-xs">{row.key.slice(0, 8)}…</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    ),
};

export const WithSelectedRow: Story = {
    render: () => (
        <Card variant="tight" className="w-[40rem] overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Feature</TableHead>
                        <TableHead>Activation</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {ROWS.map((row, idx) => (
                        <TableRow key={row.key} data-state={idx === 1 ? 'selected' : undefined}>
                            <TableCell className="font-medium">{row.name}</TableCell>
                            <TableCell>{row.activation}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    ),
};

export const WithFooterAndCaption: Story = {
    render: () => (
        <Card variant="tight" className="w-[40rem] overflow-hidden">
            <Table>
                <TableCaption>Recently activated feature gates on mainnet.</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Feature</TableHead>
                        <TableHead>Activation</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {ROWS.map(row => (
                        <TableRow key={row.key}>
                            <TableCell className="font-medium">{row.name}</TableCell>
                            <TableCell>{row.activation}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell>Total</TableCell>
                        <TableCell>{ROWS.length} features</TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </Card>
    ),
};
