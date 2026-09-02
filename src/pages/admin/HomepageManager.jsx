import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { usePageContent } from "../../context/PageContentContext";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { productImageUrl } from "../../lib/assetUrl";
import { useAdminLang } from "../../lib/adminI18n";
import { IcChevronLeft, IcChevronRight, IcTrash } from "../../components/Icons";

const BUCKET = "site-images";
const MAX_W = 2400;

// Hero photos keep their native aspect ratio (unlike product photos, which get
// padded onto a fixed canvas) — just cap the longest edge so a phone-camera
// upload doesn't ship a multi-MB file to every visitor.
function resizeImage(file, maxW = MAX_W) {
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
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => (blob ? resolve(new File([blob], "hero.jpg", { type: "image/jpeg" })) : reject(new Error("Could not process image"))),
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

async function uploadSiteImage(file) {
  const resized = await resizeImage(file);
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
function PageSection({ pageId, content, showTagline = true, footerNoteKey, t }) {
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

      {subTab === "home" && pages.home && <PageSection key="home" pageId="home" content={pages.home} footerNoteKey="homeBusinessInfoNote" t={t} />}
      {subTab === "pickup" && pages.pickup && <PageSection key="pickup" pageId="pickup" content={pages.pickup} t={t} />}
      {subTab === "visit" && pages.visit && (
        <PageSection key="visit" pageId="visit" content={pages.visit} showTagline={false} footerNoteKey="visitBusinessInfoNote" t={t} />
      )}
      {subTab === "contact" && pages.contact && (
        <PageSection key="contact" pageId="contact" content={pages.contact} footerNoteKey="contactBusinessInfoNote" t={t} />
      )}
      {subTab === "footer" && <BusinessInfoSection key="footer" settings={settings} t={t} />}
    </div>
  );
}
