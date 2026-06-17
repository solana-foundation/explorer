import type { Meta, StoryObj } from '@storybook/react';
import type { VariantProps } from 'class-variance-authority';
import { useState } from 'react';
import { ArrowRight, Check, ChevronDown, Download, ExternalLink, RefreshCw, X } from 'react-feather';
import { expect, within } from 'storybook/test';

import { Button, buttonVariants } from './button';

type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>['size']>;
type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>;

// TW-only variants (the modern OKLCH look). Dashkit-mode variants are listed separately below.
const twVariantOptions = [
    'default',
    'accent',
    'compact',
    'destructive',
    'ghost',
    'link',
    'outline',
    'secondary',
] as const satisfies readonly ButtonVariant[];

type TwVariant = (typeof twVariantOptions)[number];

const sizeOptions = ['default', 'sm', 'lg', 'icon', 'compact'] as const satisfies readonly ButtonSize[];

// Dashkit migration shim — emits raw Bootstrap `.btn` + `.btn-<variant>` classes via `ui="dashkit"`.
// Stays until consumers migrate to the OKLCH-flavored `ui="tw"` surface.
const dashkitVariantOptions = [
    'primary',
    'secondary',
    'white',
    'black',
    'dark',
    'outline-primary',
    'outline-danger',
    'outline-warning',
] as const satisfies readonly ButtonVariant[];

const dashkitSizeOptions = ['default', 'sm', 'lg'] as const satisfies readonly ButtonSize[];

const twVariantIcons: Record<TwVariant, typeof Check | typeof X | typeof Download | typeof ArrowRight> = {
    accent: Check,
    compact: Check,
    default: Check,
    destructive: X,
    ghost: ArrowRight,
    link: ArrowRight,
    outline: Download,
    secondary: Check,
};

const meta: Meta<typeof Button> = {
    argTypes: {
        active: { control: 'boolean' },
        asChild: { control: 'boolean' },
        disabled: { control: 'boolean' },
        size: { control: 'select', options: sizeOptions },
        ui: { control: 'select', options: ['tw', 'dashkit'] },
        variant: { control: 'select', options: [...twVariantOptions, ...dashkitVariantOptions] },
    },
    component: Button,
    tags: ['autodocs', 'test'],
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
            {twVariantOptions.map(variant => (
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
            TwVariant,
            {
                icon: typeof Check | typeof X | typeof Download | typeof ArrowRight;
                label: string;
                position?: 'left' | 'right';
            }
        > = {
            accent: { icon: Check, label: 'Success' },
            compact: { icon: Check, label: 'Compact' },
            default: { icon: Check, label: 'Success' },
            destructive: { icon: X, label: 'Delete' },
            ghost: { icon: ArrowRight, label: 'Continue', position: 'right' },
            link: { icon: ArrowRight, label: 'Continue', position: 'right' },
            outline: { icon: Download, label: 'Download', position: 'right' },
            secondary: { icon: Check, label: 'Success' },
        };

        return (
            <div className="e-flex e-flex-wrap e-gap-4">
                {twVariantOptions.map(variant => {
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
            {twVariantOptions.map(variant => (
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
            {twVariantOptions.map(variant => {
                const Icon = twVariantIcons[variant];
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
            compact: 'Compact',
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
                            {twVariantOptions.map(variant => {
                                const Icon = twVariantIcons[variant];
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

// ===== Dashkit migration shim showcases =====

export const DashkitVariants: Story = {
    name: 'Dashkit / Variants',
    render: () => (
        <div className="e-flex e-flex-wrap e-gap-4">
            {dashkitVariantOptions.map(variant => (
                <Button key={variant} ui="dashkit" variant={variant}>
                    {variant}
                </Button>
            ))}
        </div>
    ),
};

export const DashkitVariantsSm: Story = {
    name: 'Dashkit / Variants (size=sm)',
    render: () => (
        <div className="e-flex e-flex-wrap e-gap-4">
            {dashkitVariantOptions.map(variant => (
                <Button key={variant} ui="dashkit" variant={variant} size="sm">
                    {variant}
                </Button>
            ))}
        </div>
    ),
};

export const DashkitVariantsBySize: Story = {
    name: 'Dashkit / Variants by size',
    render: () => (
        <div className="e-flex e-flex-col e-gap-6">
            {dashkitSizeOptions.map(size => (
                <div key={size} className="e-flex e-flex-col e-gap-2">
                    <h3 className="e-text-sm e-font-semibold">size=&quot;{size}&quot;</h3>
                    <div className="e-flex e-flex-wrap e-gap-4">
                        {dashkitVariantOptions.map(variant => (
                            <Button key={variant} ui="dashkit" variant={variant} size={size}>
                                {variant}
                            </Button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    ),
};

export const DashkitWithIcons: Story = {
    name: 'Dashkit / With icons',
    render: () => (
        <div className="e-flex e-flex-wrap e-gap-4">
            <Button ui="dashkit" variant="primary" size="sm">
                <Check size={13} className="e-mr-1.5" /> Save
            </Button>
            <Button ui="dashkit" variant="white" size="sm">
                <RefreshCw size={13} className="e-mr-1.5 e-align-text-top" /> Refresh
            </Button>
            <Button ui="dashkit" variant="outline-primary" size="sm">
                <Download size={13} className="e-mr-1.5" /> Download
            </Button>
            <Button ui="dashkit" variant="outline-danger" size="sm">
                <X size={13} className="e-mr-1.5" /> Remove
            </Button>
            <Button ui="dashkit" variant="dark" size="sm">
                Creators <ChevronDown size={15} className="e-align-text-top" />
            </Button>
        </div>
    ),
};

// Mirrors the legacy `btn-group-toggle` pattern used for view-mode toggles in card headers
// (e.g. ProgramLogSection / ProgramEventsCard "Raw"). `active` toggles the pressed state on `btn-black`.
function DashkitToggleDemo() {
    const [showRaw, setShowRaw] = useState(false);
    return (
        <Button
            ui="dashkit"
            size="sm"
            variant={showRaw ? 'black' : 'white'}
            active={showRaw}
            className="e-flex e-items-center"
            onClick={() => setShowRaw(r => !r)}
        >
            <ExternalLink size={13} className="e-mr-1.5" /> Raw {showRaw ? '(on)' : '(off)'}
        </Button>
    );
}

export const DashkitToggleGroup: Story = {
    name: 'Dashkit / Toggle (btn-black active)',
    render: () => <DashkitToggleDemo />,
};

export const DashkitAsLink: Story = {
    name: 'Dashkit / As link',
    render: () => (
        <div className="e-flex e-flex-wrap e-gap-4">
            <Button ui="dashkit" variant="outline-primary" size="sm" asChild>
                <a href="https://example.com" target="_blank" rel="noopener noreferrer">
                    Full documentation
                    <ExternalLink className="e-ml-1.5 e-align-text-top" size={13} />
                </a>
            </Button>
            <Button ui="dashkit" variant="white" size="sm" asChild>
                <a href="https://example.com" target="_blank" rel="noopener noreferrer">
                    Plain link
                </a>
            </Button>
        </div>
    ),
};

export const DashkitDisabled: Story = {
    name: 'Dashkit / Disabled',
    render: () => (
        <div className="e-flex e-flex-wrap e-gap-4">
            {dashkitVariantOptions.map(variant => (
                <Button key={variant} ui="dashkit" variant={variant} disabled>
                    Disabled {variant}
                </Button>
            ))}
        </div>
    ),
};

// Solid warning/danger exist in the cva but not in dashkitVariantOptions, so no other story renders them
export const DashkitSolidWarningDanger: Story = {
    name: 'Dashkit / Variants (solid warning, danger)',
    render: () => (
        <div className="e-flex e-flex-wrap e-gap-4">
            {(['warning', 'danger'] as const satisfies readonly ButtonVariant[]).map(variant => (
                <Button key={variant} ui="dashkit" variant={variant}>
                    {variant}
                </Button>
            ))}
        </div>
    ),
};
