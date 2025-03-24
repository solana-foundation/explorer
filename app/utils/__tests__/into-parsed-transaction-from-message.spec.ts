import * as stubs from '@/app/__tests__/mock-stubs';
import * as mock from '@/app/__tests__/mocks';

import { intoParsedTransactionFromMessage } from '../parsed-tx';
// !!!
describe('intoParsedTransactionFromMessage', () => {
    test("should return ParsedTransaction compatible data for SystemProgram::transfer's VersionedMessage", async () => {
        const m = mock.deserializeMessage(stubs.systemTransferMsg);

        const ix = intoParsedTransactionFromMessage(m);

        console.log(12, { ix }, ix.message.instructions);

        expect(ix.message.accountKeys).toHaveLength(4);
        expect(ix.message.addressTableLookups).toHaveLength(0);
        expect(ix.message.recentBlockhash).toEqual('4BbJaBaqatXh5gbRry2yGerZoDm8MP3Tdaw9yVbHSGa3');
        expect(ix.message.instructions).toHaveLength(1);
        expect(ix.message.instructions[0]).toEqual({ accounts: [1, 2], data: '3Bxs4Bc3VYuGVB19', programIdIndex: 3 });
        expect(ix.signatures).toHaveLength(2)
    });
});
