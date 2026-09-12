import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAdminLang } from "../lib/adminI18n";
import { logActivity } from "../lib/activityLog";

// Only reachable from inside the already-authenticated admin shell — the
// invite-staff edge function itself also re-checks the caller's own role
// server-side on every action (list/create/delete), so this can't be used
// to self-register or to manage staff from the outside or as non-owner.
async function callStaffFn(body) {
  const { data, error } = await supabase.functions.invoke("invite-staff", { body });
  if (error) {
    // FunctionsHttpError's own .message is a generic "non-2xx status code"
    // string — the actual reason is in the response body as JSON.
    const detail = await error.context?.json?.().catch(() => null);
    throw new Error(detail?.error || error.message);
  }
  return data;
}

export default function StaffManageModal({ currentUserId, onClose }) {
  const { t } = useAdminLang();
  const [staff, setStaff] = useState(null); // null = loading
  const [listError, setListError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");
  // Defaults to the least-privileged option — an owner has to deliberately
  // pick "owner" for a new account to get full access.
  const [role, setRole] = useState("staff");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // The overlay closes on a click that lands directly on the backdrop.
  // Plain onClick isn't enough: dragging to select text inside the panel
  // can end with the mouse released outside it, and that click's target is
  // the backdrop even though the drag started inside the form — requiring
  // the mousedown to ALSO have started on the backdrop rules that out.
  const overlayMouseDownOnSelf = useRef(false);

  useEffect(() => {
    loadStaff();
  }, []);

  async function loadStaff() {
    setListError("");
    try {
      const data = await callStaffFn({ action: "list" });
      setStaff(data.users);
    } catch (err) {
      setListError(err.message || t("staffListFailed"));
      setStaff([]);
    }
  }

  async function handleDelete(u) {
    if (!window.confirm(t("deleteStaffConfirm", u.email))) return;
    setDeletingId(u.id);
    try {
      await callStaffFn({ action: "delete", id: u.id });
      setStaff((prev) => prev.filter((x) => x.id !== u.id));
      logActivity({ action: "delete", entity: "staff", label: u.email, path: t("inviteStaffButton") });
    } catch (err) {
      window.alert(err.message || t("staffDeleteFailed"));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const created = await callStaffFn({ action: "create", email: email.trim(), password, role, note: note.trim() });
      logActivity({ action: "create", entity: "staff", label: created.email, path: t("inviteStaffButton"), details: t(role === "owner" ? "roleOwner" : "roleStaff") });
      setStaff((prev) => [...prev, created].sort((a, b) => a.email.localeCompare(b.email)));
      setEmail("");
      setPassword("");
      setRole("staff");
      setNote("");
      setShowAddForm(false);
    } catch (err) {
      setFormError(err.message || t("inviteStaffFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="admin-form-overlay"
      onMouseDown={(e) => { overlayMouseDownOnSelf.current = e.target === e.currentTarget; }}
      onClick={(e) => { if (overlayMouseDownOnSelf.current && e.target === e.currentTarget) onClose(); }}
    >
      <div className="admin-form-panel" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="admin-form-close" onClick={onClose} aria-label={t("close")}>×</button>
        <h3>{t("staffListTitle")}</h3>

        {staff === null && !listError && <p className="inventory-hint">{t("loading")}</p>}
        {listError && <p className="form-status err">{listError}</p>}

        {staff && staff.length > 0 && (
          <ul className="staff-list">
            {staff.map((u) => (
              <li key={u.id} className="staff-list-row">
                <div className="staff-list-info">
                  <div className="staff-list-info-top">
                    <span className="staff-list-email">
                      {u.email}
                      {u.id === currentUserId && <span className="staff-list-you"> ({t("staffListYou")})</span>}
                    </span>
                    <span className={`badge-select-btn staff-list-role${u.role === "owner" ? " active" : ""}`}>
                      {u.role === "owner" ? t("roleOwner") : t("roleStaff")}
                    </span>
                  </div>
                  {u.note && <span className="staff-list-note">{u.note}</span>}
                </div>
                <button
                  type="button"
                  className="menu-manager-delete btn btn-ghost btn-sm"
                  onClick={() => handleDelete(u)}
                  disabled={u.id === currentUserId || deletingId === u.id}
                  title={u.id === currentUserId ? t("staffListCantDeleteSelf") : undefined}
                >
                  {deletingId === u.id ? t("saving") : t("delete")}
                </button>
              </li>
            ))}
          </ul>
        )}

        {staff && staff.length === 0 && !listError && <p className="inventory-hint">{t("staffListEmpty")}</p>}

        {!showAddForm ? (
          <div className="menu-manager-form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>{t("close")}</button>
            <button type="button" className="btn btn-primary" onClick={() => setShowAddForm(true)}>{t("inviteStaffButton")}</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="staff-add-form">
            <div className="form-grid">
              <div className="field full">
                <label>{t("emailLabel")}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
              </div>
              <div className="field full">
                <label>{t("inviteStaffPasswordLabel")}</label>
                <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
                <p className="menu-manager-photo-hint">{t("inviteStaffPasswordHint")}</p>
              </div>
              <div className="field full">
                <label>{t("inviteStaffNoteLabel")}</label>
                <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("inviteStaffNotePlaceholder")} />
                <p className="menu-manager-photo-hint">{t("inviteStaffNoteHint")}</p>
              </div>
              <div className="field full badge-select-field">
                <label>{t("inviteStaffRoleLabel")}</label>
                <div className="badge-select">
                  {[
                    { value: "staff", label: t("roleStaff") },
                    { value: "owner", label: t("roleOwner") },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`badge-select-btn${role === opt.value ? " active" : ""}`}
                      onClick={() => setRole(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="menu-manager-photo-hint">{role === "owner" ? t("roleOwnerHint") : t("roleStaffHint")}</p>
              </div>
            </div>

            {formError && <p className="form-status err">{formError}</p>}

            <div className="menu-manager-form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowAddForm(false)} disabled={saving}>{t("cancel")}</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? t("saving") : t("inviteStaffSubmit")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
