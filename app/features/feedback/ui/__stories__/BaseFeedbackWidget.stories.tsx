import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, fn, userEvent, within } from 'storybook/test';

import { BaseFeedbackWidget } from '../BaseFeedbackWidget';

const meta = {
    args: {
        onClick: fn(),
    },
    component: BaseFeedbackWidget,
    tags: ['autodocs', 'test'],
    title: 'Features/Feedback/BaseFeedbackWidget',
} satisfies Meta<typeof BaseFeedbackWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement, args }) => {
        await userEvent.click(within(canvasElement).getByRole('button', { name: 'Feedback' }));
        await expect(args.onClick).toHaveBeenCalledOnce();
    },
};
