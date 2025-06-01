import { useCallback, useEffect, useMemo, useState } from 'react';

const getEventListenerName = (): string => {
    return 'visibilitychange';
};

const getIsVisible = (): boolean => {
    // assumes ssr generated page is always true
    if (typeof document === 'undefined') {
        return true;
    }

    return !document.hidden;
};

const useTabVisibility = () => {
    const [visible, setVisible] = useState(getIsVisible());
    const handleVisibility = useCallback(() => setVisible(getIsVisible()), [setVisible]);

    useEffect(() => {
        const evListenerName = getEventListenerName();
        window?.document.addEventListener(evListenerName, handleVisibility, false);

        return () => window?.document.removeEventListener(evListenerName, handleVisibility);
    }, [handleVisibility]);

    return useMemo(() => ({ visible }), [visible]);
};

export default useTabVisibility;
