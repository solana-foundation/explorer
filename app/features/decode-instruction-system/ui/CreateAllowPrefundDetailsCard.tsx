import { address, bytes, defineInstructionCard, sol } from '@entities/instruction-card';
import { CreateAccountAllowPrefundInfo } from '@explorer/parsers/programs/system';

export const CreateAllowPrefundDetailsCard = defineInstructionCard<CreateAccountAllowPrefundInfo>({
    fields: info => [
        info.source && address('From Address', info.source),
        address('New Address', info.newAccount),
        info.lamports !== undefined && sol('Transfer Amount (SOL)', info.lamports),
        bytes('Allocated Data Size', info.space),
        address('Assigned Program Id', info.owner),
    ],
    title: 'System Program: Create Account (Allow Prefund)',
});
