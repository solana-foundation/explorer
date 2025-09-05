import { PublicKey } from '@solana/web3.js';

import { Address } from '@/app/components/common/Address';

type Item = {
    address: PublicKey;
    calls: number;
    description: string;
    name: string;
};

export function CpiCallListItem({ record }: { record: Item }) {
    return (
        <tr>
            <td className="w-1 text-capitalize">{record.name}</td>
            <td>{record.description === 'None' ? '\u2014' : record.description}</td>
            <td>
                <Address pubkey={record.address} link truncate truncateChars={40} />
            </td>
            <td>{record.calls}</td>
        </tr>
    );
}
