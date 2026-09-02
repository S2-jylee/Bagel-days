// Business info (address, hours, phone, email, socials) shown in four places
// on the site — Home's Visit Us widget, the Visit Us page, Contact Us's Get in
// Touch, and the Footer. Kept as one shared row so editing it once in Admin
// (Homepage → Footer) updates all four instead of drifting out of sync.
export function mapsDirectionsUrl(settings) {
  const q = encodeURIComponent(`${settings.addressLine1}, ${settings.addressLine2}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${q}`;
}

export function mapsViewUrl(settings) {
  const q = encodeURIComponent(`${settings.addressLine1}, ${settings.addressLine2}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export function telHref(phone) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
