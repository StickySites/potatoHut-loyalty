import Link from "next/link";

export const metadata = {
  title: "Terms & Conditions | Potato Hut Loyalty",
};

export default function TermsPage() {
  return (
    <main className="min-h-dvh bg-[#f7f4ee] px-6 py-10 font-sans text-gray-800">
      <div className="max-w-md mx-auto">
        <Link href="/" className="text-sm font-semibold text-amber-700 hover:underline">
          ← Back to card
        </Link>
        <h1 className="mt-6 text-2xl font-bold">Terms & Conditions</h1>
        <p className="mt-4 text-sm leading-relaxed text-gray-600">
          Potato Hut loyalty programme terms and conditions will be published here.
        </p>
      </div>
    </main>
  );
}
