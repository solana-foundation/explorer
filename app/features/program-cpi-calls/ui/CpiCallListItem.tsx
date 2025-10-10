import { PublicKey } from '@solana/web3.js';

import { Address } from '@/app/components/common/Address';
import { PROGRAM_INFO_BY_ID } from '@/app/utils/programs';

type Item = {
    address: PublicKey;
    calls: number;
    description: string;
    name: string;
};

function getProgramInfo(address: string) {
    return PROGRAM_INFO_BY_ID[address];
}

export function CpiCallListItem({ record }: { record: Item }) {
    const programInfo = getProgramInfo(record.address.toBase58());
    return (
        <tr>
            <td className="w-1 text-capitalize">
                {programInfo ? <Address overrideText={programInfo.name} pubkey={record.address} /> : record.name}
            </td>
            <td className="w-100 text-lg-end">
                <Address pubkey={record.address} link alignRight />
            </td>
            <td className="">{record.calls}</td>
        </tr>
    );
}
