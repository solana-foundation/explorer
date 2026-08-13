// Registers a Tailwind breakpoint quick-select toolbar in the Storybook manager.
// Uses React.createElement (no JSX) so this file is safe to import from both the
// production Storybook manager and the design-sb manager, which has no JSX transform.
// BREAKPOINTS are generated from tailwind.config in ./breakpoints (keys match viewport.options there).
import React, { useCallback } from 'react';
import { addons, types, useGlobals } from 'storybook/manager-api';

import { BREAKPOINTS } from './breakpoints';

const ADDON_ID = 'explorer/breakpoint-toolbar';
const TOOL_ID = `${ADDON_ID}/tool`;

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
        title: 'Tailwind Breakpoints',
        type: types.TOOL,
    });
});
