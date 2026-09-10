import { useEffect, useState } from "react";
import { asset, productImageUrl } from "../lib/assetUrl";
import { aboutIconComponent } from "../lib/aboutContent";
import { IcPencil, IcPlus, IcTrash, IcChevronLeft, IcChevronRight } from "./Icons";

// A click-to-edit text field: plain text by default, a pencil button turns
// it into an input (or textarea for longer fields) that saves on blur/Enter.
// Renders as a plain <span>/<p> with no button at all when not editable —
// the public About page passes editable=false, so none of this shows there.
function EditableText({ value, onChange, editable, tag = "span", className, textarea, placeholder }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (!editable) {
    const Tag = tag;
    return <Tag className={className}>{value}</Tag>;
  }

  function commit() {
    setEditing(false);
    if (draft !== value) onChange(draft);
  }

  if (editing) {
    const commonProps = {
      autoFocus: true,
      value: draft,
      onChange: (e) => setDraft(e.target.value),
      onBlur: commit,
      className: "about-editable-input",
      placeholder,
    };
    return textarea ? (
      <textarea {...commonProps} rows={2} onKeyDown={(e) => e.key === "Enter" && e.metaKey && commit()} />
    ) : (
      <input {...commonProps} type="text" onKeyDown={(e) => e.key === "Enter" && commit()} />
    );
  }

  const Tag = tag;
  return (
    <span className="about-editable">
      <Tag className={className}>{value || <em className="about-editable-empty">{placeholder}</em>}</Tag>
      <button type="button" className="about-editable-pencil" onClick={() => setEditing(true)} aria-label="Edit">
        <IcPencil />
      </button>
    </span>
  );
}

// **wrapped like this** renders as a bold lead-in, everything else plain —
// lets a story-list item keep that styling while still being stored (and
// edited) as one single string instead of two separate lead/rest fields.
function parseStoryText(text) {
  const parts = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(<strong key={m.index}>{m[1]}</strong>);
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

// A story-list item's whole line (bold lead-in + rest) as one editable
// region — a single pencil edits the full **markup**-annotated string in
// one textarea, instead of two separate lead/rest fields side by side.
function EditableStoryText({ value, onChange, editable }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (!editable) return <>{parseStoryText(value)}</>;

  function commit() {
    setEditing(false);
    if (draft !== value) onChange(draft);
  }

  if (editing) {
    return (
      <textarea
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        className="about-editable-input"
        rows={3}
        placeholder="Wrap a lead-in phrase in **double asterisks** to bold it"
      />
    );
  }

  return (
    <span className="about-editable">
      <span>{parseStoryText(value)}</span>
      <button type="button" className="about-editable-pencil" onClick={() => setEditing(true)} aria-label="Edit">
        <IcPencil />
      </button>
    </span>
  );
}

// A click-to-edit icon: the default line icon, or an admin-uploaded image
// in its place — same upload-to-override pattern as a category's icon in
// Menu admin (default SVG unless a custom image URL is set), rather than
// picking from a fixed icon palette.
function EditableIcon({ value, iconUrl, onPick, editable, busy }) {
  const Ic = aboutIconComponent(value);

  if (!editable) return iconUrl ? <img src={iconUrl} alt="" className="about-icon-img" /> : <Ic />;

  return (
    <span className="about-editable about-editable-icon">
      {iconUrl ? <img src={iconUrl} alt="" className="about-icon-img" /> : <Ic />}
      <label className="about-editable-pencil" aria-label="Upload icon">
        {busy ? <span className="about-editable-photo-busy" /> : <IcPencil />}
        <input type="file" accept="image/*" hidden disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) onPick(f); }} />
      </label>
    </span>
  );
}

// A photo with a pencil overlay (editable mode only) that opens a file
// picker; the actual upload is done by the caller (onPick receives the
// raw File, not a URL — the admin wrapper owns Supabase Storage access).
function EditablePhoto({ src, alt, className, onPick, busy }) {
  if (!onPick) return <img src={src} alt={alt} className={className} />;
  return (
    <span className="about-editable-photo">
      <img src={src} alt={alt} className={className} />
      <label className="about-editable-photo-pencil" aria-label="Change photo">
        {busy ? <span className="about-editable-photo-busy" /> : <IcPencil />}
        <input type="file" accept="image/*" hidden disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) onPick(f); }} />
      </label>
    </span>
  );
}

// Meet Candy's photo, specifically: unlike every other About slot (one
// fixed photo), this one can hold several — prev/next arrows wrap around
// infinitely ((i +/- 1 + length) % length, same technique as
// HeroCarousel) instead of stopping at the ends. In admin mode, a plus
// button adds another photo and a trash button removes whichever one is
// currently showing (only once there's more than one, so the slot can
// never end up with none).
function EditableCandyCarousel({ photos, className, editable, busy, onAdd, onRemove }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index >= photos.length) setIndex(0);
  }, [photos.length, index]);

  const clamped = Math.min(index, photos.length - 1);
  const current = productImageUrl(photos[clamped]);

  return (
    <span className="about-candy-carousel">
      <img src={current} alt="Candy the Bagel Days mascot" className={className} />
      {photos.length > 1 && (
        <>
          <button
            type="button"
            className="about-candy-arrow about-candy-arrow-prev"
            onClick={() => setIndex((i) => (i - 1 + photos.length) % photos.length)}
            aria-label="Previous photo"
          >
            <IcChevronLeft />
          </button>
          <button
            type="button"
            className="about-candy-arrow about-candy-arrow-next"
            onClick={() => setIndex((i) => (i + 1) % photos.length)}
            aria-label="Next photo"
          >
            <IcChevronRight />
          </button>
          <div className="about-candy-dots">
            {photos.map((_, i) => (
              <span key={i} className={`about-candy-dot${i === clamped ? " active" : ""}`} />
            ))}
          </div>
        </>
      )}
      {editable && (
        <div className="about-candy-admin-actions">
          <label className="about-editable-photo-pencil" aria-label="Add a photo">
            {busy ? <span className="about-editable-photo-busy" /> : <IcPlus />}
            <input type="file" accept="image/*" hidden disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) onAdd(f); }} />
          </label>
          {photos.length > 1 && (
            <button
              type="button"
              className="about-editable-photo-pencil about-candy-remove"
              onClick={() => onRemove(clamped)}
              aria-label="Remove this photo"
            >
              <IcTrash />
            </button>
          )}
        </div>
      )}
    </span>
  );
}

// The full About page body (everything the header down), shared between the
// public page (src/pages/About.jsx, editable=false) and the admin's
// Homepage > About tab (editable=true) — the same component tree guarantees
// admin's preview genuinely matches what visitors see, not a hand-built
// lookalike that could drift out of sync with it. Change handlers are only
// required in editable mode.
export default function AboutPageBody({
  storyList,
  candy,
  candyPhotos,
  specials,
  photoUrl,
  editable = false,
  busySlot,
  onStoryIconPick,
  onStoryTextChange,
  onCandyTextChange,
  onCandyPhotoAdd,
  onCandyPhotoRemove,
  onSpecialIconPick,
  onSpecialTextChange,
  onPhotoPick,
}) {
  return (
    <>
      <section className="hero about-hero">
        <div className="wrap about-hero-wrap">
          <h1>About Us</h1>
          <div className="about-hero-divider"><span /></div>
          <p className="script" style={{ fontSize: "1.2rem", marginTop: 14 }}>Freshly Baked, Every Morning.</p>
        </div>
      </section>

      <section className="split-section">
        <div className="wrap our-story-grid">
          <div className="our-story-photo">
            <EditablePhoto
              src={photoUrl("storyMain")}
              alt="Hand-rolled bagel dough"
              onPick={onPhotoPick && ((f) => onPhotoPick("storyMain", f))}
              busy={busySlot === "storyMain"}
            />
          </div>
          <div className="our-story-text">
            <h2>Our Story</h2>
            <p className="script" style={{ marginTop: 4, marginBottom: 16 }}>Freshly Crafted Every Morning.</p>
            <ul className="story-list">
              {storyList.map((item, i) => (
                <li key={i}>
                  <span className="ic">
                    <EditableIcon
                      value={item.icon}
                      iconUrl={item.iconUrl}
                      editable={editable}
                      onPick={onStoryIconPick && ((f) => onStoryIconPick(i, f))}
                      busy={busySlot === `story-icon-${i}`}
                    />
                  </span>
                  <EditableStoryText value={item.text} editable={editable} onChange={(v) => onStoryTextChange(i, "text", v)} />
                </li>
              ))}
            </ul>
          </div>
          <div className="img-duo">
            <EditablePhoto src={photoUrl("storyTop")} alt="Bagels boiling" onPick={onPhotoPick && ((f) => onPhotoPick("storyTop", f))} busy={busySlot === "storyTop"} />
            <EditablePhoto src={photoUrl("storyBottom")} alt="Bagels baking in the oven" onPick={onPhotoPick && ((f) => onPhotoPick("storyBottom", f))} busy={busySlot === "storyBottom"} />
          </div>
        </div>

        <div className="wrap">
          <div className="mascot-panel">
            <EditableCandyCarousel
              photos={candyPhotos}
              editable={editable}
              busy={busySlot === "candy"}
              onAdd={onCandyPhotoAdd}
              onRemove={onCandyPhotoRemove}
            />
            <div className="mascot-panel-text">
              <h3 style={{ marginBottom: 12 }}>Meet Candy</h3>
              <p><EditableText value={candy.p1} editable={editable} textarea onChange={(v) => onCandyTextChange("p1", v)} /></p>
              <p style={{ marginTop: 10 }}><EditableText value={candy.p2} editable={editable} textarea onChange={(v) => onCandyTextChange("p2", v)} /></p>
              <p style={{ marginTop: 10 }} className="script"><EditableText value={candy.p3} editable={editable} textarea onChange={(v) => onCandyTextChange("p3", v)} /></p>
            </div>
            <img className="mascot-panel-deco" src={asset("/assets/images/mascot-dog.png")} alt="" />
          </div>
        </div>
      </section>

      <section style={{ background: "var(--cream-alt)", borderTop: "1px solid var(--line)" }}>
        <div className="wrap">
          <div className="section-head center">
            <h2>What Makes Bagel Days Special</h2>
          </div>
          <div className="special-grid">
            {specials.map((s, i) => (
              <div className="special-item" key={i}>
                <div className="special-item-text">
                  <div className="special-item-icon">
                    <EditableIcon
                      value={s.icon}
                      iconUrl={s.iconUrl}
                      editable={editable}
                      onPick={onSpecialIconPick && ((f) => onSpecialIconPick(i, f))}
                      busy={busySlot === `special-icon-${i}`}
                    />
                  </div>
                  <div className="special-item-copy">
                    <EditableText value={s.num} editable={editable} tag="span" className="num" onChange={(v) => onSpecialTextChange(i, "num", v)} />
                    <EditableText value={s.title} editable={editable} tag="h4" onChange={(v) => onSpecialTextChange(i, "title", v)} />
                    <EditableText value={s.desc} editable={editable} tag="p" textarea onChange={(v) => onSpecialTextChange(i, "desc", v)} />
                  </div>
                </div>
                <div className="thumb">
                  <EditablePhoto src={photoUrl(s.slot)} alt={s.title} onPick={onPhotoPick && ((f) => onPhotoPick(s.slot, f))} busy={busySlot === s.slot} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
