import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../utils/supabase";
import { resolveCustomerId } from "../../../lib/loyalty";

function authorizeRedeem(request) {
  const expected = process.env.LOYALTY_REDEEM_SECRET;
  if (!expected) {
    return {
      ok: false,
      status: 503,
      error: "LOYALTY_REDEEM_SECRET is not configured",
    };
  }

  const provided =
    request.headers.get("x-loyalty-redeem-secret") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!provided || provided !== expected) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  return { ok: true };
}

/**
 * Staff redeem endpoint: when a customer has 7 stamps, POST here to reset to 0.
 *
 *   curl -X POST https://<host>/api/redeem \
 *     -H "Content-Type: application/json" \
 *     -H "x-loyalty-redeem-secret: $LOYALTY_REDEEM_SECRET" \
 *     -d '{"customerId":"SQ-USER-987654321"}'
 */
export async function POST(request) {
  try {
    const auth = authorizeRedeem(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json().catch(() => ({}));
    const customerId = resolveCustomerId(body.customerId || body.customer_id);

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc("redeem_loyalty_reward", {
      c_id: customerId,
    });

    if (error) {
      const message = error.message || "Redeem failed";
      const status = /not available/i.test(message) ? 409 : 500;
      return NextResponse.json(
        { error: "Supabase Error", details: message },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Reward redeemed; stamps reset to 0",
      customerId,
      currentStamps: data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Server Crash", details: error.message },
      { status: 500 }
    );
  }
}
