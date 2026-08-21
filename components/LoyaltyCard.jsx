"use client";
import Image from "next/image";
import Link from "next/link";
import QRCode from "react-qr-code";

export default function LoyaltyCard({ currentStamps = 0, customerId = "SQ-USER-987654321" }) {
  // DB stores 0–7 earned stamps. Slot 8 is always the yellow FREE marker (not a fillable stamp).
  const maxEarnedStamps = 7;
  const totalSlots = 8;
  const stamps = Math.min(Math.max(0, Number(currentStamps) || 0), maxEarnedStamps);
  const stampGrid = Array.from({ length: totalSlots });

  return (
    <div
      className="w-full h-dvh min-h-dvh flex items-center justify-center px-4 font-sans"
      style={{
        backgroundImage: "url('/assets/4cbb672ead660d65ea30ddb6f2e59fd3d9b56f78.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed"
      }}
    >
      {/* One ticket: shell matches empty-card.png (720×1280), capped at 90dvh. */}
      <div
        className="relative w-full shrink-0 overflow-hidden rounded-3xl shadow-2xl border border-gray-200 aspect-[720/1280] max-h-[90dvh]"
        style={{ maxWidth: "min(28rem, calc(90dvh * 720 / 1280))" }}
      >
        <Image
          src="/assets/empty-card.png"
          alt="Empty Rewards Card"
          fill
          sizes="(max-width: 448px) 100vw, 448px"
          className="object-contain object-top"
          priority
        />

        <div className="absolute top-[24.5%] inset-x-0 z-20 px-6 sm:px-8 flex justify-center">
          <span className="text-sm sm:text-[15px] font-bold text-gray-800 text-center">
            {stamps >= maxEarnedStamps
              ? "You've earned a free meal! "
              : `${maxEarnedStamps - stamps} stamps until your next reward`}
          </span>
        </div>

        <div className="absolute z-10 left-[6%] w-[87.5%] top-[29%] h-[25.6%] grid grid-cols-4 grid-rows-2">
          {stampGrid.map((_, index) => {
            const isFreeSlot = index === 7;
            const isEarned = !isFreeSlot && index < stamps;

            return (
              <div key={index} className="flex items-center justify-center">
                {isEarned && (
                  <div className="relative aspect-square w-[80%] shrink-0">
                    <Image
                      src="/assets/stamp.png"
                      alt="Potato Stamp"
                      fill
                      sizes="20vw"
                      className="object-contain object-center drop-shadow-sm"
                    />
                  </div>
                )}

                {isFreeSlot && (
                  <div
                    className="aspect-square w-[80%] shrink-0 bg-[#F2C05D] drop-shadow-sm"
                    style={{
                      maskImage: "url('/assets/stamp.png')",
                      WebkitMaskImage: "url('/assets/stamp.png')",
                      maskSize: "contain",
                      WebkitMaskSize: "contain",
                      maskRepeat: "no-repeat",
                      WebkitMaskRepeat: "no-repeat",
                      maskPosition: "center",
                      WebkitMaskPosition: "center"
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Yellow footer only (artwork ~66%–94%); terms bar covers the image's thin black strip. */}
        <div className="absolute z-20 inset-x-0 top-[66%] bottom-[8%] flex items-center justify-center px-4">
          <div className="bg-white/95 p-2 rounded-lg shadow-md border border-gray-200 flex flex-col items-center justify-center">
            <QRCode
              value={customerId || "000000000"}
              size={120}
              bgColor="transparent"
              fgColor="#000000"
              level="L"
            />
            <span className="text-[10px] text-gray-500 mt-1 font-mono tracking-tight">
              {customerId || "000000000"}
            </span>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-30 flex items-center justify-center bg-black py-2.5 px-4">
          <div className="bg-white w-auto px-3 py-1 rounded-full shadow-sm flex justify-center gap-x-2.5 text-xs font-semibold text-gray-800">
            <Link href="/terms" className="hover:text-amber-600 transition-colors hover:underline underline-offset-4">
              Terms & Conditions
            </Link>
            <Link href="/privacy" className="hover:text-amber-600 transition-colors hover:underline underline-offset-4">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
