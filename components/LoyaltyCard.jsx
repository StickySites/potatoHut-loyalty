"use client";
import Image from "next/image";
import QRCode from "react-qr-code";

export default function LoyaltyCard({ currentStamps = 0, customerId = "SQ-USER-987654321" }) {
  const maxStamps = 8;
  const stampGrid = Array.from({ length: maxStamps });

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-between font-sans"
      style={{
        backgroundImage: "url('/assets/4cbb672ead660d65ea30ddb6f2e59fd3d9b56f78.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed" 
      }}
    >
      
      <div className="flex flex-col items-center w-full max-w-md mx-auto pt-8 px-4 flex-grow">
        
        <div className="mb-6 flex justify-center items-center bg-white/95 backdrop-blur-sm px-6 py-3 rounded-full shadow-sm">
          <Image
            src="/assets/fbb9aff9166f788dba2897b3e063991bebafbc77.png"
            alt="Potato Hut Logo"
            width={180}
            height={40}
            className="object-contain"
            priority
          />
        </div>

        <div className="relative w-full max-w-[320px] aspect-[320/515] mx-auto overflow-hidden shadow-2xl rounded-xl border border-gray-200">

          <Image
            src="/assets/empty-card.png"
            alt="Empty Rewards Card"
            fill
            className="object-cover object-top"
            priority
          />

          <div className="absolute top-[28%] w-full flex justify-center z-20 px-4">
            <span className="text-sm sm:text-[15px] font-bold text-gray-800 text-center">
              {currentStamps >= maxStamps
                ? "You've earned a free meal! "
                : `${maxStamps - currentStamps} stamps until your next reward`}
            </span>
          </div>

          <div className="absolute inset-0 z-10">
            {/* Row 1 */}
            <div className="absolute top-[35%] left-0 w-full px-8 flex justify-between">
              {stampGrid.slice(0, 4).map((_, index) => {
                const isEarned = index < currentStamps;
                return (
                  <div key={index} className="relative w-[18%] aspect-square flex items-center justify-center">
                    {isEarned && (
                      <div className="relative w-[95%] h-[95%]">
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
            <div className="absolute top-[49%] left-0 w-full px-8 flex justify-between">
              {stampGrid.slice(4, 8).map((_, index) => {
                const realIndex = index + 4;
                const isEarned = realIndex < currentStamps;
                const isFreeSlot = realIndex === 7;
                
                return (
                  <div key={realIndex} className="relative w-[18%] aspect-square flex items-center justify-center">
                    
                    {isEarned && (
                      <div className="relative w-[95%] h-[95%]">
                        <Image
                          src="/assets/stamp.png"
                          alt="Potato Stamp"
                          fill
                          className="object-contain drop-shadow-sm"
                        />
                      </div>
                    )}

                    {!isEarned && isFreeSlot && (
                      <div 
                        className="w-[95%] h-[95%] bg-[#F2C05D] drop-shadow-sm"
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
          </div>

          <div className="absolute bottom-[2%] w-full flex justify-center z-20">
            <div className="bg-white/95 p-2 rounded-lg shadow-md border border-gray-200 flex flex-col items-center justify-center">
              <QRCode
                value={customerId || "000000000"}
                size={95}
                bgColor="transparent"
                fgColor="#000000"
                level="L" 
              />
              <span className="text-[10px] text-gray-500 mt-1 font-mono tracking-tight">
                {customerId || "000000000"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cleaned up footer with updated links */}
      <footer className="w-full flex justify-center mt-8 mb-8 px-4">
        <div className="bg-white/95 backdrop-blur-sm px-6 py-3 rounded-full shadow-sm flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold text-gray-700">
          <a href="#" className="hover:text-amber-600 transition-colors hover:underline underline-offset-4">Terms & Conditions</a>
          <a href="#" className="hover:text-amber-600 transition-colors hover:underline underline-offset-4">Privacy Policy</a>
        </div>
      </footer>

    </div>
  );
}