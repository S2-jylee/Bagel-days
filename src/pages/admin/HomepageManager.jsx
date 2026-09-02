import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { usePageContent } from "../../context/PageContentContext";
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

function PageSection({ pageId, content, t }) {
  // Seeded once from the loaded row, then edited locally until Save — not kept
  // in sync with the live subscription, since page_content covers both Home
  // and Pickup in one table: any change (including this section's own Save)
  // would otherwise re-fire the subscription and wipe unsaved edits sitting
  // in the *other* section's form.
  const [form, setForm] = useState(content);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  async function handleAddPhotos(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      const urls = await Promise.all(files.map(uploadSiteImage));
      setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
    } catch (err) {
      setError(err.message || t("photoUploadFailed"));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removePhoto(idx) {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  }

  function movePhoto(idx, dir) {
    setForm((f) => {
      const j = idx + dir;
      if (j < 0 || j >= f.images.length) return f;
      const next = [...f.images];
      [next[idx], next[j]] = [next[j], next[idx]];
      return { ...f, images: next };
    });
  }

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
      <h3>{t(pageId === "home" ? "homeSectionTitle" : "pickupSectionTitle")}</h3>

      <div className="field full">
        <label>{t("titleLabel")}</label>
        <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
      </div>
      <div className="field full">
        <label>{t("taglineLabel")}</label>
        <input type="text" value={form.tagline} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))} />
      </div>
      <div className="field full">
        <label>{t("descriptionLabel")}</label>
        <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
      </div>

      <div className="field full">
        <label>{t("heroPhotos")}</label>
        <p className="menu-manager-photo-hint">{t("recommendedHeroSize")}</p>
        <p className="menu-manager-photo-hint">{t("multiplePhotosHint")}</p>

        <div className="homepage-photo-grid">
          {form.images.map((img, i) => (
            <div className="homepage-photo-thumb" key={img + i}>
              <img src={productImageUrl(img)} alt="" />
              <div className="homepage-photo-thumb-actions">
                <button type="button" onClick={() => movePhoto(i, -1)} disabled={i === 0} aria-label={t("movePhotoLeft")}><IcChevronLeft /></button>
                <button type="button" onClick={() => removePhoto(i)} aria-label={t("removePhoto")}><IcTrash /></button>
                <button type="button" onClick={() => movePhoto(i, 1)} disabled={i === form.images.length - 1} aria-label={t("movePhotoRight")}><IcChevronRight /></button>
              </div>
            </div>
          ))}
          <label className="homepage-photo-add">
            {uploading ? t("uploading") : t("addPhoto")}
            <input type="file" accept="image/*" multiple onChange={handleAddPhotos} disabled={uploading} hidden />
          </label>
        </div>
      </div>

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

export default function HomepageManager() {
  const { t } = useAdminLang();
  const { pages, loading } = usePageContent();

  if (loading) return null;

  return (
    <div>
      <div className="admin-section-header">
        <h2>{t("homepageTab")}</h2>
      </div>
      <p className="inventory-hint">{t("homepageIntro")}</p>
      {pages.home && <PageSection pageId="home" content={pages.home} t={t} />}
      {pages.pickup && <PageSection pageId="pickup" content={pages.pickup} t={t} />}
    </div>
  );
}
