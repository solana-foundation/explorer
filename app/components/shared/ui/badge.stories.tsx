import type { Meta, StoryObj } from '@storybook/react';
import type { VariantProps } from 'class-variance-authority';
import Link from 'next/link';
import { AlertTriangle, Check, Circle, Code, ExternalLink, type Icon, Info, Lock, Moon, X } from 'react-feather';
import { expect, within } from 'storybook/test';

import { Badge, badgeVariants } from './badge';

type BadgeSize = NonNullable<VariantProps<typeof badgeVariants>['size']>;
type BadgeAs = NonNullable<VariantProps<typeof badgeVariants>['as']>;
type BadgeStatus = NonNullable<VariantProps<typeof badgeVariants>['status']>;
type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;
type BadgeUi = NonNullable<VariantProps<typeof badgeVariants>['ui']>;
type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>;

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
const uiOptions = ['tw', 'dashkit'] as const satisfies readonly BadgeUi[];
const dashkitVariantOptions = [
    'success',
    'info',
    'warning',
    'danger',
    'destructive',
    'secondary',
    'gray',
    'dark',
] as const satisfies readonly BadgeVariant[];
const toneOptions = ['soft', 'solid'] as const satisfies readonly BadgeTone[];

const meta: Meta<typeof Badge> = {
    argTypes: {
        as: { control: 'select', options: asOptions },
        pill: { control: 'boolean' },
        size: { control: 'select', options: sizeOptions },
        status: { control: 'select', options: statusOptions },
        tone: { control: 'select', options: toneOptions },
        ui: { control: 'select', options: uiOptions },
        variant: { control: 'select', options: variantOptions },
    },
    component: Badge,
    // Uses the global default (Dark) — switch to Light via the Backgrounds toolbar (top-right)
    // when you need to inspect the badges against a non-app surface.
    tags: ['autodocs'],
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

const variantIcons: Record<BadgeVariant, { icon: Icon; label: string }> = {
    danger: { icon: X, label: 'Danger' },
    dark: { icon: Moon, label: 'Dark' },
    default: { icon: Code, label: 'Raw' },
    destructive: { icon: X, label: 'Error' },
    gray: { icon: Circle, label: 'Gray' },
    info: { icon: Info, label: 'Info' },
    secondary: { icon: Lock, label: 'Secondary' },
    success: { icon: Check, label: 'Success' },
    transparent: { icon: Code, label: 'Transparent' },
    warning: { icon: AlertTriangle, label: 'Warning' },
};

export const WithIcon: Story = {
    render: () => (
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
    ),
};

// Dashkit migration shim — emits the legacy Bootstrap `.badge` + `.bg-*-soft`/`.bg-*` classes.
// Stays until consumers migrate to the OKLCH-flavored ui="tw" surface.
export const DashkitVariantsSoft: Story = {
    name: 'Dashkit / Soft variants',
    render: () => (
        <div className="e-flex e-flex-wrap e-gap-4">
            {dashkitVariantOptions.map(variant => (
                <Badge key={variant} ui="dashkit" variant={variant}>
                    {variant}
                </Badge>
            ))}
        </div>
    ),
};

export const DashkitVariantsSolid: Story = {
    name: 'Dashkit / Solid variants',
    render: () => (
        <div className="e-flex e-flex-wrap e-gap-4">
            {dashkitVariantOptions.map(variant => (
                <Badge key={variant} ui="dashkit" tone="solid" variant={variant}>
                    {variant}
                </Badge>
            ))}
        </div>
    ),
};

export const DashkitWithIcon: Story = {
    name: 'Dashkit / With icon',
    render: () => (
        <div className="e-flex e-flex-wrap e-gap-4">
            {dashkitVariantOptions.map(variant => {
                const { icon: Icon, label } = variantIcons[variant];
                return (
                    <Badge key={variant} ui="dashkit" variant={variant}>
                        <Icon size={12} />
                        {label}
                    </Badge>
                );
            })}
        </div>
    ),
};

export const DashkitOnDark: Story = {
    globals: { backgrounds: { value: 'dark' } },
    name: 'Dashkit / On dark background',
    render: () => (
        <div className="e-flex e-flex-col e-gap-4">
            <div className="e-flex e-flex-wrap e-gap-4">
                {dashkitVariantOptions.map(variant => (
                    <Badge key={variant} ui="dashkit" variant={variant}>
                        {variant}
                    </Badge>
                ))}
            </div>
            <div className="e-flex e-flex-wrap e-gap-4">
                {dashkitVariantOptions.map(variant => (
                    <Badge key={variant} ui="dashkit" tone="solid" variant={variant}>
                        {variant}
                    </Badge>
                ))}
            </div>
        </div>
    ),
};

export const DashkitAsLink: Story = {
    name: 'Dashkit / As link',
    render: () => (
        <div className="e-flex e-flex-wrap e-gap-4">
            <Badge ui="dashkit" variant="success" asChild>
                <Link href="#">Verified</Link>
            </Badge>
            <Badge ui="dashkit" variant="warning" asChild>
                <Link href="#">Pending</Link>
            </Badge>
            <Badge ui="dashkit" variant="danger" asChild>
                <Link href="#">Failed</Link>
            </Badge>
        </div>
    ),
};

// In production, dashkit badges inside table cells inherit a smaller font (~10px) via
// `.badge { font-size: 0.75em }` chained off the parent `<td>`. `size="sm"` on a `ui="dashkit"`
// Badge emits `e-text-dk-xs` (10px) so the compact look is reproducible standalone.
export const DashkitTableSize: Story = {
    name: 'Dashkit / Table size (compact)',
    render: () => (
        <div className="e-flex e-flex-col e-gap-4">
            <div>
                <div className="e-mb-2 e-text-xs e-text-neutral-500">
                    default — inherits from parent (here body 16px)
                </div>
                <div className="e-flex e-flex-wrap e-gap-3">
                    {dashkitVariantOptions.map(variant => (
                        <Badge key={variant} ui="dashkit" variant={variant}>
                            {variant}
                        </Badge>
                    ))}
                </div>
            </div>
            <div>
                <div className="e-mb-2 e-text-xs e-text-neutral-500">
                    size=&quot;sm&quot; — table-cell appearance (10px)
                </div>
                <div className="e-flex e-flex-wrap e-gap-3">
                    {dashkitVariantOptions.map(variant => (
                        <Badge key={variant} ui="dashkit" size="sm" variant={variant}>
                            {variant}
                        </Badge>
                    ))}
                </div>
            </div>
            <div>
                <div className="e-mb-2 e-text-xs e-text-neutral-500">
                    inside a mock `&lt;td&gt;` (font: 13px) — natural inheritance, ≈10px badge
                </div>
                <table style={{ fontSize: '13px' }}>
                    <tbody>
                        <tr>
                            <td>
                                <Badge ui="dashkit" variant="warning">
                                    Failed
                                </Badge>
                            </td>
                            <td>
                                <Badge ui="dashkit" variant="success">
                                    Success
                                </Badge>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    ),
};
