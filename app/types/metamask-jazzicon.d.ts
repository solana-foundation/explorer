declare module '@metamask/jazzicon' {
    /**
     * Generates an identicon SVG based on the provided diameter and seed
     * @param diameter - The diameter of the identicon in pixels
     * @param seed - The seed used to generate the identicon pattern
     * @returns The HTML container element with the SVG identicon
     */
    function generateIdenticon(diameter: string | number, seed: number | string): HTMLElement;

    export = generateIdenticon;
}
