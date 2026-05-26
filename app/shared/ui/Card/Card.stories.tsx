// Story stub kept at title `Components/Shared/UI/Card` so existing visual-regression
// screenshots (keyed off the story id) keep matching during the dashkit migration.
// TODO: After dashkit removal, rename `title` to `Shared/UI/Card` to match the new FSD location
// at app/shared/ui/Card, and migrate these stories into BaseCard.stories.tsx.
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import {
    BaseCard as Card,
    BaseCardBody as CardContent,
    BaseCardDescription as CardDescription,
    BaseCardFooter as CardFooter,
    BaseCardHeader as CardHeader,
    BaseCardTitle as CardTitle,
} from './BaseCard';

type CardVariant = NonNullable<React.ComponentProps<typeof Card>['variant']>;

const variantOptions = ['default', 'narrow', 'tight'] as const satisfies readonly CardVariant[];

const meta: Meta<typeof Card> = {
    component: Card,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    title: 'Components/Shared/UI/Card',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        ui: 'tw',
        variant: 'default',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const card = canvas.getByText('Card Title').closest('div');
        expect(card).toBeInTheDocument();
    },
    render: args => (
        <Card {...args}>
            <CardTitle>Card Title</CardTitle>
            <CardContent>
                <p className="e-m-0">This is a simple card with some content. You can put any content inside it.</p>
            </CardContent>
        </Card>
    ),
};

export const AllVariants: Story = {
    render: () => {
        const variantDescriptions: Record<CardVariant, string> = {
            default: 'This card uses the default padding variant.',
            narrow: 'This card uses the narrow padding variant.',
            tight: 'This card uses the tight variant with no padding. Perfect for custom layouts.',
        };
        const variantLabels: Record<CardVariant, string> = {
            default: 'Default Variant',
            narrow: 'Narrow Variant',
            tight: 'Tight Variant (No Padding)',
        };

        return (
            <div className="e-flex e-w-full e-max-w-2xl e-flex-col e-gap-6">
                {variantOptions.map(variant => (
                    <div key={variant} className="e-flex e-flex-col e-gap-2">
                        <h3 className="e-text-sm e-font-semibold e-text-white">{variantLabels[variant]}</h3>
                        <Card ui="tw" variant={variant}>
                            {variant === 'tight' ? (
                                <>
                                    <h3 className="e-border e-border-neutral-800 e-bg-neutral-900 e-px-6 e-py-4 e-text-[10px] e-font-medium e-uppercase e-tracking-widest e-text-gray-400">
                                        No Padding
                                    </h3>
                                    <CardContent>
                                        <p>{variantDescriptions[variant]}</p>
                                    </CardContent>
                                </>
                            ) : (
                                <>
                                    <CardTitle>
                                        {variant === 'default' ? 'Default Padding' : 'Narrow Padding'}
                                    </CardTitle>
                                    <CardContent>
                                        <p>{variantDescriptions[variant]}</p>
                                    </CardContent>
                                </>
                            )}
                        </Card>
                    </div>
                ))}
            </div>
        );
    },
};

export const CompleteCard: Story = {
    args: {
        ui: 'tw',
        variant: 'default',
    },
    render: args => (
        <Card {...args} className="e-w-full e-max-w-md">
            <CardHeader>
                <CardTitle>Complete Card Example</CardTitle>
                <CardDescription>This card demonstrates all available sub-components working together.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="e-mb-4">
                    This is the main content area of the card. You can place any content here, including forms, lists,
                    images, or other components.
                </p>
                <ul className="e-list-inside e-list-disc e-space-y-2">
                    <li>CardHeader - Contains title and description</li>
                    <li>CardTitle - Main heading</li>
                    <li>CardDescription - Supporting text</li>
                    <li>CardContent - Main content area</li>
                    <li>CardFooter - Action area</li>
                </ul>
            </CardContent>
            <CardFooter>
                <button className="e-hover:e-bg-neutral-700 e-rounded e-bg-neutral-800 e-px-3 e-py-1 e-text-white">
                    Action Button
                </button>
            </CardFooter>
        </Card>
    ),
};
