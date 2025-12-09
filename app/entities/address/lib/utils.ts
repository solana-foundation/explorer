export const truncateAddress = (address: string, padLeft = 4, padRight: number = padLeft) => {
    // Handle edge case where both paddings are 0
    if (padLeft === 0 && padRight === 0) {
        return '..';
    }

    if (address.length <= padLeft + padRight) {
        return address;
    }

    return `${address.slice(0, padLeft)}..${address.slice(-1 * padRight)}`;
};
