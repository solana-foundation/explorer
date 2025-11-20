import type { Meta, StoryObj } from '@storybook/react';
import type { VariantProps } from 'class-variance-authority';
import { ArrowRight, Check, Download, X } from 'react-feather';
import { expect, within } from 'storybook/test';

import { Button, buttonVariants } from './button';

type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>['size']>;
type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>;

const sizeOptions = ['default', 'sm', 'lg', 'icon'] as const satisfies readonly ButtonSize[];
const variantOptions = [
    'default',
    'accent',
    'destructive',
    'ghost',
    'link',
    'outline',
    'secondary',
] as const satisfies readonly ButtonVariant[];

const variantIcons: Record<ButtonVariant, typeof Check | typeof X | typeof Download | typeof ArrowRight> = {
    accent: Check,
    default: Check,
    destructive: X,
    ghost: ArrowRight,
    link: ArrowRight,
    outline: Download,
    secondary: Check,
};

const meta: Meta<typeof Button> = {
    argTypes: {
        asChild: {
            control: 'boolean',
        },
        disabled: {
            control: 'boolean',
        },
        size: {
            control: 'select',
            options: sizeOptions,
        },
        variant: {
            control: 'select',
            options: variantOptions,
        },
    },
    component: Button,
    parameters: {
        layout: 'centered',
    },
    title: 'Components/Shared/UI/Button',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        children: 'Button',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const button = canvas.getByRole('button', { name: 'Button' });
        expect(button).toBeInTheDocument();
    },
};

export const AllVariants: Story = {
    render: () => (
        <div className="e-flex e-flex-wrap e-gap-4">
            {variantOptions.map(variant => (
                <Button key={variant} variant={variant}>
                    {variant}
                </Button>
            ))}
        </div>
    ),
};

export const AllSizes: Story = {
    render: () => (
        <div className="e-flex e-items-center e-gap-4">
            {sizeOptions.map(size => (
                <Button key={size} size={size}>
                    {size === 'icon' ? <Check /> : `Size ${size}`}
                </Button>
            ))}
        </div>
    ),
};

export const WithIcons: Story = {
    render: () => {
        const variantIcons: Record<
            ButtonVariant,
            {
                icon: typeof Check | typeof X | typeof Download | typeof ArrowRight;
                label: string;
                position?: 'left' | 'right';
            }
        > = {
            accent: { icon: Check, label: 'Success' },
            default: { icon: Check, label: 'Success' },
            destructive: { icon: X, label: 'Delete' },
            ghost: { icon: ArrowRight, label: 'Continue', position: 'right' },
            link: { icon: ArrowRight, label: 'Continue', position: 'right' },
            outline: { icon: Download, label: 'Download', position: 'right' },
            secondary: { icon: Check, label: 'Success' },
        };

        return (
            <div className="e-flex e-flex-wrap e-gap-4">
                {variantOptions.map(variant => {
                    const { icon: Icon, label, position = 'left' } = variantIcons[variant];
                    return (
                        <Button key={variant} variant={variant}>
                            {position === 'left' && <Icon />}
                            {label}
                            {position === 'right' && <Icon />}
                        </Button>
                    );
                })}
            </div>
        );
    },
};

export const Disabled: Story = {
    render: () => (
        <div className="e-flex e-flex-wrap e-gap-4">
            {variantOptions.map(variant => (
                <Button key={variant} variant={variant} disabled>
                    Disabled {variant}
                </Button>
            ))}
        </div>
    ),
};

export const IconOnly: Story = {
    render: () => (
        <div className="e-flex e-flex-wrap e-gap-4">
            {variantOptions.map(variant => {
                const Icon = variantIcons[variant];
                return (
                    <Button key={variant} size="icon" variant={variant}>
                        <Icon />
                    </Button>
                );
            })}
        </div>
    ),
};

export const VariantsBySize: Story = {
    render: () => {
        const sizeLabels: Record<ButtonSize, string> = {
            default: 'Default',
            icon: 'Icon',
            lg: 'Large',
            sm: 'Small',
        };

        return (
            <div className="e-flex e-flex-col e-gap-6">
                {sizeOptions.map(size => (
                    <div key={size} className="e-flex e-flex-col e-gap-2">
                        <h3 className="e-text-sm e-font-semibold">{sizeLabels[size]}</h3>
                        <div className="e-flex e-flex-wrap e-gap-4">
                            {variantOptions.map(variant => {
                                const Icon = variantIcons[variant];
                                return (
                                    <Button key={variant} size={size} variant={variant}>
                                        {size === 'icon' ? <Icon /> : variant}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        );
    },
};

export const Interactive: Story = {
    args: {
        children: 'Click me',
        onClick: () => alert('Button clicked!'),
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const button = canvas.getByRole('button', { name: 'Click me' });
        expect(button).toBeInTheDocument();
    },
};
