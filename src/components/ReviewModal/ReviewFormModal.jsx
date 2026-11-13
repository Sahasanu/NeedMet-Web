import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  X,
  Star,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogIn,
  MapPin,
  User,
} from "lucide-react";
import StarRatingInput from "./StarRatingInput";
import { submitReview } from "../../services/reviewService";
import { useAuth } from "../../contexts/authContext";

export default function ReviewFormModal({ isOpen, onClose, onSuccess }) {
  const { userLoggedIn, currentUser, userData } = useAuth();

  // Form states matching schema (name is resolved automatically from userId)
  const [rating, setRating] = useState(5);
  const [location, setLocation] = useState("");
  const [review, setReview] = useState("");

  // Submission & feedback states
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Pre-fill location if user profile has it
  useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      setSuccessMsg("");
      if (userData?.city || userData?.location) {
        setLocation(userData.city || userData.location);
      }
    }
  }, [isOpen, userData]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !submitting) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, submitting]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleClose = () => {
    if (submitting) return;
    setErrorMsg("");
    setSuccessMsg("");
    onClose && onClose();
  };

  const resolvedUserName =
    userData?.name ||
    currentUser?.displayName ||
    (currentUser?.phoneNumber ? `User ${currentUser.phoneNumber.slice(-4)}` : "Verified Member");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!userLoggedIn || !currentUser) {
      setErrorMsg("You must be logged in to submit a review.");
      return;
    }

    const trimmedReview = review.trim();

    if (!trimmedReview || trimmedReview.length < 10) {
      setErrorMsg("Please write at least 10 characters describing your experience.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await submitReview({
        rating,
        review: trimmedReview,
        location: location.trim(),
      });

      setSuccessMsg(
        res?.message ||
          "Thank you for sharing your experience! Your review has been submitted for moderation and will appear on the homepage once approved."
      );

      // Reset form
      setReview("");
      setLocation("");
      setRating(5);

      if (onSuccess) onSuccess();

      setTimeout(() => {
        handleClose();
      }, 3500);
    } catch (err) {
      console.error("Failed to submit review:", err);
      setErrorMsg(err.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="relative px-5 sm:px-7 pt-6 pb-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50/50 via-white to-slate-50">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#0f5c3e] mb-1">
                Your Feedback Matters
              </span>
              <h3
                id="review-modal-title"
                className="text-lg sm:text-xl font-bold font-display text-slate-800"
              >
                Share Your Experience
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Help other users discover trusted local services on NeedMet.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer disabled:opacity-50"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Modal Body ── */}
        <div className="px-5 sm:px-7 py-5 overflow-y-auto flex-1 space-y-4 text-slate-700">
          {/* If user is not logged in: show Login gate */}
          {!userLoggedIn ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#0f5c3e]">
                <LogIn size={26} />
              </div>
              <div className="space-y-1">
                <h4 className="text-base sm:text-lg font-bold text-slate-800">
                  Please Sign In to Write a Review
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Only logged-in members can share reviews to guarantee authentic, trusted feedback for our community.
                </p>
              </div>

              <div className="pt-2 flex justify-center">
                <Link
                  to="/login"
                  onClick={handleClose}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#0f5c3e] hover:bg-[#1a8a5a] text-white font-bold text-xs sm:text-sm shadow-xs hover:shadow-md transition cursor-pointer"
                >
                  <LogIn size={15} />
                  <span>Sign In Now</span>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Success Banner */}
              {successMsg && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-emerald-900">Review Submitted!</p>
                    <p className="mt-0.5 text-emerald-700 leading-relaxed">{successMsg}</p>
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5 animate-in shake">
                  <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{errorMsg}</p>
                </div>
              )}

              {!successMsg && (
                <form id="review-submission-form" onSubmit={handleSubmit} className="space-y-4">
                  {/* Verified Member Badge (Name resolved automatically from User ID) */}
                  <div className="flex items-center gap-2.5 p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl text-xs text-slate-700">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1a8a5a] to-[#0f5c3e] text-white flex items-center justify-center font-bold text-xs shrink-0 select-none">
                      {resolvedUserName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-slate-400 text-[10px] block font-medium">Posting review as</span>
                      <span className="font-bold text-slate-800 truncate block">
                        {resolvedUserName}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-[#0f5c3e] bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                      Verified Member
                    </span>
                  </div>

                  {/* Rating Input */}
                  <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Your Rating <span className="text-rose-500">*</span>
                      </label>
                      <p className="text-[11px] text-slate-500">Tap a star to rate</p>
                    </div>
                    <StarRatingInput
                      value={rating}
                      onChange={(val) => setRating(val)}
                      disabled={submitting}
                      size={26}
                    />
                  </div>

                  {/* Review Text */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label
                        htmlFor="review-text-input"
                        className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                      >
                        Your Review <span className="text-rose-500">*</span>
                      </label>
                      <span
                        className={`text-[11px] ${
                          review.length > 500 ? "text-rose-500 font-bold" : "text-slate-400"
                        }`}
                      >
                        {review.length}/500
                      </span>
                    </div>
                    <textarea
                      id="review-text-input"
                      rows={4}
                      required
                      disabled={submitting}
                      maxLength={500}
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      placeholder="Share your honest experience with local services on NeedMet..."
                      className="w-full text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 bg-white border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-[#0f5c3e] focus:ring-2 focus:ring-[#0f5c3e]/15 transition resize-none disabled:bg-slate-50 disabled:opacity-75"
                    />
                  </div>

                  {/* Location Input (Optional) */}
                  <div>
                    <label
                      htmlFor="review-location-input"
                      className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
                    >
                      City / Location <span className="text-slate-400 font-normal text-[10px]">(Optional)</span>
                    </label>
                    <div className="relative">
                      <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        id="review-location-input"
                        type="text"
                        disabled={submitting}
                        maxLength={50}
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Haldia, Kolkata"
                        className="w-full pl-8 pr-3 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0f5c3e] focus:ring-2 focus:ring-[#0f5c3e]/15 transition disabled:bg-slate-50"
                      />
                    </div>
                  </div>

                  {/* Moderation Note */}
                  <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 leading-relaxed">
                    <span className="font-semibold text-slate-700">Notice:</span> All submitted reviews undergo administrative moderation before appearing publicly on the homepage.
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        {/* ── Modal Footer ── */}
        <div className="px-5 sm:px-7 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition cursor-pointer disabled:opacity-50"
          >
            {successMsg || !userLoggedIn ? "Close" : "Cancel"}
          </button>

          {userLoggedIn && !successMsg && (
            <button
              type="submit"
              form="review-submission-form"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 sm:py-2.5 rounded-full bg-[#0f5c3e] hover:bg-[#1a8a5a] text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Star size={15} className="fill-white" />
                  <span>Submit Review</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
