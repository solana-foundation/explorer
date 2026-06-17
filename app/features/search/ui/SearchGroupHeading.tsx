export function SearchGroupHeading({ label }: { label: string }) {
    return (
        <div className="px-3 pb-1 pt-3">
            <span className="shrink-0 select-none text-xs font-semibold uppercase tracking-widest text-heavy-metal-400">
                {label}
            </span>
        </div>
    );
}
