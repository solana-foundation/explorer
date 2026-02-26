import pLimit from 'p-limit';

export async function fetchAll<TInput, TOutput>(
    items: TInput[],
    fn: (item: TInput) => Promise<TOutput>,
    concurrency = 2
): Promise<TOutput[]> {
    const limit = pLimit(concurrency);
    return Promise.all(items.map(item => limit(() => fn(item))));
}
