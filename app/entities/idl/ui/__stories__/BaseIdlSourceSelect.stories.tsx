import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, fn, userEvent, within } from 'storybook/test';

import { IdlVariant } from '../../model/idl-variant';
import { BaseIdlSourceSelect } from '../BaseIdlSourceSelect';

const meta = {
    args: {
        customIdlName: 'amm_v3.json',
        onChainSource: IdlVariant.ProgramMetadata,
        onRemove: fn(),
        onReplace: fn(),
        onSelect: fn(),
    },
    component: BaseIdlSourceSelect,
    tags: ['autodocs', 'test'],
    title: 'Entities/IDL/BaseIdlSourceSelect',
} satisfies Meta<typeof BaseIdlSourceSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CustomSelected: Story = {
    args: { selected: 'custom' },
};

export const OnChainSelected: Story = {
    args: { selected: 'onChain' },
};

export const NoIdlOnCluster: Story = {
    args: { onChainSource: undefined, selected: 'onChain' },
};

export const OnChainIdlsLoading: Story = {
    args: { isOnChainLoading: true, onChainSource: undefined, selected: 'onChain' },
};

export const SelectsTheOnChainIdl: Story = {
    args: { selected: 'custom' },
    play: async ({ args, canvasElement }) => {
        await userEvent.click(within(canvasElement).getByRole('button', { name: 'IDL: Custom' }));
        const menu = within(document.body);
        await expect(menu.getByText('amm_v3.json')).toBeInTheDocument();
        await userEvent.click(menu.getByRole('menuitemradio', { name: 'On-chain PMP' }));
        await expect(args.onSelect).toHaveBeenCalledWith('onChain');
    },
};
