import React, { useEffect, useRef, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PenLine, MessageSquareQuote } from "lucide-react";
import TestimonialCard from "../../../components/Testimonial/TestimonialCard.jsx";
import { getApprovedReviews } from "../../../services/reviewService";
import { ReviewFormModal } from "../../../components/ReviewModal";

export default function TestimonialSection() {
  const sliderRef = useRef(null);
  const animationRef = useRef(null);
  const currentTranslate = useRef(0);
  const [pauseSlider, setPauseSlider] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Fetch approved reviews from backend with React Query
  const { data: approvedReviews = [], refetch, isLoading } = useQuery({
    queryKey: ["testimonials", "approved"],
    queryFn: () => getApprovedReviews(20),
    staleTime: 60 * 1000,
    placeholderData: [],
  });

  // Listen for review moderation updates
  useEffect(() => {
    const handleReviewsChanged = () => {
      refetch();
    };

    window.addEventListener("needmet:reviews_changed", handleReviewsChanged);
    return () => {
      window.removeEventListener("needmet:reviews_changed", handleReviewsChanged);
    };
  }, [refetch]);

  // Build duplicated strip for seamless infinite carousel
  const loopTestimonials = useMemo(() => {
    if (!approvedReviews.length) return [];
    let list = [...approvedReviews];
    while (list.length < 12) {
      list = [...list, ...approvedReviews];
    }
    return [...list, ...list];
  }, [approvedReviews]);

  // Animation Speed
  const speed = 1.2;

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider || !loopTestimonials.length) return;

    const singleSetWidth = slider.scrollWidth / 2;

    const animate = () => {
      if (!pauseSlider) {
        currentTranslate.current += speed;

        if (currentTranslate.current >= singleSetWidth) {
          currentTranslate.current = 0;
        }

        slider.style.transform = `translate3d(-${currentTranslate.current}px, 0, 0)`;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [pauseSlider, loopTestimonials]);

  return (
    <section className="relative isolate overflow-hidden font-primary bg-primary-surface py-[30px] sm:py-[35px] lg:py-[45px]">
      <div
        className="absolute rounded-full blur-[90px] opacity-35 pointer-events-none top-12 sm:top-16 -left-[60px] w-[260px] h-[260px] sm:w-[360px] sm:h-[360px] lg:w-[460px] lg:h-[460px]"
        style={{ background: "radial-gradient(circle, rgba(34, 196, 122, 0.22) 0%, transparent 70%)" }}
      />

      <div
        className="absolute rounded-full blur-[90px] opacity-45 pointer-events-none -bottom-[120px] -right-[80px] w-[220px] h-[220px] sm:w-[300px] sm:h-[300px] lg:w-[360px] lg:h-[360px]"
        style={{ background: "radial-gradient(circle, rgba(26, 138, 90, 0.22) 0%, transparent 70%)" }}
      />

      {/* ── Section Header with Write a Review Button ── */}
      <div className="px-[18px] sm:px-8 lg:px-[70px] mb-6 md:mb-[34px] lg:mb-[46px] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="inline-block font-primary text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.14em] sm:tracking-[0.18em] text-primary-light mb-3 sm:mb-3.5">
            Real Stories
          </span>

          <h2 className="m-0 font-display font-bold text-text-accent tracking-[-0.03em] leading-[1.1] text-[34px] sm:text-[clamp(30px,5vw,44px)] lg:text-[clamp(36px,5vw,58px)]">
            Loved by Users <br />
            <span className="text-primary-light">Across India</span>
          </h2>
        </div>

        {/* Action Button to Open Review Modal */}
        <button
          type="button"
          onClick={() => setIsReviewModalOpen(true)}
          className="self-start sm:self-end inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-[#0f5c3e] hover:bg-[#1a8a5a] text-white font-medium text-xs sm:text-sm transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          <PenLine size={15} />
          <span>Write a Review</span>
        </button>
      </div>

      {/* ── Testimonial Content ── */}
      {approvedReviews.length === 0 ? (
        <div className="px-[18px] sm:px-8 lg:px-[70px] py-8">
          <div className="max-w-md mx-auto text-center p-8 bg-white/70 backdrop-blur-xs rounded-2xl border border-emerald-100 shadow-xs">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-[#0f5c3e] flex items-center justify-center mb-3">
              <MessageSquareQuote size={22} />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              No Reviews Yet
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              Have you found a great room, local service, or business on NeedMet? Be the first to share your experience with our community!
            </p>
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0f5c3e] hover:bg-[#1a8a5a] text-white text-xs font-bold transition cursor-pointer shadow-xs"
            >
              <PenLine size={13} />
              <span>Share Your Review</span>
            </button>
          </div>
        </div>
      ) : (
        /* ── Infinite Scrolling Testimonial Marquee ── */
        <div className="relative overflow-hidden">
          <div
            className="absolute top-0 bottom-0 left-0 w-[40px] md:w-[70px] lg:w-[130px] z-[2] pointer-events-none"
            style={{ background: "linear-gradient(to right, var(--primary-surface, #e8f5ee) 0%, transparent 100%)" }}
          />

          <div
            className="overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseEnter={() => setPauseSlider(true)}
            onMouseLeave={() => setPauseSlider(false)}
          >
            <div
              className="flex items-stretch gap-4 sm:gap-5 lg:gap-6 w-max px-[18px] py-[10px] pb-[18px] sm:px-7 sm:py-[14px] sm:pb-6 lg:px-[42px] lg:py-[18px] lg:pb-7 [will-change:transform] [transform:translate3d(0,0,0)] [backface-visibility:hidden] [-webkit-font-smoothing:antialiased]"
              ref={sliderRef}
            >
              {loopTestimonials.map((testimonial, index) => (
                <TestimonialCard
                  key={`${testimonial.id}-${index}`}
                  {...testimonial}
                />
              ))}
            </div>
          </div>

          <div
            className="absolute top-0 bottom-0 right-0 w-[40px] md:w-[70px] lg:w-[130px] z-[2] pointer-events-none"
            style={{ background: "linear-gradient(to left, var(--primary-surface, #e8f5ee) 0%, transparent 100%)" }}
          />
        </div>
      )}

      {/* ── Review Form Modal ── */}
      <ReviewFormModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </section>
  );
}