export function SearchGroupHeading({ label }: { label: string }) {
    return (
        <div className="px-3 pb-2 pt-6">
            <span className="shrink-0 select-none text-xs font-normal uppercase text-outer-space-300">{label}</span>
        </div>
    );
}
