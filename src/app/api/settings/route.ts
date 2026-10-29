import { NextRequest, NextResponse } from "next/server";
import { INITIAL_SETTINGS } from "@/lib/data/seed-cakes";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getAdminSupabase, getServerSupabase } from "@/lib/supabase/server";
import { isSellerUser, verifyServerSession } from "@/lib/services/server-auth";
import type { BusinessSettings } from "@/types/catalove";

const TEXT_KEYS = [
  "nav_cta_text",
  "hero_eyebrow",
  "hero_title",
  "hero_subtitle",
  "hero_primary_cta",
  "hero_secondary_cta",
  "hero_badge_1",
  "hero_badge_2",
  "hero_badge_3",
  "scroll_showcase_eyebrow",
  "scroll_showcase_desc",
  "scroll_showcase_button",
  "order_steps_eyebrow",
  "order_steps_title",
  "order_steps_desc",
  "order_step_1_title",
  "order_step_1_desc",
  "order_step_2_title",
  "order_step_2_desc",
  "order_step_3_title",
  "order_step_3_desc",
  "steps_eyebrow",
  "steps_title",
  "steps_desc",
  "step_1_title",
  "step_1_desc",
  "step_2_title",
  "step_2_desc",
  "step_3_title",
  "step_3_desc",
  "showcase_eyebrow",
  "showcase_title",
  "showcase_desc",
  "showcase_link_text",
  "story_eyebrow",
  "story_title",
  "story_p1",
  "story_p2",
  "feature_1_title",
  "feature_1_desc",
  "feature_2_title",
  "feature_2_desc",
  "feature_3_title",
  "feature_3_desc",
  "catalog_eyebrow",
  "catalog_title",
  "catalog_desc",
  "catalog_quiz_btn",
  "footer_tagline",
  "footer_desc",
  "footer_badge",
] as const;

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ settings: INITIAL_SETTINGS });
  }

  try {
    const supabase = await getAdminSupabase();
    if (!supabase) return NextResponse.json({ settings: INITIAL_SETTINGS });

    const { data, error } = await supabase
      .from("business_settings")
      .select("*")
      .eq("id", true)
      .maybeSingle();

    let content: Record<string, any> = {};

    if (data?.content_config) {
      content = typeof data.content_config === "string" ? JSON.parse(data.content_config) : data.content_config;
    }

    // Resilient fallback storage check
    if (Object.keys(content).length === 0) {
      const { data: configRow } = await supabase
        .from("categories")
        .select("description")
        .eq("slug", "__content_config__")
        .maybeSingle();

      if (configRow?.description) {
        try {
          content = JSON.parse(configRow.description);
        } catch {
          // ignore parse error
        }
      }
    }

    const textSettings: Record<string, string> = {};
    for (const key of TEXT_KEYS) {
      if (content[key] !== undefined) {
        textSettings[key] = content[key];
      } else if (data?.[key] !== undefined) {
        textSettings[key] = data[key];
      } else if ((INITIAL_SETTINGS as Record<string, any>)[key] !== undefined) {
        textSettings[key] = (INITIAL_SETTINGS as Record<string, any>)[key];
      }
    }

    const themeConfig = content.theme_config || INITIAL_SETTINGS.theme_config;
    const marquee = content.marquee_announcement || INITIAL_SETTINGS.marquee_announcement;

    return NextResponse.json({
      settings: {
        ...INITIAL_SETTINGS,
        ...textSettings,
        store_name: data?.store_name || INITIAL_SETTINGS.store_name,
        seller_whatsapp: data?.seller_whatsapp || INITIAL_SETTINGS.seller_whatsapp,
        kitchen_address: data?.kitchen_address || INITIAL_SETTINGS.store_address,
        store_address: content.store_address || data?.kitchen_address || INITIAL_SETTINGS.store_address,
        currency_symbol: content.currency_symbol || INITIAL_SETTINGS.currency_symbol,
        default_lead_time_days: Number(data?.default_lead_time_days ?? INITIAL_SETTINGS.default_lead_time_days),
        business_timezone: data?.business_timezone || INITIAL_SETTINGS.business_timezone,
        instagram_handle: data?.instagram_handle || INITIAL_SETTINGS.instagram_handle,
        tiktok_handle: content.tiktok_handle || INITIAL_SETTINGS.tiktok_handle,
        store_tagline: data?.store_tagline ?? INITIAL_SETTINGS.store_tagline,
        industry_preset: content.industry_preset || INITIAL_SETTINGS.industry_preset,
        workflow_mode: content.workflow_mode || INITIAL_SETTINGS.workflow_mode,
        theme_config: themeConfig,
        marquee_announcement: marquee,
      },
    });
  } catch {
    return NextResponse.json({ settings: INITIAL_SETTINGS });
  }
}

export async function POST(req: NextRequest) {
  // 1. Verify seller session via Supabase Auth
  const serverSupabase = await getServerSupabase();
  let isAuthorized = false;

  if (serverSupabase) {
    const {
      data: { user },
    } = await serverSupabase.auth.getUser();
    if (user && (await isSellerUser(user.id))) {
      isAuthorized = true;
    }
  }

  // 2. Also check admin_session cookie
  if (!isAuthorized) {
    const authHeader = req.cookies.get("admin_session")?.value;
    const session = await verifyServerSession(authHeader);
    if (session) isAuthorized = true;
  }

  if (!isAuthorized) {
    return NextResponse.json(
      { error: "Akses ditolak. Silakan masuk sebagai pengelola toko." },
      { status: 401 }
    );
  }

  try {
    const body = (await req.json()) as Partial<BusinessSettings>;

    const contentConfig: Record<string, any> = {};
    for (const key of TEXT_KEYS) {
      if ((body as any)[key] !== undefined) {
        contentConfig[key] = String((body as any)[key] || "").trim();
      }
    }

    if (body.theme_config) contentConfig.theme_config = body.theme_config;
    if (body.marquee_announcement) contentConfig.marquee_announcement = body.marquee_announcement;
    if (body.industry_preset) contentConfig.industry_preset = body.industry_preset;
    if (body.workflow_mode) contentConfig.workflow_mode = body.workflow_mode;
    if (body.store_address) contentConfig.store_address = body.store_address;
    if (body.currency_symbol) contentConfig.currency_symbol = body.currency_symbol;
    if (body.tiktok_handle) contentConfig.tiktok_handle = body.tiktok_handle;

    const cleanSettings = {
      store_name: String(body.store_name || "").trim(),
      seller_whatsapp: String(body.seller_whatsapp || "").trim(),
      kitchen_address: String(body.store_address || body.kitchen_address || "").trim(),
      default_lead_time_days: Math.max(0, Number(body.default_lead_time_days || 1)),
      business_timezone: String(body.business_timezone || "Asia/Jakarta").trim(),
      instagram_handle: String(body.instagram_handle || "").trim(),
      store_tagline: String(body.store_tagline || "").trim(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const supabase = await getAdminSupabase();
      if (!supabase) {
        return NextResponse.json({ error: "Koneksi database tidak tersedia" }, { status: 500 });
      }

      // Try saving with content_config
      const { error: upsertErr } = await supabase
        .from("business_settings")
        .upsert({ id: true, ...cleanSettings, content_config: contentConfig });

      if (upsertErr) {
        await supabase
          .from("business_settings")
          .upsert({ id: true, ...cleanSettings });
      }

      // Also persist to resilient storage row in categories
      await supabase.from("categories").upsert(
        {
          slug: "__content_config__",
          name: "System Content Config",
          description: JSON.stringify(contentConfig),
          is_active: false,
          display_order: 9999,
        },
        { onConflict: "slug" }
      );
    }

    return NextResponse.json({
      success: true,
      settings: { ...INITIAL_SETTINGS, ...cleanSettings, ...contentConfig },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memperbarui pengaturan toko";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
