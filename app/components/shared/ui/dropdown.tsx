import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';

import { cn } from '@/app/components/shared/utils';

// Self-contained replacement for Bootstrap's JS Dropdown: the root owns open state and closes on
// outside click / Escape / item click. Skin lives in the `.e-dropdown*` family in app/styles.css.
// TODO: fold into the Radix-backed dropdown-menu.tsx once visual parity with dashkit is no longer required.

interface DropdownContextValue {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DropdownContext = React.createContext<DropdownContextValue | undefined>(undefined);

interface DropdownProps extends React.HTMLAttributes<HTMLDivElement> {
    defaultOpen?: boolean;
}

const Dropdown = React.forwardRef<HTMLDivElement, DropdownProps>(
    ({ className, defaultOpen = false, ...props }, ref) => {
        const [open, setOpen] = React.useState(defaultOpen);
        const rootRef = React.useRef<HTMLDivElement | null>(null);
        const setRefs = React.useCallback(
            (node: HTMLDivElement | null) => {
                rootRef.current = node;
                if (typeof ref === 'function') ref(node);
                else if (ref) ref.current = node;
            },
            [ref],
        );

        React.useEffect(() => {
            if (!open) return;
            const onMouseDown = (event: MouseEvent) => {
                if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
                    setOpen(false);
                }
            };
            const onKeyDown = (event: KeyboardEvent) => {
                if (event.key === 'Escape') setOpen(false);
            };
            document.addEventListener('mousedown', onMouseDown);
            document.addEventListener('keydown', onKeyDown);
            return () => {
                document.removeEventListener('mousedown', onMouseDown);
                document.removeEventListener('keydown', onKeyDown);
            };
        }, [open]);

        return (
            <DropdownContext.Provider value={{ open, setOpen }}>
                <div ref={setRefs} className={cn('e-dropdown', className)} {...props} />
            </DropdownContext.Provider>
        );
    },
);
Dropdown.displayName = 'Dropdown';

interface DropdownToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    asChild?: boolean;
}

const DropdownToggle = React.forwardRef<HTMLButtonElement, DropdownToggleProps>(
    ({ asChild = false, onClick, ...props }, ref) => {
        const context = React.useContext(DropdownContext);
        const Comp = asChild ? Slot : 'button';
        return (
            <Comp
                ref={ref}
                aria-haspopup="true"
                aria-expanded={context?.open ?? false}
                onClick={event => {
                    onClick?.(event);
                    context?.setOpen(isOpen => !isOpen);
                }}
                {...props}
            />
        );
    },
);
DropdownToggle.displayName = 'DropdownToggle';

interface DropdownMenuProps extends React.HTMLAttributes<HTMLDivElement> {
    align?: 'start' | 'end';
}

const DropdownMenu = React.forwardRef<HTMLDivElement, DropdownMenuProps>(
    ({ className, align = 'start', ...props }, ref) => {
        const context = React.useContext(DropdownContext);
        return (
            <div
                ref={ref}
                className={cn(
                    'e-dropdown-menu',
                    align === 'end' && 'e-dropdown-menu-end',
                    context?.open && 'e-show',
                    className,
                )}
                {...props}
            />
        );
    },
);
DropdownMenu.displayName = 'DropdownMenu';

const DropdownHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => <div ref={ref} className={cn('e-dropdown-header', className)} {...props} />,
);
DropdownHeader.displayName = 'DropdownHeader';

interface DropdownItemProps extends React.HTMLAttributes<HTMLDivElement> {
    asChild?: boolean;
}

const DropdownItem = React.forwardRef<HTMLDivElement, DropdownItemProps>(
    ({ className, asChild = false, onClick, ...props }, ref) => {
        const context = React.useContext(DropdownContext);
        const Comp = asChild ? Slot : 'div';
        return (
            <Comp
                ref={ref}
                className={cn('e-dropdown-item', className)}
                onClick={event => {
                    onClick?.(event);
                    context?.setOpen(false);
                }}
                {...props}
            />
        );
    },
);
DropdownItem.displayName = 'DropdownItem';

export { Dropdown, DropdownHeader, DropdownItem, DropdownMenu, DropdownToggle };
