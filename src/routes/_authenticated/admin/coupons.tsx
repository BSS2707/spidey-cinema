import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { listCoupons, createCoupon, toggleCoupon, deleteCoupon } from "@/lib/coupons.functions";
import { MagneticButton } from "@/components/MagneticButton";

export const Route = createFileRoute("/_authenticated/admin/coupons")({
  component: AdminCoupons,
});

function AdminCoupons() {
  const qc = useQueryClient();
  const list = useServerFn(listCoupons);
  const create = useServerFn(createCoupon);
  const toggle = useServerFn(toggleCoupon);
  const del = useServerFn(deleteCoupon);

  const { data } = useQuery({ queryKey: ["admin-coupons"], queryFn: () => list() });
  const coupons = data?.coupons ?? [];

  const [form, setForm] = useState({ code: "", discountType: "PERCENT" as "PERCENT" | "FLAT", value: "10", maxUses: "", minAmount: "0", expiresAt: "" });

  const createMut = useMutation({
    mutationFn: () => create({
      data: {
        code: form.code.trim().toUpperCase(),
        discountType: form.discountType,
        value: Number(form.value),
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        minAmount: Number(form.minAmount || 0),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        active: true,
      },
    }),
    onSuccess: () => {
      toast.success("Coupon created");
      setForm({ code: "", discountType: "PERCENT", value: "10", maxUses: "", minAmount: "0", expiresAt: "" });
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const toggleMut = useMutation({
    mutationFn: (vars: { id: string; active: boolean }) => toggle({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-coupons"] }),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-coupons"] }); },
  });

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-8">
      <div className="glass-card rounded-xl p-6">
        <h3 className="font-display tracking-wider text-xl mb-4">Coupons</h3>
        {coupons.length === 0 && <p className="text-muted-foreground text-sm">No coupons yet.</p>}
        <div className="space-y-3">
          {coupons.map((c: any) => (
            <div key={c.id} className="flex items-center justify-between gap-4 border border-border rounded-lg p-4">
              <div>
                <p className="font-display tracking-widest text-primary">{c.code}</p>
                <p className="text-xs text-muted-foreground">
                  {c.discount_type === "PERCENT" ? `${c.value}% off` : `₹${c.value} off`}
                  {Number(c.min_amount) > 0 && ` • min ₹${c.min_amount}`}
                  {c.max_uses && ` • ${c.used_count}/${c.max_uses} used`}
                  {!c.max_uses && ` • ${c.used_count} used`}
                  {c.expires_at && ` • exp ${new Date(c.expires_at).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleMut.mutate({ id: c.id, active: !c.active })} className={`text-xs px-3 py-1 rounded font-display tracking-wider uppercase border ${c.active ? "border-primary text-primary" : "border-muted-foreground text-muted-foreground"}`}>
                  {c.active ? "Active" : "Inactive"}
                </button>
                <button onClick={() => { if (confirm(`Delete ${c.code}?`)) delMut.mutate(c.id); }} className="text-xs text-destructive hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-xl p-6 h-fit">
        <h3 className="font-display tracking-wider text-xl mb-4">New Coupon</h3>
        <label className="text-xs text-muted-foreground">Code</label>
        <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SPIDEY10" className="w-full px-3 py-2 rounded bg-input border border-border mb-3 uppercase tracking-wider" />
        <label className="text-xs text-muted-foreground">Discount type</label>
        <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as any })} className="w-full px-3 py-2 rounded bg-input border border-border mb-3">
          <option value="PERCENT">Percent (%)</option>
          <option value="FLAT">Flat (₹)</option>
        </select>
        <label className="text-xs text-muted-foreground">Value</label>
        <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="w-full px-3 py-2 rounded bg-input border border-border mb-3" />
        <label className="text-xs text-muted-foreground">Min order (₹)</label>
        <input type="number" value={form.minAmount} onChange={(e) => setForm({ ...form, minAmount: e.target.value })} className="w-full px-3 py-2 rounded bg-input border border-border mb-3" />
        <label className="text-xs text-muted-foreground">Max uses (blank = unlimited)</label>
        <input type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} className="w-full px-3 py-2 rounded bg-input border border-border mb-3" />
        <label className="text-xs text-muted-foreground">Expires at (blank = never)</label>
        <input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="w-full px-3 py-2 rounded bg-input border border-border mb-4" />
        <MagneticButton onClick={() => createMut.mutate()} disabled={createMut.isPending || !form.code || !form.value} className="w-full">
          {createMut.isPending ? "Creating..." : "Create Coupon"}
        </MagneticButton>
      </div>
    </div>
  );
}
