import LoyaltyCard from "../components/LoyaltyCard"; 

export default function Home() {
  // You can change currentStamps here to test different amounts!
  const currentStamps = 3; 
  const customerId = "SQ-USER-987654321";

  return (
    <main className="w-full min-h-screen p-0 m-0 overflow-x-hidden">
      <LoyaltyCard currentStamps={currentStamps} customerId={customerId} />
    </main>
  );
} 