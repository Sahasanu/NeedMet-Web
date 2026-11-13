import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PenLine, Star, MessageSquareQuote, ShieldCheck } from "lucide-react";
import TestimonialCard from "../../components/Testimonial/TestimonialCard.jsx";
import { getApprovedReviews } from "../../services/reviewService";
import { ReviewFormModal } from "../../components/ReviewModal";

export default function ReviewsFeedbackPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: approvedReviews = [], refetch, isLoading } = useQuery({
    queryKey: ["testimonials", "approved"],
    queryFn: () => getApprovedReviews(24),
    staleTime: 60 * 1000,
  });

  return (
    <div className="min-h-screen bg-slate-50/60 font-primary">
      {/* ── Page Header Banner ── */}
      <section className="bg-gradient-to-b from-[#e8f5ee] to-white border-b border-emerald-100/60 py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#0f5c3e] text-xs font-bold uppercase tracking-wider mb-4">
            <MessageSquareQuote size={13} />
            Community Voice
          </span>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-slate-900 tracking-tight">
            Customer Reviews & Feedback
          </h1>

          <p className="mt-3 text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Discover real experiences from students, shop owners, and local residents who use NeedMet every day across India.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0f5c3e] hover:bg-[#1a8a5a] text-white font-bold text-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition cursor-pointer"
            >
              <PenLine size={16} />
              <span>Share Your Review</span>
            </button>

            <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-medium">
              <ShieldCheck size={14} className="text-[#0f5c3e]" />
              <span>Verified Customer Moderation</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Reviews Grid ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 font-display">
              Testimonials
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Approved reviews from verified users
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-[#0f5c3e] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Loading reviews...</p>
          </div>
        ) : approvedReviews.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/80 p-8 max-w-md mx-auto">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-[#0f5c3e] flex items-center justify-center mb-3">
              <MessageSquareQuote size={22} />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Reviews Yet</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              Be the first logged-in member to share your experience with the NeedMet community!
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#0f5c3e] hover:bg-[#1a8a5a] text-white text-xs font-bold transition cursor-pointer"
            >
              <PenLine size={14} />
              <span>Write a Review</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {approvedReviews.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex justify-center">
                <TestimonialCard {...item} />
              </div>
            ))}
          </div>
        )}
      </main>

      <ReviewFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
