import LoyaltyCard from '../components/LoyaltyCard';
import { getCustomerStamps } from './actions';

export default async function Home() {
  // This is the dummy customer we added to the database earlier
  const customerId = "SQ-USER-987654321";
  
  // Fetch the real stamp count from Supabase
  const currentStamps = await getCustomerStamps(customerId);

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      {/* Pass the real data into your card component */}
      <LoyaltyCard currentStamps={currentStamps} customerId={customerId} />
    </main>
  );
}