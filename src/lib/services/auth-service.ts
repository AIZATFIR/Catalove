import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getBrowserSupabase } from "@/lib/supabase/client";

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

      const { error } = await browser.auth.signInWithPassword({
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

      return {
        success: true,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat masuk";
      return { success: false, error: msg };
    }
  }

  async logout(): Promise<void> {
    if (isSupabaseConfigured()) {
      const browser = getBrowserSupabase();
      if (browser) {
        await browser.auth.signOut();
      }
    }
  }
}

export const authService = new AuthService();
