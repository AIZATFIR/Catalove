import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getBrowserSupabase } from "@/lib/supabase/client";

export interface AdminUser {
  id: string;
  email: string;
  role: "owner" | "admin";
}

const DEFAULT_ADMIN_EMAIL = "mama@sofizcake.com";
const DEFAULT_ADMIN_PASS = "sofizcake2026";

export class AuthService {
  async verifySession(token?: string | null): Promise<AdminUser | null> {
    if (!isSupabaseConfigured()) {
      if (token === "demo_seller_session_valid" || token === "logged_in") {
        return {
          id: "owner-1",
          email: DEFAULT_ADMIN_EMAIL,
          role: "owner",
        };
      }
      return null;
    }

    try {
      const browser = getBrowserSupabase();
      if (!browser) return null;

      const { data: { user }, error } = await browser.auth.getUser();
      if (error || !user) return null;

      return {
        id: user.id,
        email: user.email || DEFAULT_ADMIN_EMAIL,
        role: "owner",
      };
    } catch {
      return null;
    }
  }

  async login(password: string, email?: string): Promise<{ success: boolean; token?: string; error?: string; user?: any }> {
    const targetEmail = (email || DEFAULT_ADMIN_EMAIL).trim();

    if (!isSupabaseConfigured()) {
      if (password === DEFAULT_ADMIN_PASS || password === "admin" || password === "123456") {
        return {
          success: true,
          token: "demo_seller_session_valid",
          user: { id: "owner-1", email: targetEmail },
        };
      }
      return {
        success: false,
        error: "Kata sandi salah. Gunakan sandi dapur SofizCake.",
      };
    }

    try {
      const browser = getBrowserSupabase();
      if (!browser) {
        return { success: false, error: "Koneksi Supabase browser tidak aktif" };
      }

      const { data, error } = await browser.auth.signInWithPassword({
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

      return {
        success: true,
        token: data.session.access_token,
        user: data.user,
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
