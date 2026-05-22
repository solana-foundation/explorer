import { cn } from '@components/shared/utils';
import { MouseEvent, useEffect, useRef, useState } from 'react';

const TABS = [
    { href: '#summary', title: 'Summary' },
    { href: '#accounts', title: 'Accounts' },
    { href: '#tokens', title: 'Tokens' },
    { href: '#programs', title: 'Programs' },
    { href: '#logs', title: 'Logs' },
];

const HEADER_PADDINGS = 10;

export function TransactionTabs() {
    const tabsRef = useRef<HTMLDivElement>(null);
    const [stuck, setStuck] = useState(false);
    const [activeTab, setActiveTab] = useState(TABS[0].href);

    useEffect(() => {
        const el = tabsRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), {
            rootMargin: '-1px 0px 0px 0px',
            threshold: [1],
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const sectionIds = TABS.map(t => t.href.slice(1));

        const update = () => {
            const tabHeight = tabsRef.current?.getBoundingClientRect().height ?? 0;
            const threshold = window.scrollY + tabHeight + HEADER_PADDINGS;

            let active = sectionIds[0];
            for (const id of sectionIds) {
                const el = document.getElementById(id);
                if (el && el.getBoundingClientRect().top + window.scrollY <= threshold) {
                    active = id;
                }
            }
            setActiveTab(`#${active}`);
        };

        window.addEventListener('scroll', update, { passive: true });
        update();
        return () => window.removeEventListener('scroll', update);
    }, []);

    const handleTabClick = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
        e.preventDefault();
        const target = document.getElementById(href.slice(1));
        if (!target || !tabsRef.current) return;
        const offset = tabsRef.current.getBoundingClientRect().height;
        window.scrollTo({
            behavior: 'smooth',
            top: target.getBoundingClientRect().top + window.scrollY - offset - HEADER_PADDINGS,
        });
    };

    return (
        <div
            ref={tabsRef}
            className={cn(
                'e-sticky e-top-0 e-z-10 e-flex e-gap-5 e-bg-heavy-metal-900',
                'e-[scrollbar-width:none] e-overflow-x-auto [&::-webkit-scrollbar]:e-hidden',
                'e-ml-[calc(50%-50vw)] e-mr-[calc(50%-50vw)]',
                'e-pl-[calc(50vw-50%)] e-pr-[calc(50vw-50%)]',
                'e-transition-[box-shadow] e-duration-200',
                stuck && 'e-shadow-[0_6px_16px_rgba(0,0,0,0.45)]',
            )}
        >
            {TABS.map(t => (
                <a
                    key={t.href}
                    href={t.href}
                    onClick={e => handleTabClick(e, t.href)}
                    className={cn(
                        activeTab === t.href && 'e-border-b-accent !e-text-accent',
                        'e-inline-flex e-items-center e-px-1 e-py-4 e-text-sm',
                        'e-whitespace-nowrap e-text-gray-400 e-no-underline',
                        'e-border-b-2 e-border-b-transparent [border-bottom-style:solid]',
                        'e-transition-colors',
                        'hover:e-text-gray-50 hover:e-no-underline',
                    )}
                >
                    {t.title}
                </a>
            ))}
        </div>
    );
}
