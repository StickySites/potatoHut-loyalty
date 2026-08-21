"use server";

import { getSupabaseAdmin, getSupabaseAnon } from "../utils/supabase";
import { clampStamps, resolveCustomerId } from "../lib/loyalty";

export async function getCustomerStamps(customerId) {
  const id = resolveCustomerId(customerId);

  try {
    const supabase = getSupabaseAnon();
    const { data, error } = await supabase
      .from("loyalty_cards")
      .select("stamps")
      .eq("customer_id", id)
      .maybeSingle();

    if (error) {
      console.error("getCustomerStamps:", error.message);
      return 0;
    }

    if (!data) return 0;
    return clampStamps(data.stamps);
  } catch (err) {
    console.error("getCustomerStamps:", err.message);
    return 0;
  }
}

/** Create a 0-stamp card if missing (service role). Safe no-op if RPC unavailable. */
export async function ensureCustomerCard(customerId) {
  const id = resolveCustomerId(customerId);

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.rpc("ensure_loyalty_card", { c_id: id });
    if (error) console.error("ensureCustomerCard:", error.message);
  } catch (err) {
    console.error("ensureCustomerCard:", err.message);
  }
}
