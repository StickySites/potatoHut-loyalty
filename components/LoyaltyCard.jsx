"use client";
import Image from "next/image";
import Barcode from "react-barcode";

export default function LoyaltyCard({ currentStamps, customerId }) {
  const maxStamps = 8;
  const stampGrid = Array.from({ length: maxStamps });

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-2xl shadow-sm flex flex-col items-center">
      <h2 className="text-xl font-bold text-center mb-6">Your Potato Hut Card</h2>

      {/* THE OVERLAY CONTAINER — aspect ratio must match empty-card.png's real dimensions */}
      <div className="relative w-full max-w-[320px] aspect-[320/550] mx-auto mb-8 overflow-hidden bg-white shadow-sm border border-gray-200 rounded-lg">

        {/* 1. The Base Card Image (Background) */}
        <Image
          src="/assets/empty-card.png"
          alt="Empty Rewards Card"
          fill
          className="object-cover"
          priority
        />

        {/* The Stamp Grid — two independent rows, positioned as % of card height */}
        <div className="absolute inset-0">
          {/* Row 1 */}
          <div className="absolute top-[30%] left-0 w-full px-8 flex justify-between">
            {stampGrid.slice(0, 4).map((_, index) => {
              const isEarned = index < currentStamps;
              return (
                <div key={index} className="relative w-[18%] aspect-square flex items-center justify-center">
                  {isEarned && (
                    <div className="relative w-4/5 h-4/5">
                      <Image
                        src="/assets/stamp.png"
                        alt="Potato Stamp"
                        fill
                        className="object-contain drop-shadow-sm"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Row 2 */}
          <div className="absolute top-[43%] left-0 w-full px-8 flex justify-between">
            {stampGrid.slice(4, 8).map((_, index) => {
              const realIndex = index + 4;
              const isEarned = realIndex < currentStamps;
              return (
                <div key={realIndex} className="relative w-[18%] aspect-square flex items-center justify-center">
                  {isEarned && (
                    <div className="relative w-4/5 h-4/5">
                      <Image
                        src="/assets/stamp.png"
                        alt="Potato Stamp"
                        fill
                        className="object-contain drop-shadow-sm"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* The Barcode Overlay (Pinned to the absolute bottom) */}
        <div className="absolute bottom-[8%] w-full flex justify-center z-10">
          <div className="bg-white/95 px-3 py-1 rounded shadow-md border border-gray-200">
            <Barcode
              value={customerId || "000000000"}
              width={1.2}
              height={35}
              displayValue={false}
              background="transparent"
              lineColor="#000000"
              margin={0}
            />
          </div>
        </div>
      </div>

      <div className="text-center text-sm font-medium mb-8">
        {currentStamps >= maxStamps
          ? "You've earned a free meal!"
          : `${maxStamps - currentStamps} stamps until your next reward`}
      </div>
    </div>
  );
}