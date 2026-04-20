"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatPhone } from "@/lib/utils/formatPhone";
import type { ShopWithRelations } from "@/types/shop";

const schema = z.object({
  name: z.string().min(1, "Required"),
  address: z.string().min(1, "Required"),
  city: z.string().min(1, "Required"),
  state: z.string().length(2),
  zip: z.string().regex(/^\d{5}$/),
  phone: z.string().min(14),
  email: z.string().email(),
  google_rating: z.coerce.number().min(1).max(5).optional().nullable(),
  notes: z.string().optional(),
  mounting_balancing_per_tire: z.coerce.number().min(0),
  disposal_per_tire: z.coerce.number().min(0),
  valve_stems_per_tire: z.coerce.number().min(0),
  tpms_per_tire: z.coerce.number().min(0),
  alignment_cost: z.coerce.number().min(0).optional().nullable(),
  free_rotation: z.boolean(),
  road_hazard_per_tire: z.coerce.number().min(0).optional().nullable(),
  budget_min: z.coerce.number().min(0),
  budget_max: z.coerce.number().min(0),
  budget_brands: z.string().optional(),
  mid_min: z.coerce.number().min(0),
  mid_max: z.coerce.number().min(0),
  mid_brands: z.string().optional(),
  premium_min: z.coerce.number().min(0),
  premium_max: z.coerce.number().min(0),
  premium_brands: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const inputCls = (err?: string) =>
  `w-full h-10 px-3 rounded-lg border text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
    err ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
  }`;

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function EditShopPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [shop, setShop] = useState<ShopWithRelations | null>(null);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
  });

  useEffect(() => {
    fetch(`/api/admin/shops/${id}`)
      .then((r) => r.json())
      .then(({ shop: s }: { shop: ShopWithRelations }) => {
        if (!s) return;
        setShop(s);
        const svc = s.shop_services;
        const budget = s.shop_tire_ranges?.find((r) => r.tier === "budget");
        const mid = s.shop_tire_ranges?.find((r) => r.tier === "mid-range");
        const prem = s.shop_tire_ranges?.find((r) => r.tier === "premium");
        reset({
          name: s.name, address: s.address ?? "", city: s.city ?? "", state: s.state ?? "",
          zip: s.zip ?? "", phone: s.phone ?? "", email: s.email ?? "",
          google_rating: s.google_rating ?? undefined,
          notes: s.notes ?? "",
          mounting_balancing_per_tire: svc?.mounting_balancing_per_tire ?? 0,
          disposal_per_tire: svc?.disposal_per_tire ?? 0,
          valve_stems_per_tire: svc?.valve_stems_per_tire ?? 0,
          tpms_per_tire: svc?.tpms_per_tire ?? 0,
          alignment_cost: svc?.alignment_cost ?? undefined,
          free_rotation: svc?.free_rotation ?? false,
          road_hazard_per_tire: svc?.road_hazard_per_tire ?? undefined,
          budget_min: budget?.min_price ?? 60, budget_max: budget?.max_price ?? 80, budget_brands: budget?.example_brands ?? "",
          mid_min: mid?.min_price ?? 110, mid_max: mid?.max_price ?? 130, mid_brands: mid?.example_brands ?? "",
          premium_min: prem?.min_price ?? 150, premium_max: prem?.max_price ?? 180, premium_brands: prem?.example_brands ?? "",
        });
      })
      .finally(() => setLoading(false));
  }, [id, reset]);

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/shops/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name, address: data.address, city: data.city, state: data.state,
          zip: data.zip, phone: data.phone, email: data.email,
          google_rating: data.google_rating || null, notes: data.notes || null,
          services: {
            mounting_balancing_per_tire: data.mounting_balancing_per_tire,
            valve_stems_per_tire: data.valve_stems_per_tire,
            disposal_per_tire: data.disposal_per_tire,
            tpms_per_tire: data.tpms_per_tire,
            alignment_cost: data.alignment_cost || null,
            free_rotation: data.free_rotation,
            road_hazard_per_tire: data.road_hazard_per_tire || null,
          },
          tire_ranges: [
            { tier: "budget", min_price: data.budget_min, max_price: data.budget_max, example_brands: data.budget_brands || null },
            { tier: "mid-range", min_price: data.mid_min, max_price: data.mid_max, example_brands: data.mid_brands || null },
            { tier: "premium", min_price: data.premium_min, max_price: data.premium_max, example_brands: data.premium_brands || null },
          ],
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      router.push(`/admin/shops/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/admin/shops/${id}`} className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <h1 className="font-bold text-gray-900 text-xl">Edit — {shop?.name}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><Field label="Shop Name" error={errors.name?.message}><input {...register("name")} className={inputCls(errors.name?.message)} /></Field></div>
            <div className="sm:col-span-2"><Field label="Address" error={errors.address?.message}><input {...register("address")} className={inputCls(errors.address?.message)} /></Field></div>
            <Field label="City" error={errors.city?.message}><input {...register("city")} className={inputCls(errors.city?.message)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="State"><input {...register("state")} maxLength={2} className={inputCls()} /></Field>
              <Field label="Zip"><input {...register("zip")} maxLength={5} className={inputCls()} /></Field>
            </div>
            <Field label="Phone" error={errors.phone?.message}><input {...register("phone")} onChange={(e) => setValue("phone", formatPhone(e.target.value))} className={inputCls(errors.phone?.message)} /></Field>
            <Field label="Email" error={errors.email?.message}><input {...register("email")} type="email" className={inputCls(errors.email?.message)} /></Field>
            <Field label="Google Rating"><input {...register("google_rating")} type="number" step="0.1" min="1" max="5" className={inputCls()} /></Field>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Installation Pricing / tire</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            {[
              { id: "mounting_balancing_per_tire", label: "Mount & Balance" },
              { id: "disposal_per_tire", label: "Disposal" },
              { id: "valve_stems_per_tire", label: "Valve Stems" },
              { id: "tpms_per_tire", label: "TPMS" },
            ].map(({ id: fid, label }) => (
              <Field key={fid} label={`${label}`}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input {...register(fid as keyof FormData)} type="number" step="0.01" min="0" className={`${inputCls()} pl-7`} />
                </div>
              </Field>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Field label="Alignment"><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span><input {...register("alignment_cost")} type="number" step="0.01" min="0" className={`${inputCls()} pl-7`} /></div></Field>
            <Field label="Road Hazard"><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span><input {...register("road_hazard_per_tire")} type="number" step="0.01" min="0" className={`${inputCls()} pl-7`} /></div></Field>
            <Field label="Free Rotation?"><label className="flex items-center gap-3 h-10 cursor-pointer"><input {...register("free_rotation")} type="checkbox" className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500" /><span className="text-sm text-gray-700">Yes</span></label></Field>
          </div>
        </div>

        {/* Tire Ranges */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Tire Price Ranges</h2>
          <div className="space-y-4">
            {[
              { prefix: "budget" as const, label: "Budget" },
              { prefix: "mid" as const, label: "Mid-Range" },
              { prefix: "premium" as const, label: "Premium" },
            ].map(({ prefix, label }) => (
              <div key={prefix} className="grid grid-cols-3 gap-3 items-end">
                <Field label={`${label} Min`}>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span><input {...register(`${prefix}_min` as keyof FormData)} type="number" step="0.01" min="0" className={`${inputCls()} pl-7`} /></div>
                </Field>
                <Field label="Max">
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span><input {...register(`${prefix}_max` as keyof FormData)} type="number" step="0.01" min="0" className={`${inputCls()} pl-7`} /></div>
                </Field>
                <Field label="Brands"><input {...register(`${prefix}_brands` as keyof FormData)} placeholder="e.g. Michelin" className={inputCls()} /></Field>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Notes</h2>
          <textarea {...register("notes")} rows={3} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}

        <div className="flex gap-3">
          <Link href={`/admin/shops/${id}`} className="flex-1 h-11 flex items-center justify-center rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={submitting} className="flex-1 h-11 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2">
            {submitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</> : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
