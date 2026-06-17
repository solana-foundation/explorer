import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import React, { useEffect, useState } from 'react';

import config, { dkColors } from '@/tailwind.config';

// The :root custom properties from app/styles/styles.css. --tw-* internals are deliberately excluded.
const CSS_VAR_TOKENS = [
    '--background',
    '--foreground',
    '--accent',
    '--card-border',
    '--popover',
    '--popover-foreground',
    '--border',
] as const;

// next/font (Rubik) is exposed app-wide through this variable; see app/styles/index.ts.
const FONT_VAR = '--explorer-default-font';
// Only these weights are loaded by next/font (app/styles/index.ts) — others would render synthetic.
const FONT_WEIGHTS = [
    { label: 'Light', weight: 300 },
    { label: 'Regular', weight: 400 },
    { label: 'Bold', weight: 700 },
] as const;

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
        <div className="flex items-center gap-3">
            {preview}
            <div className="flex flex-col gap-0.5" style={{ minWidth: 0 }}>
                <code className="text-dk-sm text-dk-white">{label}</code>
                <span className="text-dk-xs text-dk-gray-600" style={{ overflowWrap: 'anywhere' }}>
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
    return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
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
                <TokenRow
                    key={token}
                    preview={<ColorBox color={`var(${token})`} />}
                    label={token}
                    value={values[token] ?? ''}
                />
            ))}
        </Grid>
    );
}

function TypographyPalette() {
    const [font, setFont] = useState('');
    useEffect(() => {
        setFont(getComputedStyle(document.documentElement).getPropertyValue(FONT_VAR).trim());
    }, []);
    return (
        <div className="flex flex-col gap-3" style={{ color: '#fff', fontFamily: `var(${FONT_VAR})` }}>
            <div className="flex flex-col gap-0.5">
                <code className="text-dk-sm text-dk-white">{FONT_VAR}</code>
                <span className="text-dk-xs text-dk-gray-600" style={{ overflowWrap: 'anywhere' }}>
                    {font || '—'}
                </span>
            </div>
            {FONT_WEIGHTS.map(({ label, weight }) => (
                <div key={weight} className="flex flex-col gap-0.5">
                    <span className="text-dk-xs text-dk-gray-600">
                        {label} · {weight}
                    </span>
                    <div style={{ fontSize: '1.5rem', fontWeight: weight }}>
                        The quick brown fox jumps over the lazy dog
                    </div>
                </div>
            ))}
        </div>
    );
}

const meta: Meta = {
    parameters: {
        docs: {
            canvas: { sourceState: 'none' },
        },
    },
    tags: ['autodocs', 'test'],
    title: 'Design System/Palette',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const CssVariables: Story = {
    render: () => <CssVariablesPalette />,
};

export const FontFamily: Story = {
    name: 'Typography / font family',
    render: () => <TypographyPalette />,
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
                        <div
                            aria-hidden
                            style={{ ...BOX, background: '#1e2423', border: '1px solid #282d2b', borderRadius: value }}
                        />
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
                        <div style={{ color: '#fff', flexShrink: 0, fontSize: value, lineHeight: 1, width: '3rem' }}>
                            Aa
                        </div>
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
        <div className="flex flex-col gap-3">
            {Object.entries(extend.spacing).map(([name, value]) => (
                <TokenRow
                    key={name}
                    preview={
                        <div
                            aria-hidden
                            style={{
                                background: '#13d89b',
                                borderRadius: '2px',
                                flexShrink: 0,
                                height: '1rem',
                                width: value,
                            }}
                        />
                    }
                    label={name}
                    value={value}
                />
            ))}
        </div>
    ),
};
