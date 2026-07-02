// Registers a Bootstrap 5 breakpoint quick-select toolbar in the Storybook manager.
// Viewport keys must match the `viewport.options` keys in preview.tsx.
import { addons, types, useGlobals } from 'storybook/manager-api';
import React, { useCallback } from 'react';

const ADDON_ID = 'explorer/breakpoint-toolbar';
const TOOL_ID = `${ADDON_ID}/tool`;

// Must match the bsXxx keys in preview.tsx viewport.options
export const BREAKPOINTS = [
    { key: 'bsXs', label: 'xs·375' },
    { key: 'bsSm', label: 'sm·576' },
    { key: 'bsMd', label: 'md·768' },
    { key: 'bsLg', label: 'lg·992' },
    { key: 'bsXl', label: 'xl·1200' },
    { key: 'bsXxl', label: 'xxl·1400' },
] as const;

function BreakpointTool() {
    const [globals, updateGlobals] = useGlobals();
    const currentKey =
        typeof globals?.viewport === 'object' ? (globals.viewport as { value?: string })?.value : globals?.viewport;

    const setViewport = useCallback(
        (key: string) => {
            updateGlobals({ viewport: currentKey === key ? {} : { value: key } });
        },
        [updateGlobals, currentKey],
    );

    const resetViewport = useCallback(() => {
        updateGlobals({ viewport: {} });
    }, [updateGlobals]);

    const isAuto = !currentKey;

    const btnStyle = (active: boolean) => ({
        background: active ? '#1ea7fd' : 'transparent',
        border: `1px solid ${active ? '#1ea7fd' : '#d9d9d9'}`,
        borderRadius: 3,
        color: active ? '#fff' : '#444',
        cursor: 'pointer',
        fontFamily: 'monospace',
        fontSize: 10,
        lineHeight: 1,
        padding: '3px 6px',
    });

    return (
        <div
            style={{
                alignItems: 'center',
                display: 'flex',
                gap: 2,
                padding: '0 4px',
            }}
        >
            <button onClick={resetViewport} title="Reset to Auto viewport" style={btnStyle(isAuto)}>
                Auto
            </button>
            {BREAKPOINTS.map(({ key, label }) => (
                <button
                    key={key}
                    onClick={() => setViewport(key)}
                    title={`Switch to ${label} viewport`}
                    style={btnStyle(currentKey === key)}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}

addons.register(ADDON_ID, () => {
    addons.add(TOOL_ID, {
        render: () => <BreakpointTool />,
        title: 'Bootstrap Breakpoints',
        type: types.TOOL,
    });
});
