import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const SiteSettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  addressLine1: "",
  addressLine2: "",
  hoursDays: "",
  hoursTime: "",
  findUsText: "",
  phone: "",
  email: "",
  instagramUrl: "",
  instagramHandle: "",
  tiktokUrl: "",
  tiktokHandle: "",
  facebookUrl: "",
  facebookHandle: "",
};

function fromRow(row) {
  if (!row) return DEFAULT_SETTINGS;
  return {
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    hoursDays: row.hours_days,
    hoursTime: row.hours_time,
    findUsText: row.find_us_text,
    phone: row.phone,
    email: row.email,
    instagramUrl: row.instagram_url,
    instagramHandle: row.instagram_handle,
    tiktokUrl: row.tiktok_url,
    tiktokHandle: row.tiktok_handle,
    facebookUrl: row.facebook_url,
    facebookHandle: row.facebook_handle,
  };
}

async function fetchSettings() {
  const { data } = await supabase.from("site_settings").select("*").eq("id", "global").maybeSingle();
  return fromRow(data);
}

export function SiteSettingsProvider({ children }) {
  const [state, setState] = useState({ settings: DEFAULT_SETTINGS, loading: true });

  useEffect(() => {
    let cancelled = false;

    function reload() {
      fetchSettings().then((settings) => {
        if (!cancelled) setState({ settings, loading: false });
      });
    }
    reload();

    const channel = supabase
      .channel("site-settings-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, reload)
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return <SiteSettingsContext.Provider value={state}>{children}</SiteSettingsContext.Provider>;
}

// { settings: {addressLine1, addressLine2, hoursDays, hoursTime, findUsText, phone, email, instagramUrl, instagramHandle, tiktokUrl, tiktokHandle, facebookUrl, facebookHandle}, loading }
export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) throw new Error("useSiteSettings must be used within SiteSettingsProvider");
  return ctx;
}
