import { address, defineInstructionCard } from '@entities/instruction-card';
import { InitializeNonceInfo } from '@explorer/parsers/programs/system';

export const NonceInitializeDetailsCard = defineInstructionCard<InitializeNonceInfo>({
    fields: info => [address('Nonce Address', info.nonceAccount), address('Authority Address', info.nonceAuthority)],
    title: 'System Program: Initialize Nonce',
});
