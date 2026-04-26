import { NextResponse } from "next/server";
import { sendShopSignupConfirmation, sendAdminNewShopNotification } from "@/lib/email";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Only available in development." }, { status: 403 });
  }

  const testShop = {
    shopName: "Test Tire Shop",
    address:  "123 Main St",
    city:     "Houston",
    state:    "TX",
    zip:      "77001",
    phone:    "(713) 555-0100",
    email:    process.env.ADMIN_EMAILS?.split(",")[0].trim() ?? "test@example.com",
    shopId:   "00000000-0000-0000-0000-000000000000",
  };

  const [shopResult, adminResult] = await Promise.allSettled([
    sendShopSignupConfirmation(testShop),
    sendAdminNewShopNotification(testShop),
  ]);

  return NextResponse.json({
    shop_confirmation: shopResult.status === "fulfilled" ? shopResult.value : { success: false, error: String(shopResult.reason) },
    admin_notification: adminResult.status === "fulfilled" ? adminResult.value : { success: false, error: String(adminResult.reason) },
  });
}
