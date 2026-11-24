"use client";

import { useEffect, useState } from "react";
import { readBusinessSettings, fetchBusinessSettings } from "@/lib/business-settings";
import type { BusinessSettings } from "@/types/bakery";

export function useBusinessSettings() {
  const [settings, setSettings] = useState<BusinessSettings>(() => readBusinessSettings());

  useEffect(() => {
    const refresh = () => setSettings(readBusinessSettings());
    refresh();

    // Fetch latest persisted settings from database
    fetchBusinessSettings().then((latest) => {
      if (latest) setSettings(latest);
    });

    window.addEventListener("storage", refresh);
    window.addEventListener("catalove-settings-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("catalove-settings-change", refresh);
    };
  }, []);

  return settings;
}
