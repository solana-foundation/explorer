'use client';

import { displayTimestamp, displayTimestampUtc } from '@utils/date';
import { useState } from 'react';

type State = 'hide' | 'show';

function Tooltip({ state }: { state: State }) {
    const tooltip = {
        maxWidth: '20rem',
    };

    if (state === 'hide') return null;
    return (
        <div className="popover bs-popover-bottom show" style={tooltip}>
            <div className="arrow" />
            <div className="popover-body">(Click to toggle between local and UTC)</div>
        </div>
    );
}

export function TimestampToggle({ unixTimestamp, shorter }: { unixTimestamp: number; shorter?: boolean }) {
    const [isTimestampTypeUtc, toggleTimestampType] = useState(true);
    const [showTooltip, toggleTooltip] = useState<State>('hide');

    const toggle = () => {
        toggleTimestampType(!isTimestampTypeUtc);
    };

    const tooltipContainer = {
        cursor: 'pointer',
    };

    return (
        <div className="popover-container w-100" style={tooltipContainer}>
            <span onClick={toggle} onMouseOver={() => toggleTooltip('show')} onMouseOut={() => toggleTooltip('hide')}>
                {isTimestampTypeUtc === true
                    ? displayTimestampUtc(unixTimestamp, shorter)
                    : displayTimestamp(unixTimestamp, shorter)}
            </span>
            <Tooltip state={showTooltip} />
        </div>
    );
}
