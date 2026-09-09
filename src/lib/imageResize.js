// Client-side resize, aspect ratio preserved (no cropping/padding) — used for
// any upload that just needs its longest edge capped before going to Storage
// (hero photos, category icons). Product photos are the exception: they get
// padded onto a fixed white canvas instead (see MenuManager's own
// normalizeToWhiteCanvas), since a mixed-ratio product grid looks jagged.
// Output is always flattened to JPEG (no alpha channel), so any transparent
// area is filled with bgColor first — otherwise a transparent-background PNG
// (e.g. a category icon someone downloads off an icon site) would come out
// with a black background instead of blending into the page behind it.
export function resizeImage(file, maxW, bgColor = "#ffffff") {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => (blob ? resolve(new File([blob], "image.jpg", { type: "image/jpeg" })) : reject(new Error("Could not process image"))),
        "image/jpeg",
        0.9
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image file"));
    };
    img.src = url;
  });
}
