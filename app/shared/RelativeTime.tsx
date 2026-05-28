import { formatRelativeTime } from '@utils/date';
import { useEffect, useState } from 'react';

type Props = {
    /** Unix timestamp in milliseconds. */
    date: number;
    /** Auto-refresh interval in ms. Set to 0 to disable. Defaults to 60s. */
    interval?: number;
};

export function RelativeTime({ date, interval = 60_000 }: Props) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (interval === 0) return;
        const id = setInterval(() => setNow(Date.now()), interval);
        return () => clearInterval(id);
    }, [interval]);

    return (
        <time dateTime={new Date(date).toISOString()} suppressHydrationWarning>
            {formatRelativeTime(date, now)}
        </time>
    );
}
