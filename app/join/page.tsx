"use client";

import { useCallback, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { supabase } from "@/lib/supabase";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const PLANS = {
  basic: {
    name: "Basic",
    price: "$0",
    period: "forever",
    description: "Get listed and start receiving visibility — no cost.",    color: "border-[#d2d2d7]",
    badge: null,
    pros: [
      "Free shop listing on EzTread",
      "Appear in search results",
      "Basic shop profile page",
      "Customers can view your address & hours",
    ],
    cons: [
      "No priority placement",
      "No lead notifications",
      "No analytics dashboard",
      "No featured badge",
      "Limited to 1 service category",
    ],
    cta: "Start Free",
    ctaStyle: "border-2 border-[#1d1d1f] text-[#1d1d1f] hover:bg-[#1d1d1f] hover:text-white",
  },
  premium: {
    name: "Premium",
    price: "$149",
    period: "/month",
              description: "Everything you need to dominate local tire searches.",    color: "border-[#f97316]",
    badge: "Most Popular",
    pros: [
      "Everything in Basic",
      "Priority placement in search results",
      "Instant lead notifications via email & SMS",
      "Full analytics & performance dashboard",
      "Featured shop badge",
      "Unlimited service categories",
      "Dedicated onboarding support",
      "Update prices anytime",
    ],
    cons: [],
              cta: "Join Premium",    ctaStyle: "bg-[#f97316] hover:bg-[#ea6b0f] text-white hover:shadow-lg hover:shadow-[#f97316]/25",
  },
} as const;

type PlanKey = keyof typeof PLANS;

export default function JoinPage() {
  const [selected, setSelected] = useState<PlanKey | null>(null);
  const [checkoutStarted, setCheckoutStarted] = useState(false);

  const fetchClientSecret = useCallback(async () => {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: "monthly" }),
    });
    const data = await res.json();
    if (data.fallback_url) {
      window.location.href = data.fallback_url;
      return "";
    }
    return data.client_secret as string;
  }, []);

  const handleCta = async (plan: PlanKey) => {
    if (plan === "basic") {
      // Check auth before going to signup
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.href = "/login?callbackUrl=/shops/signup";
      } else {
        window.location.href = "/shops/signup";
      }
    } else {
      // Require login before starting premium checkout
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.href = "/login?callbackUrl=/join";
        return;
      }
      setSelected("premium");
      setCheckoutStarted(true);
    }
  };

  if (checkoutStarted) {
    return (
      <div className="min-h-screen bg-[#f5f5f7]">
        <div className="bg-white border-b border-[#e0e0e5] px-5 py-4 flex items-center gap-3">
          <button
            onClick={() => setCheckoutStarted(false)}
            className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors text-sm font-medium flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to plans
          </button>
          <span className="text-[#d2d2d7]">|</span>
          <span className="font-bold text-[#1d1d1f]">EzTread</span>
              <span className="text-[#6e6e73] text-sm">— Shop Partner Program</span>
        </div>
        <div className="max-w-2xl mx-auto px-5 py-16">
          <h2 className="text-2xl font-bold text-[#1d1d1f] mb-2">Complete your subscription</h2>
          <p className="text-[17px] text-[#6e6e73] mb-8 text-sm">$149/month · Cancel anytime</p>
          <div className="bg-white rounded-3xl p-1 border border-[#d2d2d7] shadow-sm overflow-hidden">
            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Header */}
      <div className="bg-white border-b border-[#e0e0e5] px-5 py-4 flex items-center gap-3">
        <a href="/" className="text-[#6e6e73] hover:text-[#1d1d1f] transition-colors text-sm font-medium flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </a>
        <span className="text-[#d2d2d7]">|</span>
        <span className="font-bold text-[#1d1d1f]">EzTread</span>
        <span className="text-[#6e6e73] text-sm">— Shop Partner Program</span>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-16">
        {/* Title */}
        <div className="text-center mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#f97316] mb-3">For Shop Owners</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#1d1d1f] tracking-tight mb-4">Choose your plan</h1>
          <p className="text-[17px] text-[#6e6e73]">Start free. Upgrade when you&apos;re ready to grow.</p>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {(Object.entries(PLANS) as [PlanKey, typeof PLANS[PlanKey]][]).map(([key, plan]) => (
            <div
              key={key}
              onClick={() => setSelected(key)}
              className={`relative bg-white rounded-3xl p-8 border-2 cursor-pointer transition-all duration-200 ${plan.color} ${
                selected === key ? "shadow-xl scale-[1.01]" : "hover:shadow-md hover:scale-[1.005]"
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#f97316] text-white text-xs font-bold px-4 py-1.5 rounded-full tracking-wide">
                  {plan.badge}
                </div>
              )}

              {/* Plan header */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-[#1d1d1f] mb-1">{plan.name}</h2>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold text-[#1d1d1f]">{plan.price}</span>
                  <span className="text-[#6e6e73] text-sm">{plan.period}</span>
                </div>
                <p className="text-sm text-[#6e6e73]">{plan.description}</p>              </div>

              <hr className="border-[#f0f0f0] mb-6" />

              {/* Pros */}
              <ul className="space-y-3 mb-6">
                {plan.pros.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-[14px] text-[#1d1d1f]">{item}</span>
                  </li>
                ))}
              </ul>

              {/* Cons */}
              {plan.cons.length > 0 && (
                <ul className="space-y-3 mb-8">
                  {plan.cons.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#f5f5f7] flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-[#a1a1a6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <span className="text-[14px] text-[#a1a1a6] line-through">{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* CTA */}
              <button
                onClick={(e) => { e.stopPropagation(); handleCta(key); }}
                className={`w-full font-semibold text-[15px] py-4 rounded-2xl transition-all duration-200 active:scale-[0.98] mt-auto ${plan.ctaStyle}`}
              >
                {plan.cta}
              </button>

              {key === "premium" && (
                <p className="text-center text-xs text-[#a1a1a6] mt-3">Cancel anytime · No setup fees</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
