"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatPhone } from "@/lib/utils/formatPhone";
import { calculateCost } from "@/lib/utils/calculateCost";
import GooglePlacesSearch, { type PlaceResult } from "@/components/GooglePlacesSearch";

// ── Zod Schema ────────────────────────────────────────────────────────────────
const schema = z.object({
  name: z.string().min(1, "Shop name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().length(2, "Use 2-letter state code"),
  zip: z.string().regex(/^\d{5}$/, "Enter a valid 5-digit zip"),
  phone: z.string().min(14, "Enter a valid phone number"),
  email: z.string().email("Enter a valid email"),
  google_rating: z.coerce.number().min(1).max(5).optional().nullable(),
  notes: z.string().optional(),
  mounting_balancing_per_tire: z.coerce.number().min(0, "Must be 0 or more"),
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function Field({
  label, error, required, children, hint,
}: {
  label: string; error?: string; required?: boolean; children: React.ReactNode; hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}

const inputCls = (err?: string) =>
  `w-full h-10 px-3 rounded-lg border text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
    err ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
  }`;

function SectionHeader({ step, title, desc }: { step: number; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="w-8 h-8 bg-orange-500 text-white rounded-lg flex items-center justify-center text-sm font-bold shrink-0">
        {step}
      </div>
      <div>
        <h2 className="font-semibold text-gray-900 text-base">{title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AddShopPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ shopId: string; name: string } | null>(null);
  const [submitError, setSubmitError] = useState("");

  const {
    register, handleSubmit, control, setValue, watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      city: "Houston", state: "TX",
      free_rotation: false,
      mounting_balancing_per_tire: 20,
      disposal_per_tire: 5,
      valve_stems_per_tire: 3,
      tpms_per_tire: 0,
      budget_min: 60, budget_max: 80, budget_brands: "Cooper, Ironman, Westlake",
      mid_min: 110, mid_max: 130, mid_brands: "Hankook, Falken, General",
      premium_min: 150, premium_max: 180, premium_brands: "Michelin, Goodyear, Bridgestone",
    },
  });

  const watched = useWatch({ control });

  function handlePlaceSelected(place: PlaceResult) {
    if (place.name) setValue("name", place.name);
    if (place.address) setValue("address", place.address);
    if (place.city) setValue("city", place.city);
    if (place.state) setValue("state", place.state);
    if (place.zip) setValue("zip", place.zip);
    if (place.phone) setValue("phone", formatPhone(place.phone));
    if (place.google_rating) setValue("google_rating", place.google_rating);
  }

  // Live cost preview
  const previewServices = {
    mounting_balancing_per_tire: Number(watched.mounting_balancing_per_tire) || 0,
    valve_stems_per_tire: Number(watched.valve_stems_per_tire) || 0,
    disposal_per_tire: Number(watched.disposal_per_tire) || 0,
    tpms_per_tire: Number(watched.tpms_per_tire) || 0,
  };
  const previewRange = {
    min_price: Number(watched.mid_min) || 0,
    max_price: Number(watched.mid_max) || 0,
  };
  const cost = calculateCost(previewServices, previewRange, 4);

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/admin/shops/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name, address: data.address, city: data.city, state: data.state,
          zip: data.zip, phone: data.phone, email: data.email,
          google_rating: data.google_rating || null,
          notes: data.notes || null,
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
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Failed to create shop");
      setSuccess({ shopId: result.shopId, name: data.name });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Shop Added!</h2>
        <p className="text-gray-500 mb-8"><strong>{success.name}</strong> has been saved to EzTread.</p>
        <div className="flex gap-3 justify-center">
          <Link href={`/admin/shops/${success.shopId}`} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
            View Shop
          </Link>
          <button onClick={() => { setSuccess(null); }} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
            Add Another
          </button>
          <Link href="/admin/shops" className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
            All Shops
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left — form sections */}
          <div className="xl:col-span-2 space-y-6">

            {/* Google Places autofill */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900">Import from Google Maps</p>
                  <p className="text-xs text-blue-600 mt-0.5">Search for any shop to auto-fill name, address, phone, and rating. You&apos;ll still need to enter pricing.</p>
                </div>
              </div>
              <GooglePlacesSearch onPlaceSelected={handlePlaceSelected} />
            </div>

            {/* Section 1: Basic Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <SectionHeader step={1} title="Basic Information" desc="Details from your visit or their website" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Field label="Shop Name" error={errors.name?.message} required>
                    <input {...register("name")} placeholder="Houston Tire Pros" className={inputCls(errors.name?.message)} />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Address" error={errors.address?.message} required>
                    <input {...register("address")} placeholder="1234 Main St" className={inputCls(errors.address?.message)} />
                  </Field>
                </div>
                <Field label="City" error={errors.city?.message} required>
                  <input {...register("city")} className={inputCls(errors.city?.message)} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="State" error={errors.state?.message} required>
                    <input {...register("state")} maxLength={2} className={inputCls(errors.state?.message)} />
                  </Field>
                  <Field label="Zip" error={errors.zip?.message} required>
                    <input {...register("zip")} maxLength={5} inputMode="numeric" className={inputCls(errors.zip?.message)} />
                  </Field>
                </div>
                <Field label="Phone" error={errors.phone?.message} required>
                  <input
                    {...register("phone")}
                    onChange={(e) => setValue("phone", formatPhone(e.target.value))}
                    placeholder="(713) 555-0100"
                    className={inputCls(errors.phone?.message)}
                  />
                </Field>
                <Field label="Email" error={errors.email?.message} required>
                  <input {...register("email")} type="email" placeholder="contact@shop.com" className={inputCls(errors.email?.message)} />
                </Field>
                <Field label="Google Rating" error={errors.google_rating?.message} hint="1–5 stars (optional)">
                  <input {...register("google_rating")} type="number" step="0.1" min="1" max="5" placeholder="4.5" className={inputCls(errors.google_rating?.message)} />
                </Field>
              </div>
            </div>

            {/* Section 2: Pricing */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <SectionHeader step={2} title="Installation Pricing" desc="Fees per tire for services" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {[
                  { id: "mounting_balancing_per_tire", label: "Mount & Balance" },
                  { id: "disposal_per_tire", label: "Disposal" },
                  { id: "valve_stems_per_tire", label: "Valve Stems" },
                  { id: "tpms_per_tire", label: "TPMS" },
                ].map(({ id, label }) => (
                  <Field key={id} label={`${label} / tire`} error={(errors as Record<string, { message?: string }>)[id]?.message} required>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <input
                        {...register(id as keyof FormData)}
                        type="number" step="0.01" min="0"
                        className={`${inputCls((errors as Record<string, { message?: string }>)[id]?.message)} pl-7`}
                      />
                    </div>
                  </Field>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Field label="Alignment Cost" hint="Full service (optional)">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input {...register("alignment_cost")} type="number" step="0.01" min="0" placeholder="89" className={`${inputCls()} pl-7`} />
                  </div>
                </Field>
                <Field label="Road Hazard / tire" hint="Optional warranty fee">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input {...register("road_hazard_per_tire")} type="number" step="0.01" min="0" placeholder="15" className={`${inputCls()} pl-7`} />
                  </div>
                </Field>
                <Field label="Free Rotation?">
                  <label className="flex items-center gap-3 h-10 cursor-pointer">
                    <input {...register("free_rotation")} type="checkbox" className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500" />
                    <span className="text-sm text-gray-700">Yes, free rotation included</span>
                  </label>
                </Field>
              </div>
            </div>

            {/* Section 3: Tire Ranges */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <SectionHeader step={3} title="Tire Price Ranges" desc="Min/max prices per tire for each quality tier" />
              <div className="space-y-4">
                {[
                  { prefix: "budget" as const, label: "Budget", color: "bg-gray-100 text-gray-600" },
                  { prefix: "mid" as const, label: "Mid-Range", color: "bg-blue-100 text-blue-600" },
                  { prefix: "premium" as const, label: "Premium", color: "bg-orange-100 text-orange-600" },
                ].map(({ prefix, label, color }) => (
                  <div key={prefix} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${color}`}>{label}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <Field label="Min Price" error={(errors as Record<string, { message?: string }>)[`${prefix}_min`]?.message} required>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                          <input {...register(`${prefix}_min` as keyof FormData)} type="number" step="0.01" min="0" className={`${inputCls()} pl-7`} />
                        </div>
                      </Field>
                      <Field label="Max Price" error={(errors as Record<string, { message?: string }>)[`${prefix}_max`]?.message} required>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                          <input {...register(`${prefix}_max` as keyof FormData)} type="number" step="0.01" min="0" className={`${inputCls()} pl-7`} />
                        </div>
                      </Field>
                      <Field label="Example Brands" hint="Comma separated">
                        <input {...register(`${prefix}_brands` as keyof FormData)} placeholder="Michelin, Goodyear" className={inputCls()} />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4: Notes */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <SectionHeader step={4} title="Visit Notes" desc="Internal notes — not shown to customers" />
              <Field label="Notes">
                <textarea
                  {...register("notes")}
                  rows={4}
                  placeholder="Spoke with John (manager). Open until 8pm weekdays. Has 4 bays..."
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                />
              </Field>
            </div>

            {/* Error & Submit */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {submitError}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving shop…
                </>
              ) : "Save Shop to EzTread"}
            </button>
          </div>

          {/* Right — live preview */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-24">
              <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Live Cost Preview
              </h3>
              <p className="text-xs text-gray-400 mb-4">Mid-range tier, 4 tires</p>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Avg tire price</span>
                  <span className="font-medium">${cost.tireCostPerTire.toFixed(2)}/ea</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tires × 4</span>
                  <span className="font-medium">${cost.tireCostTotal.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-100 pt-2 mt-2 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Mount & Balance</span>
                    <span>${(Number(watched.mounting_balancing_per_tire) * 4 || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Disposal</span>
                    <span>${(Number(watched.disposal_per_tire) * 4 || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Valve Stems</span>
                    <span>${(Number(watched.valve_stems_per_tire) * 4 || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">TPMS</span>
                    <span>${(Number(watched.tpms_per_tire) * 4 || 0).toFixed(2)}</span>
                  </div>
                </div>
                <div className="border-t-2 border-gray-200 pt-3 flex justify-between font-bold text-base">
                  <span className="text-gray-900">Total Installed</span>
                  <span className="text-orange-500">${cost.grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Current form values preview */}
              {watch("name") && (
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Shop Preview</p>
                  <p className="font-semibold text-gray-900 text-sm">{watch("name")}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{watch("address") && `${watch("address")}, `}{watch("city")}, {watch("state")}</p>
                  {watch("phone") && <p className="text-xs text-gray-500 mt-0.5">{watch("phone")}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
