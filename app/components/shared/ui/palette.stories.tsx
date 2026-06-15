import type { Meta, StoryObj } from '@storybook/react';
import React, { useEffect, useState } from 'react';

import config, { dkColors } from '@/tailwind.config';

// The :root custom properties from app/styles.css. --tw-* internals are deliberately excluded.
const CSS_VAR_TOKENS = ['--accent', '--card-border', '--popover', '--popover-foreground', '--border'] as const;

type ColorScale = Record<string, string>;
type ThemeExtend = {
    colors: Record<string, string | ColorScale>;
    boxShadow: Record<string, string>;
    borderRadius: Record<string, string>;
    fontSize: Record<string, string>;
    spacing: Record<string, string>;
};
// tailwind.config keeps these inline under theme.extend; read them straight off the config object
// so this story stays in sync with the single source of truth.
const extend = config.theme?.extend as unknown as ThemeExtend;

const BOX = { borderRadius: '0.375rem', flexShrink: 0, height: '3rem', width: '3rem' } as const;

function TokenRow({ preview, label, value }: { preview: React.ReactNode; label: string; value: string }) {
    return (
        <div className="e-flex e-items-center e-gap-3">
            {preview}
            <div className="e-flex e-flex-col e-gap-0.5" style={{ minWidth: 0 }}>
                <code className="e-text-dk-sm e-text-dk-white">{label}</code>
                <span className="e-text-dk-xs e-text-dk-gray-600" style={{ overflowWrap: 'anywhere' }}>
                    {value || '—'}
                </span>
            </div>
        </div>
    );
}

function ColorBox({ color }: { color: string }) {
    return <div aria-hidden style={{ ...BOX, background: color, border: '1px solid #282d2b' }} />;
}

function Grid({ children }: { children: React.ReactNode }) {
    return <div className="e-grid e-grid-cols-1 e-gap-4 sm:e-grid-cols-2 lg:e-grid-cols-3">{children}</div>;
}

function flattenColors(colors: Record<string, string | ColorScale>): { label: string; color: string }[] {
    return Object.entries(colors).flatMap(([name, value]) =>
        typeof value === 'string'
            ? [{ color: value, label: name }]
            : Object.entries(value).map(([shade, color]) => ({
                  color,
                  label: shade === 'DEFAULT' ? name : `${name}-${shade}`,
              })),
    );
}

// Swatch fill is driven by `var(--token)` so it reflects the live CSS variable; the label
// shows the value resolved off :root at runtime.
function CssVariablesPalette() {
    const [values, setValues] = useState<Record<string, string>>({});
    useEffect(() => {
        const root = getComputedStyle(document.documentElement);
        setValues(Object.fromEntries(CSS_VAR_TOKENS.map(t => [t, root.getPropertyValue(t).trim()])));
    }, []);
    return (
        <Grid>
            {CSS_VAR_TOKENS.map(token => (
                <TokenRow key={token} preview={<ColorBox color={`var(${token})`} />} label={token} value={values[token] ?? ''} />
            ))}
        </Grid>
    );
}

const meta: Meta = {
    tags: ['autodocs', 'test'],
    title: 'Design System/Palette',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const CssVariables: Story = {
    render: () => <CssVariablesPalette />,
};

export const DashkitColors: Story = {
    name: 'Colors / dk-* tokens',
    render: () => (
        <Grid>
            {Object.entries(dkColors).map(([name, value]) => (
                <TokenRow key={name} preview={<ColorBox color={value} />} label={`dk-${name}`} value={value} />
            ))}
        </Grid>
    ),
};

export const ThemeColors: Story = {
    name: 'Colors / theme (OKLCH)',
    render: () => (
        <Grid>
            {flattenColors(Object.fromEntries(Object.entries(extend.colors).filter(([k]) => k !== 'dk'))).map(
                ({ label, color }) => (
                    <TokenRow key={label} preview={<ColorBox color={color} />} label={label} value={color} />
                ),
            )}
        </Grid>
    ),
};

export const BorderRadii: Story = {
    name: 'Styles / border radius',
    render: () => (
        <Grid>
            {Object.entries(extend.borderRadius).map(([name, value]) => (
                <TokenRow
                    key={name}
                    preview={
                        <div aria-hidden style={{ ...BOX, background: '#1e2423', border: '1px solid #282d2b', borderRadius: value }} />
                    }
                    label={name}
                    value={value}
                />
            ))}
        </Grid>
    ),
};

export const Shadows: Story = {
    name: 'Styles / box shadow',
    render: () => (
        <Grid>
            {Object.entries(extend.boxShadow).map(([name, value]) => (
                <TokenRow
                    key={name}
                    preview={<div aria-hidden style={{ ...BOX, background: '#1e2423', boxShadow: value }} />}
                    label={name}
                    value={value}
                />
            ))}
        </Grid>
    ),
};

export const FontSizes: Story = {
    name: 'Styles / font size',
    render: () => (
        <Grid>
            {Object.entries(extend.fontSize).map(([name, value]) => (
                <TokenRow
                    key={name}
                    preview={
                        <div style={{ color: '#fff', flexShrink: 0, fontSize: value, lineHeight: 1, width: '3rem' }}>Aa</div>
                    }
                    label={name}
                    value={value}
                />
            ))}
        </Grid>
    ),
};

export const Spacing: Story = {
    name: 'Styles / spacing',
    render: () => (
        <div className="e-flex e-flex-col e-gap-3">
            {Object.entries(extend.spacing).map(([name, value]) => (
                <TokenRow
                    key={name}
                    preview={<div aria-hidden style={{ background: '#13d89b', borderRadius: '2px', flexShrink: 0, height: '1rem', width: value }} />}
                    label={name}
                    value={value}
                />
            ))}
        </div>
    ),
};
