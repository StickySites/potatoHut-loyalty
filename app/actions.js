"use server";

import { supabase } from '../utils/supabase';

export async function getCustomerStamps(customerId) {
  const { data, error } = await supabase
    .from('loyalty_cards')
    .select('stamps')
    .eq('customer_id', customerId)
    .single();

  if (error || !data) return 0; // If they don't exist yet, return 0 stamps
  return data.stamps;
}