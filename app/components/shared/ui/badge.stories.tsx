import type { Meta, StoryObj } from '@storybook/react';
import type { VariantProps } from 'class-variance-authority';
import Link from 'next/link';
import { AlertTriangle, Check, Code, ExternalLink, type Icon, Info, X } from 'react-feather';
import { expect, within } from 'storybook/test';

import { Badge, badgeVariants } from './badge';

type BadgeSize = NonNullable<VariantProps<typeof badgeVariants>['size']>;
type BadgeAs = NonNullable<VariantProps<typeof badgeVariants>['as']>;
type BadgeStatus = NonNullable<VariantProps<typeof badgeVariants>['status']>;
type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

const sizeOptions = ['xs', 'sm', 'md', 'lg'] as const satisfies readonly BadgeSize[];
const asOptions = ['badge', 'link'] as const satisfies readonly BadgeAs[];
const statusOptions = ['active', 'inactive'] as const satisfies readonly BadgeStatus[];
const variantOptions = [
    'default',
    'destructive',
    'info',
    'secondary',
    'success',
    'transparent',
    'warning',
] as const satisfies readonly BadgeVariant[];

const meta: Meta<typeof Badge> = {
    argTypes: {
        as: {
            control: 'select',
            options: asOptions,
        },
        size: {
            control: 'select',
            options: sizeOptions,
        },
        status: {
            control: 'select',
            options: statusOptions,
        },
        variant: {
            control: 'select',
            options: variantOptions,
        },
    },
    component: Badge,
    parameters: {
        layout: 'centered',
    },
    title: 'Components/Shared/UI/Badge',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        children: 'Badge',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const badge = canvas.getByText('Badge');
        expect(badge).toBeInTheDocument();
    },
};

export const AllVariants: Story = {
    render: () => (
        <div className="e-flex e-flex-wrap e-gap-4">
            {variantOptions.map(variant => (
                <Badge key={variant} variant={variant}>
                    {variant}
                </Badge>
            ))}
        </div>
    ),
};

export const AllSizes: Story = {
    render: () => (
        <div className="e-flex e-items-center e-gap-4">
            {sizeOptions.map(size => (
                <Badge key={size} size={size}>
                    Size {size}
                </Badge>
            ))}
        </div>
    ),
};

export const StatusVariants: Story = {
    render: () => (
        <div className="e-flex e-gap-4">
            {statusOptions.map(status => (
                <Badge key={status} status={status}>
                    {status}
                </Badge>
            ))}
        </div>
    ),
};

export const AsLink: Story = {
    render: () => (
        <div className="e-flex e-flex-col e-gap-4">
            {(['default', 'transparent'] as const satisfies readonly BadgeVariant[]).map(variant => (
                <div key={variant} className="e-flex e-items-center e-gap-4">
                    {sizeOptions.map(size => (
                        <Badge key={size} as="link" size={size} variant={variant}>
                            <Link href="#" target="_blank" rel="noopener noreferrer">
                                <ExternalLink size={16} /> {variant} {size}
                            </Link>
                        </Badge>
                    ))}
                </div>
            ))}
        </div>
    ),
};

export const WithIcon: Story = {
    render: () => {
        const variantIcons: Record<BadgeVariant, { icon: Icon; label: string }> = {
            default: { icon: Code, label: 'Raw' },
            destructive: { icon: X, label: 'Error' },
            info: { icon: Info, label: 'Info' },
            secondary: { icon: Code, label: 'Secondary' },
            success: { icon: Check, label: 'Success' },
            transparent: { icon: Code, label: 'Transparent' },
            warning: { icon: AlertTriangle, label: 'Warning' },
        };

        return (
            <div className="e-flex e-flex-wrap e-gap-4">
                {variantOptions.map(variant => {
                    const { icon: Icon, label } = variantIcons[variant];
                    return (
                        <Badge key={variant} variant={variant}>
                            <Icon size={16} />
                            {label}
                        </Badge>
                    );
                })}
            </div>
        );
    },
};
