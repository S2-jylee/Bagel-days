import { useEffect, useState } from "react";
import { productImageUrl } from "../lib/assetUrl";
import { IcChevronLeft, IcChevronRight } from "./Icons";

// Renders one hero photo at a time, with prev/next arrows (and dots) when
// more than one photo is registered. Meant to sit as a direct child of a
// position:relative wrap (e.g. .hero-fit-wrap) so the overlay controls can
// position themselves against it.
export default function HeroCarousel({ images, alt = "", imgClassName, imgStyle }) {
  const [index, setIndex] = useState(0);

  // Clamp back onto a valid slide if admin removes photos out from under it.
  useEffect(() => {
    if (index >= images.length) setIndex(0);
  }, [images.length, index]);

  if (images.length === 0) return null;

  const current = images[Math.min(index, images.length - 1)];

  return (
    <>
      <img className={imgClassName} src={productImageUrl(current)} alt={alt} aria-hidden={alt ? undefined : "true"} style={imgStyle} />
      {images.length > 1 && (
        <>
          <button
            type="button"
            className="hero-carousel-arrow hero-carousel-arrow-prev"
            onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
            aria-label="Previous photo"
          >
            <IcChevronLeft />
          </button>
          <button
            type="button"
            className="hero-carousel-arrow hero-carousel-arrow-next"
            onClick={() => setIndex((i) => (i + 1) % images.length)}
            aria-label="Next photo"
          >
            <IcChevronRight />
          </button>
          <div className="hero-carousel-dots">
            {images.map((_, i) => (
              <span key={i} className={`hero-carousel-dot${i === index ? " active" : ""}`} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
