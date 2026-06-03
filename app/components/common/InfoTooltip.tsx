import { cn } from '@shared/utils';
import React, { ReactNode, useState } from 'react';
import { HelpCircle } from 'react-feather';

type Props = {
    text?: string;
    children?: ReactNode;
    bottom?: boolean;
    right?: boolean;
    withHelpIcon?: boolean;
    className?: string;
};

type State = 'hide' | 'show';

function Popover({ state, bottom, right, text }: { state: State; bottom?: boolean; right?: boolean; text: string }) {
    if (state === 'hide') return null;
    return (
        <div className={cn(`popover bs-popover-${bottom ? 'bottom' : 'top'}`, right && 'right', 'show')}>
            <div className={cn('arrow', right && 'right')} />
            <div className="popover-body">{text}</div>
        </div>
    );
}

export function InfoTooltip({ bottom, right, text, children, withHelpIcon = true }: Props) {
    const [state, setState] = useState<State>('hide');

    const justify = right ? 'end' : 'start';

    if (!text) {
        return <>{children}</>;
    }

    return (
        <div
            className="popover-container e-w-full"
            onMouseOver={() => setState('show')}
            onMouseOut={() => setState('hide')}
        >
            <div className={`e-flex e-items-center justify-content-${justify}`}>
                {children} {withHelpIcon && <HelpCircle className="e-ml-1.5" size={13} />}
            </div>
            <Popover bottom={bottom} right={right} state={state} text={text} />
        </div>
    );
}
