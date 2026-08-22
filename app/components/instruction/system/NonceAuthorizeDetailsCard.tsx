import { address, defineInstructionCard } from '@entities/instruction-card';

import { AuthorizeNonceInfo } from './types';

export const NonceAuthorizeDetailsCard = defineInstructionCard<AuthorizeNonceInfo>({
    fields: info => [
        address('Nonce Address', info.nonceAccount),
        address('Old Authority Address', info.nonceAuthority),
        address('New Authority Address', info.newAuthorized),
    ],
    title: 'System Program: Authorize Nonce',
});
