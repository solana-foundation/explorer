// Label column width shared across the redesigned account/program cards: 20% of the card
// width, clamped to [84px, 240px]. Shared across every row (the section rows and the Raw-view
// rows) so their values line up in one column. Unprefixed so it holds at every width — the
// cards keep their horizontal label/value layout on mobile too (rows pass `row` to KeyValue
// rather than stacking below `sm`).
export const LABEL_WIDTH = 'w-[clamp(84px,20%,240px)]';
