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

// Opening hours are stored as newline-separated rows in hoursDays/hoursTime
// (line 1 of each pairs together, line 2 with line 2, etc.) so admins can
// list several day-groups — e.g. Mon–Fri, Sat–Sun, Public Holidays — without
// a schema change.
export function hoursRows(settings) {
  const days = (settings.hoursDays || "").split("\n").map((s) => s.trim()).filter(Boolean);
  const times = (settings.hoursTime || "").split("\n").map((s) => s.trim()).filter(Boolean);
  return days.map((days, i) => ({ days, time: times[i] || "" }));
}
