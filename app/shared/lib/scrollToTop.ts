export function scrollToTop() {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0 });
}
