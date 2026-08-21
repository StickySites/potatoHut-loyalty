import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../utils/supabase";
import { getStampThresholdCents, resolveCustomerId } from "../../../lib/loyalty";

function extractPayment(body) {
  const payment = body?.data?.object?.payment;
  if (payment) return payment;

  if (body?.data?.object?.id && body?.data?.object?.amount_money) {
    return body.data.object;
  }

  return null;
}

function extractRefund(body) {
  return body?.data?.object?.refund || null;
}

function customerIdFromPayment(payment) {
  // Staff flow: scan loyalty QR into Square payment reference_id
  const fromRef = payment?.reference_id;
  if (typeof fromRef === "string" && fromRef.trim()) return fromRef.trim();

  const fromCustomer = payment?.customer_id;
  if (typeof fromCustomer === "string" && fromCustomer.trim()) {
    return fromCustomer.trim();
  }

  return null;
}

function verifySquareSecret(request) {
  const expected = process.env.SQUARE_WEBHOOK_SECRET;
  if (!expected) return true; // optional until configured

  const provided =
    request.headers.get("x-loyalty-webhook-secret") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  return provided === expected;
}

/**
 * Square webhook: credit a stamp when a completed payment linked to a loyalty
 * customer meets LOYALTY_STAMP_THRESHOLD_CENTS; debit on refund if previously credited.
 *
 * Customer linkage: payment.reference_id (preferred) or payment.customer_id.
 * Configure Square → POST /api/square
 */
export async function POST(request) {
  try {
    if (!verifySquareSecret(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const eventType = body?.type || "";
    const threshold = getStampThresholdCents();
    const supabase = getSupabaseAdmin();

    // --- Refund → decrement if we previously stamped this payment ---
    if (eventType.startsWith("refund.")) {
      const refund = extractRefund(body);
      const paymentId = refund?.payment_id;

      if (!paymentId) {
        return NextResponse.json(
          { error: "No payment_id on refund" },
          { status: 400 }
        );
      }

      const { data: prior } = await supabase
        .from("loyalty_payment_events")
        .select("customer_id, amount_cents")
        .eq("payment_id", paymentId)
        .eq("direction", "credit")
        .maybeSingle();

      if (!prior) {
        return NextResponse.json({
          success: true,
          skipped: true,
          reason: "No prior stamp credit for this payment",
        });
      }

      const { data, error } = await supabase.rpc("apply_loyalty_payment_debit", {
        c_id: prior.customer_id,
        p_id: paymentId,
        amount_cents: refund?.amount_money?.amount ?? prior.amount_cents ?? 0,
      });

      if (error) {
        return NextResponse.json(
          { error: "Supabase Error", details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        action: "debit",
        customerId: prior.customer_id,
        currentStamps: data,
      });
    }

    // --- Payment completed → maybe credit ---
    const payment = extractPayment(body);
    if (!payment) {
      return NextResponse.json(
        { error: "No payment object in payload" },
        { status: 400 }
      );
    }

    const status = (payment.status || "").toUpperCase();
    if (status && status !== "COMPLETED") {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: `Payment status is ${status}, not COMPLETED`,
      });
    }

    const rawCustomerId = customerIdFromPayment(payment);
    if (!rawCustomerId) {
      return NextResponse.json(
        {
          error: "No reference ID attached",
          hint: "Set Square payment.reference_id to the loyalty customerId (QR value)",
        },
        { status: 400 }
      );
    }

    const customerId = resolveCustomerId(rawCustomerId);
    const paymentId = payment.id;
    const amountCents = Number(payment?.amount_money?.amount ?? 0);

    if (!paymentId) {
      return NextResponse.json(
        { error: "Payment missing id" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc("apply_loyalty_payment_credit", {
      c_id: customerId,
      p_id: paymentId,
      amount_cents: amountCents,
      threshold_cents: threshold,
    });

    if (error) {
      return NextResponse.json(
        { error: "Supabase Error", details: error.message },
        { status: 500 }
      );
    }

    const earned = amountCents >= threshold;

    return NextResponse.json({
      success: true,
      action: earned ? "credit" : "skipped_below_threshold",
      message: earned ? "Stamp added!" : "Payment below stamp threshold",
      customerId,
      amountCents,
      thresholdCents: threshold,
      currentStamps: data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Server Crash", details: error.message },
      { status: 500 }
    );
  }
}
