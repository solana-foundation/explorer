'use client';

import BsDropdown from 'bootstrap/js/dist/dropdown';
import { ReactNode, RefObject, useEffect } from 'react';

type DropdownOptions = ConstructorParameters<typeof BsDropdown>[1];

export type DropdownProps = {
    dropdownRef: RefObject<HTMLButtonElement>;
    children: ReactNode;
    options?: DropdownOptions;
};

export function Dropdown({ dropdownRef, children, options }: DropdownProps) {
    useEffect(() => {
        if (!dropdownRef.current) {
            return;
        }
        const dropdown = new BsDropdown(dropdownRef.current, options);
        return () => dropdown.dispose();
    }, [dropdownRef, options]);

    return <>{children}</>;
}
