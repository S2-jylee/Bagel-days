// Client-side resize, aspect ratio preserved (no cropping/padding) — used for
// any upload that just needs its longest edge capped before going to Storage
// (hero photos, category icons). Product photos are the exception: they get
// padded onto a fixed white canvas instead (see MenuManager's own
// normalizeToWhiteCanvas), since a mixed-ratio product grid looks jagged.
//
// Defaults to flattening onto opaque JPEG (bgColor fills any transparent area
// first, otherwise it would render black — JPEG has no alpha channel). Pass
// format:"image/png" to keep transparency instead — needed for category icons,
// which sit on a button whose own background changes (transparent normally,
// tan when active), so a flat baked-in fill color would only ever match one
// of those states; a transparent icon blends into all of them like the
// hand-coded SVG icons already do.
//
// upscale:true lets the canvas render an image LARGER than its source pixel
// dimensions instead of only ever shrinking it — needed for icon uploads,
// since an uploaded SVG (e.g. a 24x24-declared Lucide icon) is vector, not a
// fixed grid of pixels: drawImage re-renders it crisply at whatever target
// size the canvas asks for, so capping at "never upscale" was leaving these
// icons rasterized at their tiny declared size (24x24) and then stretched
// blurry by CSS at display time. Left off (default) for photos, where the
// source genuinely is a fixed pixel grid and upscaling would only blur it.
export function resizeImage(file, maxW, { format = "image/jpeg", quality = 0.9, bgColor = format === "image/jpeg" ? "#ffffff" : null, upscale = false } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = upscale ? maxW / img.width : Math.min(1, maxW / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (bgColor) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, w, h);
      }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      const ext = format === "image/png" ? "png" : "jpg";
      canvas.toBlob(
        (blob) => (blob ? resolve(new File([blob], `image.${ext}`, { type: format })) : reject(new Error("Could not process image"))),
        format,
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image file"));
    };
    img.src = url;
  });
}
