import { address, defineInstructionCard, heading, string } from '@entities/instruction-card';
import { PYTH_INSTRUCTIONS, type UpdateProductParams } from '@explorer/decoder-pyth';

export const UpdateProductDetailsCard = defineInstructionCard<UpdateProductParams>({
    fields: info => [
        address('Funding Account', info.fundingPubkey),
        address('Product Account', info.productPubkey),
        heading('Attributes'),
        ...Object.entries(info.attributes).map(([key, value]) => string(key, value)),
    ],
    title: `Pyth: ${PYTH_INSTRUCTIONS.UpdateProduct.name}`,
});
