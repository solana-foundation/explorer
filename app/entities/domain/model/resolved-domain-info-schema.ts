import { AddressFromString } from '@validators/pubkey';
import { type Infer, nullable, type } from 'superstruct';

export const ResolvedDomainInfoSchema = nullable(
    type({
        address: AddressFromString,
        owner: AddressFromString,
    }),
);

export type ResolvedDomainInfo = Infer<typeof ResolvedDomainInfoSchema>;
