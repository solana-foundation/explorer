import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BaseIdlPdas } from '../BaseIdlPdas';

const meta: Meta<typeof BaseIdlPdas> = {
    component: BaseIdlPdas,
    decorators: [withViewportFromGlobal],
    parameters: {
        nextjs: { appDirectory: true },
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Features/IDL/Formatted IDL/BaseIdlPdas@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
    data: [
        {
            docs: ['This PDA has defined seeds.'],
            name: 'SeededPDA',
            seeds: [
                {
                    docs: ['Seed for the PDA'],
                    kind: 'type' as const,
                    name: 'seed1',
                    type: 'bytes',
                },
            ],
        },
    ],
};

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
