import { useState } from "react";
import { asset } from "../lib/assetUrl";
import { aboutIconComponent, ABOUT_ICON_OPTIONS } from "../lib/aboutContent";
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

// A click-to-edit icon: the icon itself, plus (when editable) a pencil that
// reveals a row of swatches to pick a replacement from ABOUT_ICON_OPTIONS.
function EditableIcon({ value, onChange, editable }) {
  const [picking, setPicking] = useState(false);
  const Ic = aboutIconComponent(value);

  if (!editable) return <Ic />;

  return (
    <span className="about-editable about-editable-icon">
      <Ic />
      <button type="button" className="about-editable-pencil" onClick={() => setPicking((v) => !v)} aria-label="Change icon">
        <IcPencil />
      </button>
      {picking && (
        <span className="about-icon-picker">
          {ABOUT_ICON_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.key}
              className={opt.key === value ? "active" : ""}
              onClick={() => {
                onChange(opt.key);
                setPicking(false);
              }}
            >
              <opt.Icon />
            </button>
          ))}
        </span>
      )}
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
  onStoryIconChange,
  onStoryTextChange,
  onCandyTextChange,
  onSpecialIconChange,
  onSpecialTextChange,
  onPhotoPick,
}) {
  return (
    <>
      <section className="hero about-hero" style={{ paddingBottom: 0 }}>
        <div className="wrap about-hero-wrap">
          <div className="about-hero-badge">
            <img src={asset("/assets/images/logo-mark.jpg")} alt="" />
            <span>Bagel Days</span>
          </div>
          <div>
            <h1>About Us</h1>
            <p className="script" style={{ fontSize: "1.2rem", marginTop: 10 }}>Freshly Baked, Every Morning.</p>
          </div>
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
          <div>
            <h2>Our Story</h2>
            <p className="script" style={{ marginTop: 4, marginBottom: 16 }}>Freshly Crafted Every Morning.</p>
            <ul className="story-list">
              {storyList.map((item, i) => (
                <li key={i}>
                  <span className="ic">
                    <EditableIcon value={item.icon} editable={editable} onChange={(key) => onStoryIconChange(i, key)} />
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
            <div>
              <span className="eyebrow">Meet Candy</span>
              <h3 style={{ fontSize: "1.6rem", marginBottom: 12 }}>Our Beloved Mascot</h3>
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
                    <EditableIcon value={s.icon} editable={editable} onChange={(key) => onSpecialIconChange(i, key)} />
                  </div>
                  <EditableText value={s.num} editable={editable} tag="span" className="num" onChange={(v) => onSpecialTextChange(i, "num", v)} />
                  <EditableText value={s.title} editable={editable} tag="h4" onChange={(v) => onSpecialTextChange(i, "title", v)} />
                  <EditableText value={s.desc} editable={editable} tag="p" textarea onChange={(v) => onSpecialTextChange(i, "desc", v)} />
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
