"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getStoreSlugFromPath, isTenantStorefrontPath } from "@/lib/store-routing";

/** Storefront editing is available only to the authenticated owner of a tenant store. */
export function useStorefrontEditorAccess() {
  const pathname = usePathname() || "/";
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    if (!isTenantStorefrontPath(pathname)) {
      setCanEdit(false);
      return;
    }

    let cancelled = false;
    setCanEdit(false);
    const storeSlug = getStoreSlugFromPath(pathname);

    fetch(`/api/auth/session?storeSlug=${encodeURIComponent(storeSlug)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json() as Promise<{ authorized?: boolean; storeSlug?: string }>;
      })
      .then((session) => {
        if (!cancelled) {
          setCanEdit(session?.authorized === true && session.storeSlug === storeSlug);
        }
      })
      .catch(() => {
        if (!cancelled) setCanEdit(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return canEdit;
}
