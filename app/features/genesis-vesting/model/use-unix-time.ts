import 'client-only';

import { useEffect, useState } from 'react';

// Vested amounts change in whole steps; re-reading the clock this often keeps an open page within one tick.
const TICK_SECONDS = 15;

/** The current unix time in seconds, re-read every `TICK_SECONDS` so an open vesting view passes unlock times. */
export function useUnixTime(): number {
    const [now, setNow] = useState(readUnixTime);

    useEffect(() => {
        const id = setInterval(() => setNow(readUnixTime()), TICK_SECONDS * 1000);
        return () => clearInterval(id);
    }, []);

    return now;
}

function readUnixTime(): number {
    return Math.floor(Date.now() / 1000);
}
