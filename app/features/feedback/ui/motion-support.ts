/** False where there are no Web Animations (jsdom). */
export function canAnimate(): boolean {
    return typeof Element.prototype.animate === 'function';
}

export function prefersReducedMotion(): boolean {
    return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
