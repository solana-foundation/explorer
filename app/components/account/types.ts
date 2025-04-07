import { StatusType } from '@/app/components/shared/StatusBadge';
import { TokenExtension } from '@/app/validators/accounts/token-extension';

export type ParsedTokenExtension = Pick<TokenExtension, 'extension'> & {
    name: string;
    tooltip?: string;
    description?: string;
    status: StatusType;
    externalLinks: { label: string; url: string }[];
    parsed?: TokenExtension['state'];
};
