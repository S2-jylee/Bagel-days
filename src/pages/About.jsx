import { productImageUrl } from "../lib/assetUrl";
import { useSeo } from "../lib/seo";
import { usePageContent } from "../context/PageContentContext";
import { DEFAULT_ABOUT_PHOTOS } from "../lib/aboutPhotos";
import { DEFAULT_ABOUT_CONTENT } from "../lib/aboutContent";
import AboutPageBody from "../components/AboutPageBody";

export default function About() {
  useSeo({
    title: "Bagel Days | Our Story — Handmade Bagels in Fortitude Valley",
    description: "Meet Bagel Days: fresh dough made daily, slow cold fermentation, hand-boiled NY-style bagels, house-made cream cheese, and Campos Specialty Coffee in Fortitude Valley, Brisbane.",
    path: "/about",
  });

  const { pages } = usePageContent();
  const aboutPhotos = pages.about?.aboutPhotos || {};
  const overrides = pages.about?.aboutContent || {};
  // A slot's admin-uploaded URL if set, else the bundled default for it.
  const photoUrl = (slot) => productImageUrl(aboutPhotos[slot] || DEFAULT_ABOUT_PHOTOS[slot]);
  // Each list/array item is merged individually (by index) with its default,
  // so an admin edit to just one field (e.g. only the icon) doesn't lose the
  // rest of that item's still-default text.
  const storyList = DEFAULT_ABOUT_CONTENT.storyList.map((d, i) => ({ ...d, ...(overrides.storyList?.[i] || {}) }));
  const candy = { ...DEFAULT_ABOUT_CONTENT.candy, ...(overrides.candy || {}) };
  const specials = DEFAULT_ABOUT_CONTENT.specials.map((d, i) => ({ ...d, ...(overrides.specials?.[i] || {}) }));

  return <AboutPageBody storyList={storyList} candy={candy} specials={specials} photoUrl={photoUrl} />;
}
