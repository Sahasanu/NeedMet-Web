import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPartners } from "../../../services/partnerService";

/**
 * BrandPartnerSection (Our Partners)
 * Infinite scrolling marquee showcasing authorized brand partners and dealers.
 * Dynamically configurable from Admin Panel with real-time Firestore sync.
 */
export default function PartnerNetworkSection() {
  const { data: partners = [], refetch } = useQuery({
    queryKey: ["partners", "active"],
    queryFn: () => getPartners("active"),
    staleTime: 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  // Listen for admin changes broadcast from partnerService
  useEffect(() => {
    const handlePartnersChanged = () => {
      refetch();
    };

    window.addEventListener("needmet:partners_changed", handlePartnersChanged);
    return () => {
      window.removeEventListener("needmet:partners_changed", handlePartnersChanged);
    };
  }, [refetch]);

  // Filter active partners with a valid logo
  const activeBrands = (Array.isArray(partners) ? partners : [])
    .filter((b) => b && b.isActive !== false && (b.logo || b.img));

  if (activeBrands.length === 0) {
    return null;
  }

  // Ensure enough items so that marquee fills wide screens seamlessly before repeating
  let repeatedList = [...activeBrands];
  while (repeatedList.length < 12) {
    repeatedList = [...repeatedList, ...activeBrands];
  }
  const marqueeList = [...repeatedList, ...repeatedList];

  return (
    <section id="partners" className="w-full py-8 sm:py-12 bg-white overflow-hidden font-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="text-center mb-6 sm:mb-9">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
            Brand Partner and Dealer
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium max-w-xl mx-auto">
            Collaborating with trusted brands and verified partners across our community
          </p>
          <div className="w-12 h-1 bg-[#0f5c3e]/70 rounded-full mx-auto mt-2" />
        </div>

        {/* Marquee Wrapper with soft edge fades */}
        <div className="relative w-full overflow-hidden group">
          {/* Subtle Left and Right Vignette Fade */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-l from-white via-white/80 to-transparent z-10" />

          {/* Marquee Track */}
          <div className="flex w-max animate-brand-marquee group-hover:[animation-play-state:paused] py-2 gap-3 sm:gap-4 select-none">
            {marqueeList.map((brand, index) => {
              const content = (
                <div
                  className="w-[130px] sm:w-[160px] md:w-[175px] h-[72px] sm:h-[84px] md:h-[90px] rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md transition-all duration-300 flex items-center justify-center p-3 sm:p-4 shrink-0 hover:scale-105 hover:border-[#0f5c3e]/40"
                  title={brand.name}
                >
                  <img
                    src={brand.logo || brand.img}
                    alt={brand.name || "Brand Logo"}
                    className="max-h-full max-w-full object-contain filter contrast-105"
                    loading="lazy"
                  />
                </div>
              );

              return brand.website ? (
                <a
                  key={`${brand.id || index}-${index}`}
                  href={brand.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer"
                >
                  {content}
                </a>
              ) : (
                <div key={`${brand.id || index}-${index}`}>
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export { PartnerNetworkSection as BrandPartnerSection };
