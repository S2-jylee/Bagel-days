import { useState, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { usePageContent } from "../../context/PageContentContext";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { productImageUrl } from "../../lib/assetUrl";
import { resizeImage } from "../../lib/imageResize";
import { useAdminLang } from "../../lib/adminI18n";
import { logActivity } from "../../lib/activityLog";
import { IcChevronLeft, IcChevronRight, IcTrash } from "../../components/Icons";
import { DEFAULT_ABOUT_PHOTOS } from "../../lib/aboutPhotos";
import { DEFAULT_ABOUT_CONTENT } from "../../lib/aboutContent";
import AboutPageBody from "../../components/AboutPageBody";

const BUCKET = "site-images";
const MAX_W = 2400;

async function uploadSiteImage(file) {
  const resized = await resizeImage(file, MAX_W);
  const path = `${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, resized, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// Shared hero photo picker (add/reorder/remove), used by every page's hero
// section below.
function PhotoField({ images, onChange, uploading, setUploading, setError, t }) {
  async function handleAddPhotos(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      const urls = await Promise.all(files.map(uploadSiteImage));
      onChange([...images, ...urls]);
    } catch (err) {
      setError(err.message || t("photoUploadFailed"));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function movePhoto(idx, dir) {
    const j = idx + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  }

  function removePhoto(idx) {
    onChange(images.filter((_, i) => i !== idx));
  }

  return (
    <div className="field full">
      <label>{t("heroPhotos")}</label>
      <p className="menu-manager-photo-hint">{t("recommendedHeroSize")}</p>
      <p className="menu-manager-photo-hint">{t("multiplePhotosHint")}</p>

      <div className="homepage-photo-grid">
        {images.map((img, i) => (
          <div className="homepage-photo-thumb" key={img + i}>
            <img src={productImageUrl(img)} alt="" />
            <div className="homepage-photo-thumb-actions">
              <button type="button" onClick={() => movePhoto(i, -1)} disabled={i === 0} aria-label={t("movePhotoLeft")}><IcChevronLeft /></button>
              <button type="button" onClick={() => removePhoto(i)} aria-label={t("removePhoto")}><IcTrash /></button>
              <button type="button" onClick={() => movePhoto(i, 1)} disabled={i === images.length - 1} aria-label={t("movePhotoRight")}><IcChevronRight /></button>
            </div>
          </div>
        ))}
        <label className="homepage-photo-add">
          {uploading ? t("uploading") : t("addPhoto")}
          <input type="file" accept="image/*" multiple onChange={handleAddPhotos} disabled={uploading} hidden />
        </label>
      </div>
    </div>
  );
}

// A page's hero: title (+ optional tagline) + description + photo set, stored
// as one row in page_content. Visit's hero has no script tagline in its
// layout, so showTagline=false hides that field for it.
function PageSection({ pageId, sectionLabel, content, showTagline = true, footerNoteKey, t }) {
  // Seeded once from the loaded row, then edited locally until Save — not kept
  // in sync with the live subscription, since page_content covers every page
  // in one table: any change (including this section's own Save) would
  // otherwise re-fire the subscription and wipe unsaved edits sitting in
  // another page's form.
  const [form, setForm] = useState(content);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError("");
    const { error: err } = await supabase
      .from("page_content")
      .update({ title: form.title, tagline: form.tagline, description: form.description, images: form.images, updated_at: new Date().toISOString() })
      .eq("page_id", pageId);
    setSaving(false);
    if (err) {
      setError(err.message || t("saveFailed"));
      return;
    }
    logActivity({ action: "update", entity: "homepage_section", label: sectionLabel, path: t("homepageTab") });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  }

  return (
    <div className="homepage-section">
      <div className="field full">
        <label>{t("titleLabel")}</label>
        <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
      </div>
      {showTagline && (
        <div className="field full">
          <label>{t("taglineLabel")}</label>
          <input type="text" value={form.tagline} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))} />
        </div>
      )}
      <div className="field full">
        <label>{t("descriptionLabel")}</label>
        <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
      </div>

      <PhotoField
        images={form.images}
        onChange={(images) => setForm((f) => ({ ...f, images }))}
        uploading={uploading}
        setUploading={setUploading}
        setError={setError}
        t={t}
      />

      {footerNoteKey && <p className="homepage-hint">{t(footerNoteKey)}</p>}

      {error && <p className="form-status err">{error}</p>}

      <div className="menu-manager-form-actions">
        {savedFlash && <span className="form-status ok">{t("saved")}</span>}
        <button type="button" className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving || uploading}>
          {saving ? t("saving") : t("saveChanges")}
        </button>
      </div>
    </div>
  );
}

// About's live layout, reused directly from the public page (AboutPageBody)
// so this preview can't drift out of sync with what visitors actually see —
// each editable bit (icon, text, photo) gets a small pencil affordance
// in-place, saving straight to the "about" page_content row immediately on
// change (like a category's icon picker) rather than needing a separate
// Save Changes click, which was easy to miss on a page with no other save
// button in view.
function AboutSection({ content, t }) {
  const [photos, setPhotos] = useState(content.aboutPhotos || {});
  const [overrides, setOverrides] = useState(content.aboutContent || {});
  const photosRef = useRef(photos);
  const overridesRef = useRef(overrides);
  const [busySlot, setBusySlot] = useState(null);
  const [error, setError] = useState("");

  async function savePhotos(next) {
    photosRef.current = next;
    setPhotos(next);
    const { error: err } = await supabase
      .from("page_content")
      .update({ about_photos: next, updated_at: new Date().toISOString() })
      .eq("page_id", "about");
    if (err) {
      setError(err.message || t("saveFailed"));
      return false;
    }
    logActivity({ action: "update", entity: "homepage_section", label: t("aboutSectionTitle"), path: t("homepageTab") });
    return true;
  }

  async function saveContent(next) {
    overridesRef.current = next;
    setOverrides(next);
    const { error: err } = await supabase
      .from("page_content")
      .update({ about_content: next, updated_at: new Date().toISOString() })
      .eq("page_id", "about");
    if (err) {
      setError(err.message || t("saveFailed"));
      return false;
    }
    logActivity({ action: "update", entity: "homepage_section", label: t("aboutSectionTitle"), path: t("homepageTab") });
    return true;
  }

  // Only the one changed field is patched onto that index's existing
  // override (not a full merged copy) — keeps the stored JSON to just the
  // deltas from DEFAULT_ABOUT_CONTENT, computed fresh from overridesRef so
  // two quick edits in a row can't clobber each other.
  function patchArrayItem(section, index, field, value) {
    const current = overridesRef.current;
    const arr = Array.isArray(current[section]) ? [...current[section]] : [];
    arr[index] = { ...(arr[index] || {}), [field]: value };
    return { ...current, [section]: arr };
  }

  async function handlePhotoPick(slot, file) {
    setBusySlot(slot);
    setError("");
    try {
      const url = await uploadSiteImage(file);
      await savePhotos({ ...photosRef.current, [slot]: url });
    } catch (err) {
      setError(err.message || t("photoUploadFailed"));
    } finally {
      setBusySlot(null);
    }
  }

  // Icons upload-to-override the same way a category's icon does in Menu
  // admin (default line icon unless a custom image is set) — stored as
  // iconUrl on that array item's override, alongside its text fields.
  async function handleIconPick(section, index, file) {
    const busyKey = `${section === "storyList" ? "story" : "special"}-icon-${index}`;
    setBusySlot(busyKey);
    setError("");
    try {
      const url = await uploadSiteImage(file);
      await saveContent(patchArrayItem(section, index, "iconUrl", url));
    } catch (err) {
      setError(err.message || t("photoUploadFailed"));
    } finally {
      setBusySlot(null);
    }
  }

  const storyList = DEFAULT_ABOUT_CONTENT.storyList.map((d, i) => ({ ...d, ...(overrides.storyList?.[i] || {}) }));
  const candy = { ...DEFAULT_ABOUT_CONTENT.candy, ...(overrides.candy || {}) };
  const specials = DEFAULT_ABOUT_CONTENT.specials.map((d, i) => ({ ...d, ...(overrides.specials?.[i] || {}) }));

  return (
    <div className="homepage-section about-editor">
      <p className="homepage-hint">{t("aboutPhotosIntro")}</p>
      {error && <p className="form-status err">{error}</p>}

      <div className="about-editor-preview">
        <AboutPageBody
          storyList={storyList}
          candy={candy}
          specials={specials}
          photoUrl={(slot) => productImageUrl(photos[slot] || DEFAULT_ABOUT_PHOTOS[slot])}
          editable
          busySlot={busySlot}
          onStoryIconPick={(i, f) => handleIconPick("storyList", i, f)}
          onStoryTextChange={(i, field, v) => saveContent(patchArrayItem("storyList", i, field, v))}
          onCandyTextChange={(field, v) => saveContent({ ...overridesRef.current, candy: { ...(overridesRef.current.candy || {}), [field]: v } })}
          onSpecialIconPick={(i, f) => handleIconPick("specials", i, f)}
          onSpecialTextChange={(i, field, v) => saveContent(patchArrayItem("specials", i, field, v))}
          onPhotoPick={handlePhotoPick}
        />
      </div>
    </div>
  );
}

// The shared business info (address, hours, find-us blurb, phone, email,
// socials) behind Home's Visit Us widget, the Visit Us page, Contact Us's
// Get in Touch, and the Footer — one row, edited from here, so it can't drift
// out of sync between the four places it's shown.
function BusinessInfoSection({ settings, t }) {
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  function field(key) {
    return { value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) };
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    const { error: err } = await supabase
      .from("site_settings")
      .update({
        address_line1: form.addressLine1,
        address_line2: form.addressLine2,
        hours_days: form.hoursDays,
        hours_time: form.hoursTime,
        find_us_text: form.findUsText,
        phone: form.phone,
        email: form.email,
        instagram_url: form.instagramUrl,
        instagram_handle: form.instagramHandle,
        tiktok_url: form.tiktokUrl,
        tiktok_handle: form.tiktokHandle,
        facebook_url: form.facebookUrl,
        facebook_handle: form.facebookHandle,
        updated_at: new Date().toISOString(),
      })
      .eq("id", "global");
    setSaving(false);
    if (err) {
      setError(err.message || t("saveFailed"));
      return;
    }
    logActivity({ action: "update", entity: "business_info", label: t("footerSectionTitle"), path: t("homepageTab") });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  }

  return (
    <div className="homepage-section">
      <p className="homepage-hint">{t("businessInfoIntro")}</p>

      <h4 className="homepage-subheading">{t("addressLabel")}</h4>
      <p className="homepage-affects">{t("addressAffects")}</p>
      <div className="form-grid">
        <div className="field"><label>{t("addressLine1Label")}</label><input type="text" {...field("addressLine1")} /></div>
        <div className="field"><label>{t("addressLine2Label")}</label><input type="text" {...field("addressLine2")} /></div>
      </div>

      <h4 className="homepage-subheading">{t("openingHoursLabel")}</h4>
      <p className="homepage-affects">{t("hoursAffects")}</p>
      <div className="form-grid">
        <div className="field"><label>{t("hoursDaysLabel")}</label><input type="text" {...field("hoursDays")} /></div>
        <div className="field"><label>{t("hoursTimeLabel")}</label><input type="text" {...field("hoursTime")} /></div>
      </div>

      <h4 className="homepage-subheading">{t("findUsLabel")}</h4>
      <p className="homepage-affects">{t("findUsAffects")}</p>
      <div className="field full"><textarea rows={2} {...field("findUsText")} /></div>

      <h4 className="homepage-subheading">{t("contactLabel")}</h4>
      <p className="homepage-affects">{t("contactAffects")}</p>
      <div className="form-grid">
        <div className="field"><label>{t("phoneLabel")}</label><input type="text" {...field("phone")} /></div>
        <div className="field"><label>{t("emailLabel")}</label><input type="email" {...field("email")} /></div>
      </div>

      <h4 className="homepage-subheading">{t("socialLinksLabel")}</h4>
      <p className="homepage-affects">{t("socialAffects")}</p>
      <div className="form-grid">
        <div className="field"><label>Instagram URL</label><input type="text" {...field("instagramUrl")} /></div>
        <div className="field"><label>Instagram {t("handleLabel")}</label><input type="text" {...field("instagramHandle")} /></div>
        <div className="field"><label>TikTok URL</label><input type="text" {...field("tiktokUrl")} /></div>
        <div className="field"><label>TikTok {t("handleLabel")}</label><input type="text" {...field("tiktokHandle")} /></div>
        <div className="field"><label>Facebook URL</label><input type="text" {...field("facebookUrl")} /></div>
        <div className="field"><label>Facebook {t("handleLabel")}</label><input type="text" {...field("facebookHandle")} /></div>
      </div>

      {error && <p className="form-status err">{error}</p>}

      <div className="menu-manager-form-actions">
        {savedFlash && <span className="form-status ok">{t("saved")}</span>}
        <button type="button" className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
          {saving ? t("saving") : t("saveChanges")}
        </button>
      </div>
    </div>
  );
}

const SUB_TABS = [
  { id: "home", labelKey: "homeSectionTitle" },
  { id: "about", labelKey: "aboutSectionTitle" },
  { id: "pickup", labelKey: "pickupSectionTitle" },
  { id: "visit", labelKey: "visitSectionTitle" },
  { id: "contact", labelKey: "contactSectionTitle" },
  { id: "footer", labelKey: "footerSectionTitle" },
];

export default function HomepageManager() {
  const { t } = useAdminLang();
  const { pages, loading: pagesLoading } = usePageContent();
  const { settings, loading: settingsLoading } = useSiteSettings();
  const [subTab, setSubTab] = useState("home");

  if (pagesLoading || settingsLoading) return null;

  return (
    <div>
      <div className="admin-section-header">
        <h2>{t("homepageTab")}</h2>
      </div>
      <p className="homepage-hint">{t("homepageIntro")}</p>

      <div className="homepage-subtabs">
        {SUB_TABS.map((tab) => (
          <button key={tab.id} className={subTab === tab.id ? "active" : ""} onClick={() => setSubTab(tab.id)}>
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {subTab === "home" && pages.home && <PageSection key="home" pageId="home" sectionLabel={t("homeSectionTitle")} content={pages.home} footerNoteKey="homeBusinessInfoNote" t={t} />}
      {subTab === "about" && pages.about && <AboutSection key="about" content={pages.about} t={t} />}
      {subTab === "pickup" && pages.pickup && <PageSection key="pickup" pageId="pickup" sectionLabel={t("pickupSectionTitle")} content={pages.pickup} t={t} />}
      {subTab === "visit" && pages.visit && (
        <PageSection key="visit" pageId="visit" sectionLabel={t("visitSectionTitle")} content={pages.visit} showTagline={false} footerNoteKey="visitBusinessInfoNote" t={t} />
      )}
      {subTab === "contact" && pages.contact && (
        <PageSection key="contact" pageId="contact" sectionLabel={t("contactSectionTitle")} content={pages.contact} footerNoteKey="contactBusinessInfoNote" t={t} />
      )}
      {subTab === "footer" && <BusinessInfoSection key="footer" settings={settings} t={t} />}
    </div>
  );
}
