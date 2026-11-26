import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { StoreOnboardingInput } from "@/lib/validators/store";
import { StoreOnboardingSchema } from "@/lib/validators/store";

const DEFAULT_ADMIN_EMAIL = "owner@catalove.id";
export class AuthService {
  async login(password: string, email?: string): Promise<{ success: boolean; error?: string }> {
    const targetEmail = (email || DEFAULT_ADMIN_EMAIL).trim();

    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: "Login pengelola belum tersedia. Hubungi administrator untuk mengatur koneksi autentikasi.",
      };
    }

    try {
      const browser = getBrowserSupabase();
      if (!browser) {
        return { success: false, error: "Koneksi Supabase browser tidak aktif" };
      }

      const { data: signInData, error } = await browser.auth.signInWithPassword({
        email: targetEmail,
        password,
      });

      if (error) {
        return {
          success: false,
          error: error.message === "Invalid login credentials"
            ? "Email atau kata sandi tidak cocok. Pastikan akun pengelola sudah didaftarkan."
            : error.message,
        };
      }

      const onboarding = StoreOnboardingSchema.safeParse(signInData.user.user_metadata?.store_onboarding);
      if (onboarding.success) {
        const onboardResponse = await fetch("/api/stores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(onboarding.data),
        });
        const onboardResult = await onboardResponse.json().catch(() => null);
        if (!onboardResponse.ok || !onboardResult?.store?.slug) {
          await browser.auth.signOut();
          return { success: false, error: onboardResult?.error || "Katalog belum berhasil disiapkan." };
        }
        try {
          window.localStorage.setItem("catalove-admin-store-slug", onboardResult.store.slug);
        } catch {
          // The session remains valid without the optional remembered store slug.
        }
      }

      let sessionCheck: Response;
      try {
        sessionCheck = await fetch("/api/auth/session", { cache: "no-store" });
      } catch {
        await browser.auth.signOut();
        return {
          success: false,
          error: "Tidak dapat memverifikasi akses pengelola. Coba lagi saat koneksi tersedia.",
        };
      }
      if (!sessionCheck.ok) {
        await browser.auth.signOut();
        return {
          success: false,
          error: "Akun ini belum memiliki akses pengelola Catalove.",
        };
      }

      const session = await sessionCheck.json().catch(() => null);
      if (typeof window !== "undefined" && typeof session?.storeSlug === "string") {
        try {
          window.localStorage.setItem("catalove-admin-store-slug", session.storeSlug);
        } catch {
          // The session remains valid without the optional remembered store slug.
        }
      }

      return {
        success: true,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat masuk";
      return { success: false, error: msg };
    }
  }

  async register(input: StoreOnboardingInput & { email: string; password: string }): Promise<{
    success: boolean;
    confirmationRequired?: boolean;
    storeSlug?: string;
    error?: string;
  }> {
    const parsed = StoreOnboardingSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message || "Data katalog tidak valid." };
    if (!isSupabaseConfigured()) return { success: false, error: "Pendaftaran katalog belum tersedia. Koneksi Catalove belum siap." };
    const browser = getBrowserSupabase();
    if (!browser) return { success: false, error: "Koneksi autentikasi belum tersedia." };

    const { data, error } = await browser.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/admin/login` : undefined,
        data: { store_onboarding: parsed.data },
      },
    });
    if (error) return { success: false, error: error.message };
    if (!data.session) return { success: true, confirmationRequired: true };

    const response = await fetch("/api/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.store?.slug) {
      await browser.auth.signOut();
      return { success: false, error: result?.error || "Akun dibuat, tetapi katalog belum berhasil disiapkan. Masuk lagi untuk mencoba ulang." };
    }
    try {
      window.localStorage.setItem("catalove-admin-store-slug", result.store.slug);
    } catch {
      // Store selection can be resolved again from the first membership.
    }
    return { success: true, storeSlug: result.store.slug };
  }

  async logout(): Promise<void> {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem("catalove-admin-store-slug");
      } catch {
        // The Supabase session is still cleared below.
      }
    }
    if (isSupabaseConfigured()) {
      const browser = getBrowserSupabase();
      if (browser) {
        await browser.auth.signOut();
      }
    }
  }
}

export const authService = new AuthService();
