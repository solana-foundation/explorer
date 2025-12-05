import { cn } from '@components/shared/utils';
import { ComponentProps, FC } from 'react';

import { useExplorerLink } from '../model/use-explorer-link';

type ExplorerLinkProps = Pick<ComponentProps<'div'>, 'className'> & {
    path: string;
    label: string;
};

export const ExplorerLink: FC<ExplorerLinkProps> = ({ path, label, className }) => {
    const { link } = useExplorerLink(path);
    return (
        <a href={link} target="_blank" rel="noopener noreferrer" className={cn('e-font-mono', className)}>
            {label}
        </a>
    );
};
