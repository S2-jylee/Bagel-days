import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAdminLang } from "../lib/adminI18n";
import { logActivity } from "../lib/activityLog";

// Only reachable from inside the already-authenticated admin shell — the
// invite-staff edge function itself also requires a valid session token
// (verify_jwt), so this can't be used to self-register from the outside.
export default function InviteStaffModal({ onClose }) {
  const { t } = useAdminLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Defaults to the least-privileged option — an owner has to deliberately
  // pick "owner" for a new account to get full access.
  const [role, setRole] = useState("staff");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const { error: err } = await supabase.functions.invoke("invite-staff", {
      body: { email: email.trim(), password, role },
    });
    setSaving(false);
    if (err) {
      // FunctionsHttpError's own .message is a generic "non-2xx status
      // code" string — the actual reason (e.g. "already registered") is in
      // the response body this function returns as JSON.
      const detail = await err.context?.json?.().catch(() => null);
      setError(detail?.error || err.message || t("inviteStaffFailed"));
      return;
    }
    logActivity({ action: "create", entity: "staff", label: email.trim(), path: t("inviteStaffButton"), details: t(role === "owner" ? "roleOwner" : "roleStaff") });
    setDone(true);
  }

  return (
    <div className="admin-form-overlay" onClick={onClose}>
      <div className="admin-form-panel" onClick={(e) => e.stopPropagation()}>
        <h3>{t("inviteStaffTitle")}</h3>

        {done ? (
          <>
            <p className="form-status ok">{t("inviteStaffSuccess", email)}</p>
            <div className="menu-manager-form-actions">
              <button type="button" className="btn btn-primary" onClick={onClose}>{t("close")}</button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
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
              <div className="field full badge-select-field">
                <label>{t("inviteStaffRoleLabel")}</label>
                <div className="badge-select">
                  {[
                    { value: "staff", label: t("roleStaff"), hint: t("roleStaffHint") },
                    { value: "owner", label: t("roleOwner"), hint: t("roleOwnerHint") },
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

            {error && <p className="form-status err">{error}</p>}

            <div className="menu-manager-form-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>{t("cancel")}</button>
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
