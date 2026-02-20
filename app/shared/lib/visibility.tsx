'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';

type ObserveFn = (el: Element, cb: () => void) => () => void;

const VisibilityContext = createContext<ObserveFn | null>(null);

export function VisibilityProvider({ children }: { children: ReactNode }) {
    const callbacksRef = useRef(new Map<Element, () => void>());
    const observerRef = useRef<IntersectionObserver | null>(null);

    const getObserver = useCallback(() => {
        if (!observerRef.current) {
            observerRef.current = new IntersectionObserver(
                entries => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const cb = callbacksRef.current.get(entry.target);
                            if (cb) {
                                cb();
                                observerRef.current?.unobserve(entry.target);
                                callbacksRef.current.delete(entry.target);
                            }
                        }
                    });
                },
                { rootMargin: '50px' }
            );
        }
        return observerRef.current;
    }, []);

    const observe = useCallback<ObserveFn>(
        (el, cb) => {
            const observer = getObserver();
            callbacksRef.current.set(el, cb);
            observer.observe(el);

            return () => {
                observer.unobserve(el);
                callbacksRef.current.delete(el);
            };
        },
        [getObserver]
    );

    useEffect(() => {
        return () => observerRef.current?.disconnect();
    }, []);

    return <VisibilityContext.Provider value={observe}>{children}</VisibilityContext.Provider>;
}

export function useVisibility(enabled: boolean | undefined) {
    const ref = useRef<HTMLElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const observe = useContext(VisibilityContext);

    useEffect(() => {
        if (!enabled || !observe) return;
        const el = ref.current;
        if (!el) return;

        return observe(el, () => setIsVisible(true));
    }, [enabled, observe]);

    return { isVisible, ref };
}
