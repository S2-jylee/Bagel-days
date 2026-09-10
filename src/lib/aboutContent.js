import {
  IcWheat, IcPot, IcCup, IcLeaf, IcTub, IcBean, IcSnowflake, IcHeart, IcHeartThin, IcCoffeeCup,
} from "../components/Icons";

// Icons an admin can pick for About's story-list and "What Makes Bagel Days
// Special" items — a fixed palette (not arbitrary upload) so every choice
// stays visually consistent with the rest of the page's line-icon style.
export const ABOUT_ICON_OPTIONS = [
  { key: "wheat", Icon: IcWheat, labelKey: "aboutIconWheat" },
  { key: "pot", Icon: IcPot, labelKey: "aboutIconPot" },
  { key: "cup", Icon: IcCup, labelKey: "aboutIconCup" },
  { key: "coffeeCup", Icon: IcCoffeeCup, labelKey: "aboutIconCoffeeCup" },
  { key: "leaf", Icon: IcLeaf, labelKey: "aboutIconLeaf" },
  { key: "tub", Icon: IcTub, labelKey: "aboutIconTub" },
  { key: "bean", Icon: IcBean, labelKey: "aboutIconBean" },
  { key: "snowflake", Icon: IcSnowflake, labelKey: "aboutIconSnowflake" },
  { key: "heart", Icon: IcHeart, labelKey: "aboutIconHeart" },
  { key: "heartThin", Icon: IcHeartThin, labelKey: "aboutIconHeartThin" },
];

const ICON_BY_KEY = Object.fromEntries(ABOUT_ICON_OPTIONS.map((o) => [o.key, o.Icon]));

export function aboutIconComponent(key) {
  return ICON_BY_KEY[key] || IcWheat;
}

// The About page's fully-editable text + icon content (everything besides
// the fixed "About Us" header and section headings, and besides the named
// photo slots in aboutPhotos.js) — defaults match what was previously
// hardcoded in About.jsx, so the page renders identically until an admin
// changes something in Homepage > About.
export const DEFAULT_ABOUT_CONTENT = {
  // A single field per item (not separate lead/rest) — **wrapped like this**
  // renders bold, matching the old lead-in styling, but the whole thing is
  // one editable region in admin instead of two side-by-side pencils. See
  // parseStoryText in AboutPageBody.jsx.
  storyList: [
    { icon: "wheat", text: "**Every morning begins with fresh dough.** At Bagel Days, every bagel is made from scratch using premium ingredients and slowly cold-fermented overnight to develop its signature flavour and chewy texture." },
    { icon: "pot", text: "**Each bagel is hand-boiled before being baked fresh in the oven,** creating a crisp golden crust and a soft, chewy centre." },
    { icon: "cup", text: "To complete the experience, we proudly serve Campos Specialty Coffee alongside a selection of house-made cream cheeses, freshly prepared every day to pair perfectly with our bagels." },
  ],
  candy: {
    p1: "Candy, our beloved mascot, is inspired by our own family Bichon Frise. She represents the warmth, happiness, and sense of family that we hope every guest feels when visiting Bagel Days.",
    p2: "We believe freshly baked bagels have the power to bring people together, create meaningful moments, and brighten everyday life.",
    p3: "From our family to yours, we hope every visit to Bagel Days leaves you with a smile.",
  },
  specials: [
    { icon: "leaf", num: "1. FRESH DOUGH DAILY", title: "Made from scratch", desc: "Every morning using quality ingredients.", slot: "special1" },
    { icon: "snowflake", num: "2. SLOW COLD FERMENTATION", title: "Deeper flavour", desc: "Fermented overnight for the perfect chewy texture.", slot: "special2" },
    { icon: "pot", num: "3. HAND-BOILED & OVEN-BAKED", title: "NY-style texture", desc: "Every bagel is hand-boiled before baking.", slot: "special3" },
    { icon: "tub", num: "4. HOUSE-MADE CREAM CHEESE", title: "Prepared daily", desc: "In a variety of delicious flavours.", slot: "special4" },
    { icon: "bean", num: "5. CAMPOS SPECIALTY COFFEE", title: "Perfectly paired", desc: "Proudly serving Campos Specialty Coffee.", slot: "special5" },
  ],
};
