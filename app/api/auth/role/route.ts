import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const SHOP_OWNER_EMAILS = (process.env.SHOP_OWNER_EMAILS ?? "")
  .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ role: null });

  const email = (user.email ?? "").toLowerCase();
  const role = user.app_metadata?.role as string | undefined;

  if (role === "admin" || ADMIN_EMAILS.includes(email)) {
    return NextResponse.json({ role: "admin" });
  }
  if (role === "shop_owner" || SHOP_OWNER_EMAILS.includes(email)) {
    return NextResponse.json({ role: "shop_owner" });
  }
  return NextResponse.json({ role: "user" });
}
