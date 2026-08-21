import LoyaltyCard from "../components/LoyaltyCard";
import { getCustomerStamps, ensureCustomerCard } from "./actions";
import { DEMO_CUSTOMER_ID, resolveCustomerId } from "../lib/loyalty";

export default async function Home({ searchParams }) {
  const params = await searchParams;
  const customerId = resolveCustomerId(
    params?.customerId || params?.customer_id || DEMO_CUSTOMER_ID
  );

  // Best-effort create so first visit has a DB row (no-op if env/RPC missing)
  await ensureCustomerCard(customerId);
  const currentStamps = await getCustomerStamps(customerId);

  return (
    <main className="w-full h-dvh p-0 m-0 overflow-hidden">
      <LoyaltyCard currentStamps={currentStamps} customerId={customerId} />
    </main>
  );
}
