// Registers a Bootstrap 5 breakpoint quick-select toolbar in the Storybook manager.
// Uses React.createElement (no JSX) so this file is safe to import from both the
// production Storybook manager and the design-sb manager, which has no JSX transform.
// Viewport keys must match the `viewport.options` keys in preview.tsx.
import React, { useCallback } from 'react';
import { addons, types, useGlobals } from 'storybook/manager-api';

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
    const currentKey = typeof globals?.viewport === 'object' ? globals.viewport?.value : globals?.viewport;

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

    return React.createElement(
        'div',
        { style: { alignItems: 'center', display: 'flex', gap: 2, padding: '0 4px' } },
        React.createElement(
            'button',
            { onClick: resetViewport, style: btnStyle(isAuto), title: 'Reset to Auto viewport' },
            'Auto',
        ),
        ...BREAKPOINTS.map(({ key, label }) =>
            React.createElement(
                'button',
                {
                    key,
                    onClick: () => setViewport(key),
                    style: btnStyle(currentKey === key),
                    title: `Switch to ${label} viewport`,
                },
                label,
            ),
        ),
    );
}

addons.register(ADDON_ID, () => {
    addons.add(TOOL_ID, {
        render: BreakpointTool,
        title: 'Bootstrap Breakpoints',
        type: types.TOOL,
    });
});
