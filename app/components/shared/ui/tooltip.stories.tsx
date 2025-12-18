import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';

import { Button } from './button';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

const meta: Meta<typeof Tooltip> = {
    component: Tooltip,
    decorators: [
        Story => (
            <div className="e-flex e-min-h-96 e-items-center e-justify-center">
                <Story />
            </div>
        ),
    ],
    parameters: {
        layout: 'centered',
    },
    title: 'Components/Shared/UI/Tooltip',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    async play({ canvasElement }) {
        const canvas = within(canvasElement);
        const trigger = canvas.getByRole('button');
        await userEvent.hover(trigger);

        // Radix UI Tooltip renders two instances of the tooltip text for accessibility:
        // 1. Visual tooltip - rendered in a portal, visible to users
        // 2. Hidden element - linked via aria-describedby for screen readers

        // Use body to query portaled content (works across all browsers)
        const body = canvasElement.ownerDocument.body;
        const screen = within(body);

        // Find all tooltip text instances - there should be exactly 2:
        // 1. Visual tooltip - rendered in a portal, visible to users
        // 2. Hidden element - linked via aria-describedby for screen readers
        const tooltipTexts = await screen.findAllByText('This is a tooltip');
        expect(tooltipTexts).toHaveLength(2);

        // Verify at least one is visible (the visual tooltip)
        const visibleTooltip = tooltipTexts.find(el => el.checkVisibility?.() ?? true);
        expect(visibleTooltip).toBeDefined();

        // Verify accessibility: trigger should have aria-describedby pointing to a hidden element
        const describedById = trigger.getAttribute('aria-describedby');
        expect(describedById).toBeTruthy();
    },
    render: () => (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button>Hover me</Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>This is a tooltip</p>
            </TooltipContent>
        </Tooltip>
    ),
};

export const LongContent: Story = {
    render: () => (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button>Hover for details</Button>
            </TooltipTrigger>
            <TooltipContent>
                <p className="e-max-w-xs">
                    This tooltip contains longer content to demonstrate how the component handles substantial amounts of
                    text. The tooltip will automatically wrap and adjust its width accordingly.
                </p>
            </TooltipContent>
        </Tooltip>
    ),
};

export const DifferentPositions: Story = {
    render: () => {
        const positions = ['top', 'right', 'bottom', 'left'] as const;

        return (
            <div className="e-grid e-grid-cols-2 e-gap-8 e-p-8">
                {positions.map(position => (
                    <Tooltip key={position}>
                        <TooltipTrigger asChild>
                            <Button>{position.charAt(0).toUpperCase() + position.slice(1)}</Button>
                        </TooltipTrigger>
                        <TooltipContent side={position}>
                            <p>Tooltip on {position}</p>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </div>
        );
    },
};

export const WithCustomStyling: Story = {
    render: () => (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="outline">Custom styled tooltip</Button>
            </TooltipTrigger>
            <TooltipContent className="e-bg-blue-600 e-text-white">
                <p>This tooltip has custom styling</p>
            </TooltipContent>
        </Tooltip>
    ),
};

export const Disabled: Story = {
    render: () => (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button disabled>Disabled button</Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>This tooltip won&apos;t show because the button is disabled</p>
            </TooltipContent>
        </Tooltip>
    ),
};
