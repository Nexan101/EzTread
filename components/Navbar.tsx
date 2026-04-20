"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get initial session
    const timeout = setTimeout(() => setLoading(false), 3000);
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
      clearTimeout(timeout);
    }).catch(() => {
      setLoading(false);
      clearTimeout(timeout);
    });

    // Listen for auth changes (sign in / sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    setUserMenuOpen(false);
    setMobileOpen(false);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const navLinks = [
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Compare Prices", href: "/compare" },
    { label: "For Shops", href: "/#shops" },
    { label: "Pricing", href: "/#pricing" },
  ];

  const displayName = (user?.user_metadata?.name as string | undefined)?.trim() || null;
  const initials = displayName
    ? displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <header
      suppressHydrationWarning
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/85 backdrop-blur-xl border-b border-[#d2d2d7]/60 shadow-sm"
          : "bg-white/70 backdrop-blur-md"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 bg-[#f97316] rounded-lg flex items-center justify-center group-hover:bg-[#ea6b0f] transition-colors duration-200">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="8" strokeWidth="2.5" />
                <circle cx="12" cy="12" r="2.5" strokeWidth="2.5" />
              </svg>
            </div>
            <span className="text-[15px] font-bold text-[#1d1d1f] tracking-tight">EzTread</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[13px] font-medium text-[#1d1d1f] hover:text-[#f97316] transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-[#f5f5f7] animate-pulse" />
            ) : user ? (
              /* ── Logged-in user menu ── */
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-[#f5f5f7] transition-colors group"
                  aria-label="User menu"
                  aria-expanded={userMenuOpen}
                >
                  <div className="w-7 h-7 rounded-full bg-[#f97316] flex items-center justify-center text-white text-[11px] font-bold select-none">
                    {initials}
                  </div>
                  {displayName && (
                    <span className="text-[13px] font-medium text-[#1d1d1f] max-w-[120px] truncate">
                      {displayName}
                    </span>
                  )}
                  <svg
                    className={`w-3.5 h-3.5 text-[#6e6e73] transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-[#e5e5ea] shadow-xl shadow-black/10 py-2 z-50">
                    <div className="px-4 py-3 border-b border-[#f0f0f5]">
                      <p className="text-sm font-semibold text-[#1d1d1f] truncate">
                        {displayName ?? "My Account"}
                      </p>
                      <p className="text-xs text-[#6e6e73] truncate mt-0.5">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="#"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
                      >
                        <svg className="w-4 h-4 text-[#6e6e73]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        My Profile
                      </Link>
                      <Link
                        href="#"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
                      >
                        <svg className="w-4 h-4 text-[#6e6e73]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        Saved Searches
                      </Link>
                    </div>
                    <div className="border-t border-[#f0f0f5] py-1">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── Guest buttons ── */
              <>
                <Link
                  href="/login"
                  className="text-[13px] font-medium text-[#1d1d1f] hover:text-[#6e6e73] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-[#f97316] hover:bg-[#ea6b0f] text-white text-[13px] font-semibold px-4 py-2 rounded-full transition-all duration-200 hover:shadow-md hover:shadow-[#f97316]/20 focus:outline-none focus:ring-2 focus:ring-[#f97316]/40"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-[#d2d2d7]/60">
          <nav className="px-5 py-3 space-y-0.5" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-3 text-[15px] text-[#1d1d1f] font-medium hover:text-[#f97316] border-b border-[#f5f5f7] last:border-0 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 pb-2 space-y-2">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-[#f97316] flex items-center justify-center text-white text-xs font-bold">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1d1d1f] truncate">{displayName ?? "My Account"}</p>
                      <p className="text-xs text-[#6e6e73] truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-center text-red-500 font-semibold py-3 rounded-2xl border border-red-100 hover:bg-red-50 text-[15px] transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full text-center text-[#1d1d1f] font-semibold py-3 rounded-2xl border border-[#e5e5ea] hover:bg-[#f5f5f7] text-[15px] transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full bg-[#f97316] hover:bg-[#ea6b0f] text-white font-semibold text-center py-3 rounded-2xl transition-colors text-[15px]"
                  >
                    Get Started — Free
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
