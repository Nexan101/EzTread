"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormData {
  // Step 1
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  website: string;
  // Step 2
  installation: string;
  balancing: string;
  alignment: string;
  rotation: string;
  // Step 3 (removed)
  // Step 4
  description: string;
  specialties: string[];
  hours: string;
  extra_services: string[];
  // Step 5 checkboxes
  ack_public: boolean;
  ack_accurate: boolean;
  ack_terms: boolean;
  ack_privacy: boolean;
  ack_authorized: boolean;
}

const INITIAL: FormData = {
  name: "", address: "", city: "Houston", state: "TX", zip: "", phone: "", email: "", website: "",
  installation: "", balancing: "", alignment: "", rotation: "",
  description: "", specialties: [], hours: "", extra_services: [],
  ack_public: false, ack_accurate: false, ack_terms: false,
  ack_privacy: false, ack_authorized: false,
};

const SPECIALTIES = ["Passenger", "Truck/SUV", "Performance", "Commercial"];
const EXTRA_SERVICES = ["Mobile installation", "Same-day service", "Weekend hours", "Free rotation", "Road hazard warranty"];
const STEPS = ["Business Info", "Service Pricing", "Additional Info", "Legal Agreement"];

// ─── Field helpers ────────────────────────────────────────────────────────────

function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-[#6e6e73] uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

const inputCls = "w-full h-11 px-4 rounded-xl border border-transparent bg-[#f5f5f7] text-[#1d1d1f] text-sm placeholder-[#a1a1a6] focus:outline-none focus:bg-white focus:border-[#f97316]/40 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] transition-all";
const numInputCls = inputCls + " [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ShopSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Auth guard
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/login?callbackUrl=/shops/signup");
    });
  }, [router]);

  // Auto-save to localStorage
  useEffect(() => {
    try { localStorage.setItem("eztread_shop_draft", JSON.stringify({ form, step })); } catch {}
  }, [form, step]);

  // Restore draft
  useEffect(() => {
    try {
      const saved = localStorage.getItem("eztread_shop_draft");
      if (saved) { const { form: f, step: s } = JSON.parse(saved); setForm(f); setStep(s); }
    } catch {}
  }, []);

  const set = useCallback((field: keyof FormData, value: string | boolean | string[]) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  }, []);

  const toggleArray = useCallback((field: "specialties" | "extra_services", value: string) => {
    setForm(prev => {
      const arr = prev[field] as string[];
      return { ...prev, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  }, []);

  // ─── Validation per step ───────────────────────────────────────────────────

  function validateStep(s: number): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (s === 0) {
      if (!form.name.trim()) e.name = "Shop name is required";
      if (!form.address.trim()) e.address = "Address is required";
      if (!form.city.trim()) e.city = "City is required";
      if (!form.state.trim()) e.state = "State is required";
      if (!/^\d{5}(-\d{4})?$/.test(form.zip)) e.zip = "Enter a valid ZIP code";
      if (!/^\d{10,}$/.test(form.phone.replace(/\D/g, ""))) e.phone = "Enter a valid phone number";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
      if (form.website && !/^https?:\/\/.+/.test(form.website)) e.website = "Include https://";
    }
    if (s === 1) {
      if (!form.installation.trim()) e.installation = "Required";
    }
    if (s === 3) {
      const checks: (keyof FormData)[] = ["ack_public","ack_accurate","ack_terms","ack_privacy","ack_authorized"];
      for (const c of checks) {
        if (!form[c]) e[c] = "Required";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() { if (validateStep(step)) setStep(s => s + 1); }
  function back() { setStep(s => s - 1); }

  async function handleSubmit() {
    if (!validateStep(4)) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/shops/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.error ?? "Submission failed. Please try again."); return; }
      localStorage.removeItem("eztread_shop_draft");
      router.push("/shops/signup/success?id=" + data.shopId);
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const allAcks = ["ack_public","ack_accurate","ack_terms","ack_privacy","ack_authorized"] as const;
  const allChecked = allAcks.every(k => form[k]);

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Header */}
      <div className="bg-white border-b border-[#e0e0e5] px-5 py-4 flex items-center gap-3">
        <Link href="/join" className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors text-sm font-medium flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </Link>
        <span className="text-[#d2d2d7]">|</span>
        <span className="font-bold text-[#1d1d1f]">EzTread</span>
        <span className="text-[#6e6e73] text-sm">— Free Shop Profile</span>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-12">
        {/* Progress */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-[#1d1d1f]">Step {step + 1} of {STEPS.length}</span>
            <span className="text-sm text-[#6e6e73]">{STEPS[step]}</span>
          </div>
          <div className="h-1.5 bg-[#e5e5ea] rounded-full overflow-hidden">
            <div className="h-full bg-[#f97316] rounded-full transition-all duration-300" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
          <div className="flex mt-3 gap-1">
            {STEPS.map((s, i) => (
              <div key={s} className={`flex-1 text-center text-[10px] font-medium ${i === step ? "text-[#f97316]" : i < step ? "text-green-600" : "text-[#a1a1a6]"}`}>
                {i < step ? "✓" : i + 1}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#d2d2d7] shadow-sm p-8">

          {/* ── STEP 1: Business Info ── */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-[#1d1d1f] mb-6">Business Information</h2>
              <Field label="Shop Name" required error={errors.name}>
                <input className={inputCls} placeholder="Houston Tire Pro" value={form.name} onChange={e => set("name", e.target.value)} />
              </Field>
              <Field label="Street Address" required error={errors.address}>
                <input className={inputCls} placeholder="123 Main St" value={form.address} onChange={e => set("address", e.target.value)} />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="City" required error={errors.city}>
                  <input className={inputCls} value={form.city} onChange={e => set("city", e.target.value)} />
                </Field>
                <Field label="State" required error={errors.state}>
                  <input className={inputCls} maxLength={2} placeholder="TX" value={form.state} onChange={e => set("state", e.target.value.toUpperCase())} />
                </Field>
                <Field label="ZIP" required error={errors.zip}>
                  <input className={inputCls} placeholder="77001" value={form.zip} onChange={e => set("zip", e.target.value)} />
                </Field>
              </div>
              <Field label="Phone Number" required error={errors.phone}>
                <input className={inputCls} type="tel" placeholder="(713) 555-0100" value={form.phone} onChange={e => set("phone", e.target.value)} />
              </Field>
              <Field label="Business Email" required error={errors.email}>
                <input className={inputCls} type="email" placeholder="you@yourshop.com" value={form.email} onChange={e => set("email", e.target.value)} />
              </Field>
              <Field label="Website (optional)" error={errors.website}>
                <input className={inputCls} type="url" placeholder="https://yourshop.com" value={form.website} onChange={e => set("website", e.target.value)} />
              </Field>
            </div>
          )}

          {/* ── STEP 2: Service Pricing ── */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-[#1d1d1f] mb-2">Service Pricing</h2>
              <p className="text-sm text-[#6e6e73] mb-6">
                These prices appear on your listing when customers compare nearby shops.
                Leave a field blank to hide it. You can enter ranges like <strong>25–30</strong> or labels like <strong>Free</strong>.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Installation / tire" required error={errors.installation}>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6e6e73] text-sm">$</span>
                    <input className={inputCls + " pl-7"} placeholder="e.g. 20" value={form.installation} onChange={e => set("installation", e.target.value)} />
                  </div>
                  <p className="text-xs text-[#a1a1a6] mt-1">Mount & balance per tire</p>
                </Field>
                <Field label="Balancing / tire" error={errors.balancing}>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6e6e73] text-sm">$</span>
                    <input className={inputCls + " pl-7"} placeholder="e.g. 15" value={form.balancing} onChange={e => set("balancing", e.target.value)} />
                  </div>
                  <p className="text-xs text-[#a1a1a6] mt-1">Wheel balancing per tire</p>
                </Field>
                <Field label="Alignment" error={errors.alignment}>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6e6e73] text-sm">$</span>
                    <input className={inputCls + " pl-7"} placeholder="e.g. 89" value={form.alignment} onChange={e => set("alignment", e.target.value)} />
                  </div>
                  <p className="text-xs text-[#a1a1a6] mt-1">Full wheel alignment (total)</p>
                </Field>
                <Field label="Rotation" error={errors.rotation}>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6e6e73] text-sm">$</span>
                    <input className={inputCls + " pl-7"} placeholder="e.g. Free" value={form.rotation} onChange={e => set("rotation", e.target.value)} />
                  </div>
                  <p className="text-xs text-[#a1a1a6] mt-1">Enter Free if included</p>
                </Field>
              </div>

              {/* Live preview */}
              {(form.installation || form.balancing || form.alignment || form.rotation) && (
                <div className="bg-[#f5f5f7] rounded-2xl p-5 mt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <p className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wide">Preview — how it appears on your listing</p>
                  </div>
                  <div className="space-y-2">
                    {form.installation && <div className="flex justify-between text-sm"><span className="text-[#6e6e73]">Installation</span><span className="font-semibold">${form.installation}/tire</span></div>}
                    {form.balancing && <div className="flex justify-between text-sm"><span className="text-[#6e6e73]">Balancing</span><span className="font-semibold">${form.balancing}/tire</span></div>}
                    {form.alignment && <div className="flex justify-between text-sm"><span className="text-[#6e6e73]">Alignment</span><span className="font-semibold">${form.alignment}</span></div>}
                    {form.rotation && <div className="flex justify-between text-sm"><span className="text-[#6e6e73]">Rotation</span><span className="font-semibold">{form.rotation.toLowerCase() === "free" ? "Free" : `$${form.rotation}`}</span></div>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Additional Info ── */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#1d1d1f] mb-2">Additional Info <span className="text-[#a1a1a6] font-normal text-base">(Optional)</span></h2>
              <Field label={`Shop Description (${form.description.length}/500)`}>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border border-transparent bg-[#f5f5f7] text-[#1d1d1f] text-sm placeholder-[#a1a1a6] focus:outline-none focus:bg-white focus:border-[#f97316]/40 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] transition-all resize-none"
                  rows={4} maxLength={500} placeholder="Tell customers what makes your shop special..."
                  value={form.description} onChange={e => set("description", e.target.value)}
                />
              </Field>
              <Field label="Specialties">
                <div className="flex flex-wrap gap-2 mt-1">
                  {SPECIALTIES.map(s => (
                    <button key={s} type="button" onClick={() => toggleArray("specialties", s)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${form.specialties.includes(s) ? "bg-[#f97316] text-white" : "bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#e5e5ea]"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Hours of Operation">
                <input className={inputCls} placeholder="Mon–Fri 8am–6pm, Sat 9am–4pm" value={form.hours} onChange={e => set("hours", e.target.value)} />
              </Field>
              <Field label="Services Offered">
                <div className="space-y-2 mt-1">
                  {EXTRA_SERVICES.map(s => (
                    <label key={s} className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" checked={form.extra_services.includes(s)} onChange={() => toggleArray("extra_services", s)}
                        className="w-4 h-4 rounded accent-[#f97316]" />
                      <span className="text-sm text-[#1d1d1f]">{s}</span>
                    </label>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {/* ── STEP 4: Legal Agreements ── */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#1d1d1f] mb-2">Legal Agreement</h2>

              {/* Warning box */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                <span className="text-xl">⚠️</span>
                <p className="text-sm text-amber-800 font-medium">
                  Your shop information and pricing will be displayed <strong>publicly</strong> on EzTread.com
                  and visible to all customers and competitors.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { key: "ack_public" as const, text: "I understand my pricing will be publicly visible to customers and competitors" },
                  { key: "ack_accurate" as const, text: "I confirm all information provided is accurate and up-to-date" },
                  { key: "ack_terms" as const, text: (<>I have read and agree to the <a href="/terms/shop-owners" target="_blank" className="text-[#f97316] underline">Shop Owner Terms of Service</a></>) },
                  { key: "ack_privacy" as const, text: (<>I have read and agree to the <a href="/privacy" target="_blank" className="text-[#f97316] underline">Privacy Policy</a></>) },
                  { key: "ack_authorized" as const, text: "I am authorized to create this profile for my business" },
                ].map(({ key, text }) => (
                  <label key={key} className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${form[key] ? "border-green-300 bg-green-50" : "border-[#e5e5ea] bg-white hover:border-[#d2d2d7]"}`}>
                    <input type="checkbox" checked={form[key] as boolean} onChange={e => set(key, e.target.checked)}
                      className="w-4 h-4 mt-0.5 shrink-0 accent-[#f97316]" />
                    <span className="text-sm text-[#1d1d1f] leading-relaxed">{text}</span>
                  </label>
                ))}
              </div>

              {submitError && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-2xl">{submitError}</div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!allChecked || submitting}
                className="w-full bg-[#f97316] hover:bg-[#ea6b0f] disabled:bg-[#f97316]/40 disabled:cursor-not-allowed text-white font-bold text-[16px] py-4 rounded-2xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating Profile…</>
                ) : "Create Free Shop Profile"}
              </button>

              <p className="text-xs text-[#a1a1a6] text-center leading-relaxed">
                By creating a profile, you agree to display your business information publicly and comply with all terms.
                You can request profile removal anytime by emailing{" "}
                <a href="mailto:EzTread@eztread.net" className="text-[#f97316]">EzTread@eztread.net</a>.
                Profile activation may take 1–2 business days for verification.
              </p>
            </div>
          )}

          {/* Navigation */}
          {step < 3 && (
            <div className="flex gap-3 mt-8">
              {step > 0 && (
                <button onClick={back} className="flex-1 h-12 rounded-2xl border-2 border-[#e5e5ea] hover:border-[#d2d2d7] text-[#1d1d1f] font-semibold text-sm transition-all">
                  Back
                </button>
              )}
              <button onClick={next} className="flex-1 h-12 rounded-2xl bg-[#1d1d1f] hover:bg-[#3d3d3f] text-white font-semibold text-sm transition-all">
                Continue →
              </button>
            </div>
          )}
          {step === 3 && step > 0 && (
            <button onClick={back} className="w-full mt-3 h-11 rounded-2xl border-2 border-[#e5e5ea] hover:border-[#d2d2d7] text-[#6e6e73] font-semibold text-sm transition-all">
              Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
