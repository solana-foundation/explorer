import React from 'react';
import { Edit } from 'react-feather';

type Props = {
    width?: number;
    className?: string;
};

export function EditIcon({ width = 14, className }: Props) {
    return <Edit size={width} className={className} />;
}
