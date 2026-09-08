import { supabase } from "./supabase";

// Fire-and-forget: a failed log write shouldn't block or fail the admin
// action it's recording, so callers don't await this.
export async function logActivity({ action, entity, label, path, details }) {
  const { data } = await supabase.auth.getSession();
  const actor_email = data?.session?.user?.email || "unknown";
  const { error } = await supabase
    .from("admin_activity_log")
    .insert({ actor_email, action, entity, label, path, details: details || null });
  if (error) console.error("Failed to log admin activity:", error);
}
