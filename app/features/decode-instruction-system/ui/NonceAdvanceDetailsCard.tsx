import { address, defineInstructionCard } from '@entities/instruction-card';
import { AdvanceNonceInfo } from '@explorer/parsers/programs/system';

export const NonceAdvanceDetailsCard = defineInstructionCard<AdvanceNonceInfo>({
    fields: info => [address('Nonce Address', info.nonceAccount), address('Authority Address', info.nonceAuthority)],
    title: 'System Program: Advance Nonce',
});
