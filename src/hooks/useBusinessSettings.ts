"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { readBusinessSettings, fetchBusinessSettings } from "@/lib/business-settings";
import { getStoreSlugFromPath, isTenantStorefrontPath } from "@/lib/store-routing";
import type { BusinessSettings } from "@/types/bakery";

function readSettingsForPathname(pathname: string | null): BusinessSettings {
  if (pathname && isTenantStorefrontPath(pathname)) {
    return readBusinessSettings(getStoreSlugFromPath(pathname));
  }
  return readBusinessSettings();
}

export function useBusinessSettings() {
  const pathname = usePathname();
  const [snapshot, setSnapshot] = useState(() => ({ pathname, settings: readSettingsForPathname(pathname) }));
  const settings = snapshot.pathname === pathname ? snapshot.settings : readSettingsForPathname(pathname);

  useEffect(() => {
    let active = true;
    const refresh = () => setSnapshot({ pathname, settings: readSettingsForPathname(pathname) });
    refresh();

    // Fetch latest persisted settings from database
    fetchBusinessSettings().then((latest) => {
      if (active && latest) setSnapshot({ pathname, settings: latest });
    });

    window.addEventListener("storage", refresh);
    window.addEventListener("catalove-settings-change", refresh);
    return () => {
      active = false;
      window.removeEventListener("storage", refresh);
      window.removeEventListener("catalove-settings-change", refresh);
    };
  }, [pathname]);

  return settings;
}
