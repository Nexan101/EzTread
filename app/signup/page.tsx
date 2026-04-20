"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordStrength = (() => {
    if (password.length === 0) return null;
    if (password.length < 6) return "weak";
    if (password.length < 10 || !/[^a-zA-Z0-9]/.test(password)) return "fair";
    return "strong";
  })();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { name: name.trim() || undefined },
      },
    });
    setLoading(false);

    if (authError) {
      setError(authError.message);
    } else {
      // Supabase may require email confirmation depending on your project settings.
      // If "Confirm email" is disabled in the dashboard, the user is signed in immediately.
      setSuccess(true);
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1500);
    }
  }

  const strengthColor: Record<string, string> = {
    weak: "bg-red-400",
    fair: "bg-yellow-400",
    strong: "bg-green-500",
  };
  const strengthLabel: Record<string, string> = {
    weak: "Weak",
    fair: "Fair",
    strong: "Strong",
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col">
      {/* Top bar */}
      <div className="px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="w-7 h-7 bg-[#f97316] rounded-lg flex items-center justify-center group-hover:bg-[#ea6b0f] transition-colors">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="8" strokeWidth="2.5" />
              <circle cx="12" cy="12" r="2.5" strokeWidth="2.5" />
            </svg>
          </div>
          <span className="text-[15px] font-bold text-[#1d1d1f]">EzTread</span>
        </Link>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-[420px]">
          <div className="bg-white rounded-3xl border border-[#d2d2d7] shadow-sm px-8 py-10">
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="w-14 h-14 bg-[#f97316]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-[#f97316]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-[#1d1d1f]">Create your account</h1>
              <p className="text-sm text-[#6e6e73] mt-1">Start comparing tire prices for free</p>
            </div>

            {/* Success */}
            {success && (
              <div className="mb-5 flex items-start gap-3 bg-green-50 border border-green-100 text-green-700 text-sm px-4 py-3 rounded-2xl">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Account created! Check your email to confirm, then sign in.
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-2xl">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-[11px] font-bold text-[#6e6e73] uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-[#a1a1a6] normal-case font-normal">(optional)</span>
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full h-11 px-4 rounded-xl border border-transparent bg-[#f5f5f7] text-[#1d1d1f] text-sm placeholder-[#a1a1a6] focus:outline-none focus:bg-white focus:border-[#f97316]/40 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] transition-all"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-[11px] font-bold text-[#6e6e73] uppercase tracking-wider mb-1.5">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-11 px-4 rounded-xl border border-transparent bg-[#f5f5f7] text-[#1d1d1f] text-sm placeholder-[#a1a1a6] focus:outline-none focus:bg-white focus:border-[#f97316]/40 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-[11px] font-bold text-[#6e6e73] uppercase tracking-wider mb-1.5">
                  Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full h-11 px-4 pr-11 rounded-xl border border-transparent bg-[#f5f5f7] text-[#1d1d1f] text-sm placeholder-[#a1a1a6] focus:outline-none focus:bg-white focus:border-[#f97316]/40 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a1a6] hover:text-[#6e6e73] transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {/* Strength bar */}
                {passwordStrength && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                      {["weak", "fair", "strong"].map((level, i) => {
                        const levels = ["weak", "fair", "strong"];
                        const idx = levels.indexOf(passwordStrength);
                        return (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= idx ? strengthColor[passwordStrength] : "bg-[#e5e5ea]"}`}
                          />
                        );
                      })}
                    </div>
                    <span className={`text-[11px] font-semibold ${passwordStrength === "weak" ? "text-red-500" : passwordStrength === "fair" ? "text-yellow-500" : "text-green-600"}`}>
                      {strengthLabel[passwordStrength]}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirm" className="block text-[11px] font-bold text-[#6e6e73] uppercase tracking-wider mb-1.5">
                  Confirm Password <span className="text-red-400">*</span>
                </label>
                <input
                  id="confirm"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  className={`w-full h-11 px-4 rounded-xl border bg-[#f5f5f7] text-[#1d1d1f] text-sm placeholder-[#a1a1a6] focus:outline-none focus:bg-white transition-all ${
                    confirm && password !== confirm
                      ? "border-red-300 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]"
                      : "border-transparent focus:border-[#f97316]/40 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)]"
                  }`}
                />
                {confirm && password !== confirm && (
                  <p className="mt-1 text-[11px] text-red-500 font-medium">Passwords do not match</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || success}
                className="w-full h-11 bg-[#f97316] hover:bg-[#ea6b0f] disabled:bg-[#f97316]/60 text-white font-semibold text-sm rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[#f97316]/25 active:scale-[0.98] focus:outline-none mt-2 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account…
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-[#e5e5ea]" />
              <span className="text-xs text-[#a1a1a6]">Already have an account?</span>
              <div className="flex-1 h-px bg-[#e5e5ea]" />
            </div>

            <Link
              href="/login"
              className="flex items-center justify-center w-full h-11 rounded-xl border-2 border-[#e5e5ea] hover:border-[#d2d2d7] bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] font-semibold text-sm transition-all duration-200"
            >
              Sign in instead
            </Link>
          </div>

          <p className="text-center text-xs text-[#a1a1a6] mt-6">
            By creating an account you agree to our{" "}
            <Link href="#" className="underline underline-offset-2 hover:text-[#6e6e73]">Terms</Link>
            {" "}and{" "}
            <Link href="#" className="underline underline-offset-2 hover:text-[#6e6e73]">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
