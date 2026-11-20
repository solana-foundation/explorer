import { address, defineInstructionCard } from '@entities/instruction-card';
import { UpgradeNonceInfo } from '@explorer/parsers/programs/system';

export const UpgradeNonceDetailsCard = defineInstructionCard<UpgradeNonceInfo>({
    fields: info => [address('Nonce Address', info.nonceAccount)],
    title: 'System Program: Upgrade Nonce',
});
