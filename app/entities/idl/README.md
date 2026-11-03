## Formatters

[formatSerdeIdl]() - formats a modern (0.30+) Anchor IDL into the shape used to construct an Anchor `Program`. It is an identity pass-through now: legacy (pre-0.30) IDLs are converted to Codama by the resolver and decode through `@explorer/idl-decode`, never through `new Program()`, so no legacy→modern conversion happens here anymore.

[formatDisplayIdl]() - formats IDL into a format that is used to display IDL in a human-readable format. Keeps original version of conversion logic that was introduced for Explorer

[formatReferenceSerdeIdl]() - reference implementation for the formatter. Used only to keep track of limitations of original implementation
