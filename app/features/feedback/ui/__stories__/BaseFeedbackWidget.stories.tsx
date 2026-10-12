import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, fn, userEvent, within } from 'storybook/test';

import { BaseFeedbackWidget } from '../BaseFeedbackWidget';

const meta = {
    args: {
        bugReportUrl: 'https://github.com/solana-foundation/explorer/issues/new?template=bug_report.yml',
        ideasUrl: 'https://github.com/solana-foundation/explorer/issues/new?template=feature_request.yml',
        onShareFeedback: fn(),
    },
    component: BaseFeedbackWidget,
    parameters: {
        // The widget has `position: fixed`, so an inline docs story positions it against the docs page.
        docs: { story: { height: '260px', inline: false } },
    },
    tags: ['autodocs', 'test'],
    title: 'Features/Feedback/BaseFeedbackWidget',
} satisfies Meta<typeof BaseFeedbackWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement, args }) => {
        // The menu renders in a portal outside the story canvas.
        const body = within(canvasElement.ownerDocument.body);

        await userEvent.click(body.getByRole('button', { name: 'Feedback' }));
        // The enter animation keeps opacity at 0 in headless runs, so toBeVisible fails.
        await expect(await body.findByText('Share feedback')).toBeInTheDocument();
        await expect(body.getByRole('menuitem', { name: 'Suggest an idea' })).toHaveAttribute('href', args.ideasUrl);
        await expect(body.getByRole('menuitem', { name: 'Report a bug' })).toHaveAttribute('href', args.bugReportUrl);

        await userEvent.click(body.getByText('Share feedback'));
        await expect(args.onShareFeedback).toHaveBeenCalledOnce();
    },
};

export const WithoutSentryActions: Story = {
    args: {
        showSentryActions: false,
    },
    play: async ({ canvasElement }) => {
        const body = within(canvasElement.ownerDocument.body);

        await userEvent.click(body.getByRole('button', { name: 'Feedback' }));
        await expect(await body.findByText('Suggest an idea')).toBeInTheDocument();
        await expect(body.getByText('Report a bug')).toBeInTheDocument();
        await expect(body.queryByText('Share feedback')).not.toBeInTheDocument();
    },
};
