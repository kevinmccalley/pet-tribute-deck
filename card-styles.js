// Three selectable visual styles for the whole deck — one deck-wide choice,
// not per-card (same pattern as dad-support-card's CARD_STYLES and
// wedding-party-cards' extension of it: each style bundles a palette, a
// border/frame treatment, a photo clip shape, and its own display font for
// the pet's name on the cover card, so styles read as genuinely different
// rather than a palette swap). Card body copy always stays in Poppins.
//
// 3 styles rather than 4-5 — this product is tagged Low effort in the
// roadmap, and 3 real, distinct looks cover the range (warm/rustic,
// playful/soft, formal/timeless) without ballooning build scope.
const CARD_STYLES = {
  "cozy-cabin": {
    id: "cozy-cabin",
    label: "Cozy Cabin",
    description: "Warm rust and cream, a rugged single-rule border, a paw-print accent.",
    ink: [59, 44, 34],
    accent: [150, 82, 53],
    divider: [214, 196, 168],
    panelFill: [250, 244, 230],
    borderStyle: "rustic",
    photoClip: "rounded",
    photoTreatment: "none",
    displayFontKey: "dancingScriptBold",
    displayMaxSize: 36,
    displayMinSize: 22,
    displayUppercase: false,
    taglineCaps: false,
  },
  "whimsical-watercolor": {
    id: "whimsical-watercolor",
    label: "Whimsical Watercolor",
    description: "Soft blush and lavender, a painterly wash border, a playful script name.",
    ink: [58, 50, 68],
    accent: [188, 132, 162],
    divider: [222, 208, 217],
    panelFill: [251, 246, 249],
    borderStyle: "painterly",
    photoClip: "circle",
    photoTreatment: "none",
    displayFontKey: "parisienne",
    displayMaxSize: 34,
    displayMinSize: 20,
    displayUppercase: false,
    taglineCaps: false,
  },
  "timeless-portrait": {
    id: "timeless-portrait",
    label: "Timeless Portrait",
    description: "Charcoal and gold, a formal double-rule frame, a sepia-toned photo.",
    ink: [20, 20, 20],
    accent: [187, 152, 90],
    divider: [196, 186, 156],
    panelFill: [247, 241, 232],
    borderStyle: "formal",
    photoClip: "rounded",
    photoTreatment: "sepia",
    displayFontKey: "playfairBlack",
    displayMaxSize: 32,
    displayMinSize: 18,
    displayUppercase: false,
    taglineCaps: true,
  },
};

const DEFAULT_CARD_STYLE = "cozy-cabin";

// Maps each style's displayFontKey to the actual font file to register with
// jsPDF (see style-fonts.js) — same lazy-load pattern as every sibling
// product: only the one font the buyer's chosen style needs gets loaded.
// ascentRatio: how far above its own baseline this font's tallest glyphs
// actually reach, as a fraction of its font size (see wedding-party-cards'
// card-styles.js for the full derivation of why this matters for script
// fonts specifically). Values reused from the sibling repos these exact
// font files came from.
const STYLE_FONT_FILES = {
  dancingScriptBold: { vfsName: "DancingScript-Bold.ttf", family: "DancingScriptBold", variant: "bold", base64: () => DANCING_SCRIPT_BOLD_BASE64, ascentRatio: 1.1 },
  parisienne: { vfsName: "Parisienne-Regular.ttf", family: "Parisienne", variant: "normal", base64: () => PARISIENNE_REGULAR_BASE64, ascentRatio: 0.96 },
  playfairBlack: { vfsName: "PlayfairDisplay-Black.ttf", family: "PlayfairBlack", variant: "bold", base64: () => PLAYFAIR_DISPLAY_BLACK_BASE64, ascentRatio: 1.2 },
};
