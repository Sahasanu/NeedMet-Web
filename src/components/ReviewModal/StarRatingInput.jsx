import React, { useState } from "react";
import { Star } from "lucide-react";

const RATING_LABELS = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent!",
};

export default function StarRatingInput({
  value = 5,
  onChange,
  disabled = false,
  size = 28,
  showLabel = true,
}) {
  const [hoverRating, setHoverRating] = useState(0);

  const activeRating = hoverRating || value;

  const handleKeyDown = (e, rating) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onChange && onChange(rating);
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      if (value < 5) onChange && onChange(value + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      if (value > 1) onChange && onChange(value - 1);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="flex items-center gap-1.5 focus:outline-none"
        role="radiogroup"
        aria-label="Star Rating"
        onMouseLeave={() => setHoverRating(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= activeRating;

          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`${star} star${star > 1 ? "s" : ""}: ${RATING_LABELS[star]}`}
              disabled={disabled}
              onClick={() => onChange && onChange(star)}
              onMouseEnter={() => !disabled && setHoverRating(star)}
              onKeyDown={(e) => handleKeyDown(e, star)}
              className={`p-1 rounded-md transition-all duration-150 transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#0f5c3e] focus:ring-offset-1 disabled:pointer-events-none disabled:opacity-60 cursor-pointer ${
                isFilled ? "text-[#f59e0b]" : "text-slate-300 hover:text-amber-200"
              }`}
            >
              <Star
                size={size}
                className={`transition-colors duration-150 ${
                  isFilled ? "fill-[#f59e0b] stroke-[#f59e0b]" : "stroke-slate-300"
                }`}
              />
            </button>
          );
        })}

        {showLabel && (
          <span className="ml-2.5 text-xs sm:text-sm font-semibold text-slate-700 min-w-[70px]">
            {RATING_LABELS[activeRating] || ""}
          </span>
        )}
      </div>
    </div>
  );
}
