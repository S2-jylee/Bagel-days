import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

export function useStaffAuth() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error;
  }, []);

  const signOut = useCallback(() => supabase.auth.signOut(), []);

  // Accounts created before roles existed (or via the Supabase dashboard,
  // with no role set) default to "owner" — only an explicit role:"staff"
  // in app_metadata (set server-side, never by the client) narrows access.
  const role = session?.user?.app_metadata?.role ?? "owner";

  return { session, role, loading: session === undefined, signIn, signOut };
}
