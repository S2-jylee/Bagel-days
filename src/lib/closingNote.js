// The message block at the very bottom of the Contact ("Thank you for
// supporting...") and Visit Us ("We look forward...") pages. Admin edits are
// stored as closingNote inside that page's about_content JSON (Homepage >
// Contact / Visit Us) — only the fields actually changed, so the defaults
// below keep applying to the rest. Visit Us has no default image: it shows
// its heart line icon until one is uploaded.
export const CLOSING_NOTE_DEFAULTS = {
  contact: {
    title: "Thank you for supporting Bagel Days.",
    text: "From our family to yours, thank you for being part of our journey. We can't wait to welcome you soon!",
    image: "/assets/images/candy-mascot.png",
    size: "300 × 300",
  },
  visit: {
    title: "We look forward to seeing you soon!",
    text: "Thank you for choosing Bagel Days. We can't wait to welcome you with freshly baked bagels and great coffee.",
    image: null,
    size: "240 × 240",
  },
};

export function closingNote(pageId, page) {
  return { ...CLOSING_NOTE_DEFAULTS[pageId], ...(page?.aboutContent?.closingNote || {}) };
}
