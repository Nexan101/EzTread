import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Emails explicitly granted admin access via env var.
// You can also grant access by setting role:"admin" in a user's
// app_metadata from the Supabase dashboard (Authentication → Users).
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// Emails explicitly granted shop_owner access via env var.
// You can also grant access by setting role:"shop_owner" in a user's
// app_metadata from the Supabase dashboard (Authentication → Users).
const SHOP_OWNER_EMAILS = (process.env.SHOP_OWNER_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Always call getUser() to keep the session fresh
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminPage = request.nextUrl.pathname.startsWith("/admin");
  const isAdminApi  = request.nextUrl.pathname.startsWith("/api/admin");
  const isShopDashboardPage = request.nextUrl.pathname.startsWith("/shop-dashboard");
  const isShopDashboardApi  = request.nextUrl.pathname.startsWith("/api/shop-dashboard");

  if (isAdminPage || isAdminApi) {
    if (!user) {
      if (isAdminApi) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      // Only pass relative paths as callbackUrl to prevent open-redirect
      url.searchParams.set("callbackUrl", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    const email = (user.email ?? "").toLowerCase();
    const hasRole = user.app_metadata?.role === "admin";
    const hasEmail = ADMIN_EMAILS.length > 0 && ADMIN_EMAILS.includes(email);

    if (!hasRole && !hasEmail) {
      if (isAdminApi) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (isShopDashboardPage || isShopDashboardApi) {
    if (!user) {
      if (isShopDashboardApi) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("callbackUrl", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    const email = (user.email ?? "").toLowerCase();
    const hasRole = user.app_metadata?.role === "shop_owner";
    const hasEmail = SHOP_OWNER_EMAILS.length > 0 && SHOP_OWNER_EMAILS.includes(email);

    if (!hasRole && !hasEmail) {
      if (isShopDashboardApi) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/shop-dashboard/:path*", "/api/shop-dashboard/:path*"],
};
