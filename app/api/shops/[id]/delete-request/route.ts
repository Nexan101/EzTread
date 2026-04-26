import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendDeletionConfirmation } from "@/lib/email";
import { z } from "zod";

const Schema = z.object({
  email:  z.string().email(),
  reason: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Valid email required." }, { status: 400 });
    }

    const { email, reason } = parsed.data;

    // Verify ownership: email must match shop's registered email
    const { data: shop, error } = await supabaseAdmin
      .from("shops")
      .select("id, name, email, status")
      .eq("id", id)
      .single();

    if (error || !shop) {
      return NextResponse.json({ error: "Shop not found." }, { status: 404 });
    }

    if (shop.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: "Email does not match shop records." }, { status: 403 });
    }

    if (shop.status === "deleted") {
      return NextResponse.json({ error: "Shop is already deleted." }, { status: 409 });
    }

    // Soft delete
    const { error: updateError } = await supabaseAdmin
      .from("shops")
      .update({
        status:          "deleted",
        deleted_at:      new Date().toISOString(),
        deletion_reason: reason ?? "Owner requested removal",
      })
      .eq("id", id);

    if (updateError) throw updateError;

    // Confirm via email (non-blocking)
    sendDeletionConfirmation({ name: shop.name, email: shop.email }).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/shops/[id]/delete-request]", err);
    return NextResponse.json({ error: "Failed to process deletion request." }, { status: 500 });
  }
}
