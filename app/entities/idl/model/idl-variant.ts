/**
 * The IDL sources the program IDL card can surface, side by side. The string values are also
 * used as tab ids and forwarded to the Castaway SDK generator as the `idlSource` query param.
 */
export enum IdlVariant {
    Anchor = 'anchor',
    ProgramMetadata = 'program-metadata',
}
