import { address, bytes, defineInstructionCard, sol } from '@entities/instruction-card';
import { CreateAccountInfo } from '@explorer/parsers/programs/system';

export const CreateDetailsCard = defineInstructionCard<CreateAccountInfo>({
    fields: info => [
        address('From Address', info.source),
        address('New Address', info.newAccount),
        sol('Transfer Amount (SOL)', info.lamports),
        bytes('Allocated Data Size', info.space),
        address('Assigned Program Id', info.owner),
    ],
    title: 'System Program: Create Account',
});
