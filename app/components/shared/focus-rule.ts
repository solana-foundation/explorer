import type { CSSProperties } from 'react';

// bg-heavy-metal-800, spelled out so the focus rule can paint a control's fill back over its padding box.
const CONTROL_GROUND = 'oklch(30.098% 0.01205 160.58)';

export function focusRuleStyle(lit: boolean): CSSProperties {
    return {
        backgroundClip: 'padding-box, border-box',
        backgroundImage: [
            `linear-gradient(${CONTROL_GROUND}, ${CONTROL_GROUND})`,
            'radial-gradient(118% 130% at 0% 100%, rgba(29,215,155,0.53) 0%, rgba(29,215,155,0.46) 35%, rgba(29,215,155,0.4) 65%, rgba(29,215,155,0.34) 90%, rgba(29,215,155,0.31) 100%)',
        ].join(', '),
        backgroundOrigin: 'border-box',
        backgroundPosition: '0 0, left bottom',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '100% 100%, 100% 100%',
        borderColor: lit ? 'transparent' : undefined,
        transitionDuration: lit ? '100ms' : '400ms',
        transitionProperty: 'border-color',
    };
}

export const FOCUS_RULE_CLASSES = 'focus-visible:outline-none';

export function isKeyboardFocus(target: EventTarget & Element): boolean {
    return target.matches(':focus-visible');
}
