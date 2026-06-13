import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type CouponPreview = {
  code: string;
  discountType: "PERCENT" | "FLAT";
  value: number;
  discount: number;
};

async function loadValidCoupon(supabase: any, codeRaw: string, subtotal: number) {
  const code = codeRaw.trim().toUpperCase();
  const { data, error } = await supabase
    .from("coupons")
    .select("code,discount_type,value,max_uses,used_count,min_amount,expires_at,active")
    .ilike("code", code)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || !data.active) throw new Error("Invalid coupon");
  if (data.expires_at && new Date(data.expires_at) < new Date()) throw new Error("Coupon expired");
  if (data.max_uses !== null && data.used_count >= data.max_uses) throw new Error("Coupon limit reached");
  if (subtotal < Number(data.min_amount)) throw new Error(`Minimum order ₹${Number(data.min_amount).toFixed(0)} required`);
  const discount = data.discount_type === "PERCENT"
    ? +(subtotal * Number(data.value) / 100).toFixed(2)
    : Math.min(subtotal, Number(data.value));
  return {
    code: data.code as string,
    discountType: data.discount_type as "PERCENT" | "FLAT",
    value: Number(data.value),
    discount,
  };
}

export const validateCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    code: z.string().min(1).max(40),
    subtotal: z.number().nonnegative(),
  }).parse(input))
  .handler(async ({ data, context }): Promise<CouponPreview> => {
    return await loadValidCoupon(context.supabase, data.code, data.subtotal);
  });

export { loadValidCoupon };

// Admin CRUD
export const listCoupons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("coupons").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { coupons: data ?? [] };
  });

export const createCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    code: z.string().min(2).max(40).regex(/^[A-Z0-9_-]+$/i),
    discountType: z.enum(["PERCENT", "FLAT"]),
    value: z.number().positive(),
    maxUses: z.number().int().positive().nullable().optional(),
    minAmount: z.number().nonnegative().default(0),
    expiresAt: z.string().datetime().nullable().optional(),
    active: z.boolean().default(true),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    if (data.discountType === "PERCENT" && data.value > 100) throw new Error("Percent must be ≤ 100");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("coupons").insert({
      code: data.code.toUpperCase(),
      discount_type: data.discountType,
      value: data.value,
      max_uses: data.maxUses ?? null,
      min_amount: data.minAmount ?? 0,
      expires_at: data.expiresAt ?? null,
      active: data.active,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid(), active: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("coupons").update({ active: data.active }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("coupons").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
