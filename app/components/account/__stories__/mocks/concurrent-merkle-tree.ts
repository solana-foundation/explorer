import { concurrentMerkleTreeBeetFactory, concurrentMerkleTreeHeaderBeet } from '@solana/spl-account-compression';
import { PublicKey } from '@solana/web3.js';

// Serializes a synthetic ConcurrentMerkleTree account with the same beets the component
// parses with, so stories don't need a captured mainnet account blob.
export function buildConcurrentMerkleTreeData({
    authority = new PublicKey('Bu1bGgCCCH1WrYzLBh3J4DBjGNm9RcjC9d2DBYbR1bu1'),
    creationSlot = 261_967_139n,
    maxBufferSize = 8,
    maxDepth = 5,
    rightMostIndex = 3,
    sequenceNumber = 42n,
} = {}): Uint8Array {
    const zeroKey = PublicKey.default;

    const [headerBuf] = concurrentMerkleTreeHeaderBeet.serialize({
        accountType: 1, // CompressionAccountType.ConcurrentMerkleTree
        header: {
            __kind: 'V1',
            fields: [{ authority, creationSlot, maxBufferSize, maxDepth, padding: [0, 0, 0, 0, 0, 0] }],
        },
    });

    const changeLogs = Array.from({ length: maxBufferSize }, () => ({
        _padding: 0,
        index: 0,
        pathNodes: Array.from({ length: maxDepth }, () => zeroKey),
        root: zeroKey,
    }));
    const [treeBuf] = concurrentMerkleTreeBeetFactory(maxDepth, maxBufferSize).serialize({
        activeIndex: 0n,
        bufferSize: 1n,
        changeLogs,
        rightMostPath: {
            _padding: 0,
            index: rightMostIndex,
            leaf: zeroKey,
            proof: Array.from({ length: maxDepth }, () => zeroKey),
        },
        sequenceNumber,
    });

    return Uint8Array.from([...headerBuf, ...treeBuf]);
}
