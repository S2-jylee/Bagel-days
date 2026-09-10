import { useState } from "react";
import { asset } from "../lib/assetUrl";
import { aboutIconComponent } from "../lib/aboutContent";
import { IcPencil } from "./Icons";

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

// The full About page body (everything the header down), shared between the
// public page (src/pages/About.jsx, editable=false) and the admin's
// Homepage > About tab (editable=true) — the same component tree guarantees
// admin's preview genuinely matches what visitors see, not a hand-built
// lookalike that could drift out of sync with it. Change handlers are only
// required in editable mode.
export default function AboutPageBody({
  storyList,
  candy,
  specials,
  photoUrl,
  editable = false,
  busySlot,
  onStoryIconPick,
  onStoryTextChange,
  onCandyTextChange,
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
                  <span>
                    <EditableText
                      value={item.lead}
                      editable={editable}
                      tag="strong"
                      placeholder="(no bold lead-in)"
                      onChange={(v) => onStoryTextChange(i, "lead", v)}
                    />{" "}
                    <EditableText
                      value={item.rest}
                      editable={editable}
                      textarea
                      placeholder="Description"
                      onChange={(v) => onStoryTextChange(i, "rest", v)}
                    />
                  </span>
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
            <EditablePhoto
              src={photoUrl("candy")}
              alt="Candy the Bagel Days mascot"
              onPick={onPhotoPick && ((f) => onPhotoPick("candy", f))}
              busy={busySlot === "candy"}
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
