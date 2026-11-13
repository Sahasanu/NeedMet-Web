import { firestore, auth } from "../firebase/firebaseConfig.js";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
} from "firebase/firestore";

const STORAGE_KEY = "needmet_approved_reviews_cache_v1";
const LAST_SUBMIT_KEY = "needmet_last_review_submit_time";

function getCachedReviews() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Could not read local review cache:", e);
  }
  return [];
}

function setCachedReviews(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn("Could not save local review cache:", e);
  }
}

/**
 * Fetch approved real reviews from Firestore for public homepage display.
 * @param {number} limitCount - Maximum number of approved reviews to retrieve.
 * @returns {Promise<Array>} Array of approved reviews
 */
export async function getApprovedReviews(limitCount = 12) {
  try {
    const reviewsRef = collection(firestore, "reviews");
    let items = [];

    // 1. Try querying where status == 'approved' (without orderBy to avoid requiring a composite index!)
    try {
      const q = query(
        reviewsRef,
        where("status", "==", "approved")
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        items = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            name: d.name || "Customer",
            rating: Number(d.rating) || 5,
            review: d.review || d.quote || d.text || "",
            quote: d.quote || d.review || "",
            location: d.location || "",
            status: d.status || "approved",
            userId: d.userId,
            createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt,
          };
        });
      }
    } catch (queryErr) {
      console.warn("Direct where('status') query failed, trying full collection fallback:", queryErr.message);
    }

    // 2. If items is still empty, do fallback: fetch collection directly and filter in-memory
    if (!items.length) {
      try {
        const allSnap = await getDocs(reviewsRef);
        allSnap.forEach((docSnap) => {
          const d = docSnap.data();
          const s = (d.status || "").toLowerCase();
          if (s === "approved") {
            items.push({
              id: docSnap.id,
              name: d.name || "Customer",
              rating: Number(d.rating) || 5,
              review: d.review || d.quote || d.text || "",
              quote: d.quote || d.review || "",
              location: d.location || "",
              status: "approved",
              userId: d.userId,
              createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt,
            });
          }
        });
      } catch (fallbackErr) {
        console.warn("Full collection fallback failed:", fallbackErr.message);
      }
    }

    if (items.length > 0) {
      // Sort in-memory by newest first
      items.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      const sliced = items.slice(0, limitCount);
      setCachedReviews(sliced);
      return sliced;
    }

    return [];
  } catch (error) {
    console.warn("Firestore approved reviews fetch error:", error.message);
    return getCachedReviews();
  }
}

/**
 * Submit a customer review.
 * Only authenticated (logged-in) users can give a review.
 * Name is automatically fetched from the user ID / profile and not taken from the form.
 * All submitted reviews are created with status="pending" and require admin approval.
 *
 * @param {Object} reviewData
 * @param {number} reviewData.rating
 * @param {string} reviewData.review
 * @param {string} [reviewData.location]
 * @returns {Promise<{success: boolean, message: string, reviewId?: string}>}
 */
export async function submitReview({
  rating,
  review,
  location = "",
}) {
  // 1. Strictly enforce authentication: only logged-in users can give a review
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("You must be logged in to submit a review. Please sign in to continue.");
  }

  // 2. Resolve name from userId
  let reviewerName = currentUser.displayName || "";
  try {
    const userDocSnap = await getDoc(doc(firestore, "users", currentUser.uid));
    if (userDocSnap.exists()) {
      const uData = userDocSnap.data();
      reviewerName = uData.name || uData.displayName || reviewerName;
    }
  } catch (err) {
    console.warn("Could not fetch user document for name, using fallback:", err);
  }

  if (!reviewerName) {
    reviewerName = currentUser.phoneNumber
      ? `User ${currentUser.phoneNumber.slice(-4)}`
      : "Verified Member";
  }

  const trimmedName = reviewerName.trim();

  const parsedRating = Math.round(Number(rating));
  if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    throw new Error("Please select a rating between 1 and 5 stars.");
  }

  const trimmedReview = (review || "").trim();
  if (trimmedReview.length < 10 || trimmedReview.length > 600) {
    throw new Error("Review text must be between 10 and 600 characters.");
  }

  // 3. Client cooldown rate limit
  const lastSubmit = localStorage.getItem(LAST_SUBMIT_KEY);
  if (lastSubmit) {
    const elapsed = Date.now() - parseInt(lastSubmit, 10);
    const cooldownMs = 20 * 1000;
    if (elapsed < cooldownMs) {
      const waitSec = Math.ceil((cooldownMs - elapsed) / 1000);
      throw new Error(`Please wait ${waitSec} seconds before submitting another review.`);
    }
  }

  const payload = {
    name: trimmedName,
    rating: parsedRating,
    review: trimmedReview,
    location: (location || "").trim().slice(0, 50),
    status: "pending",
    userId: currentUser.uid,
  };

  // 4. Try Cloud Functions API with auth token
  let token = null;
  try {
    token = await currentUser.getIdToken();
  } catch (_) {}

  try {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem(LAST_SUBMIT_KEY, Date.now().toString());
      return {
        success: true,
        message:
          data.message ||
          "Thank you! Your review has been submitted for moderation and will appear publicly once approved.",
      };
    }

    if (res.status === 401) {
      throw new Error("You must be signed in to submit a review.");
    }

    if (res.status === 429) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Too many submissions. Please wait a few moments.");
    }
  } catch (apiErr) {
    if (
      apiErr.message.includes("signed in") ||
      apiErr.message.includes("Too many submissions")
    ) {
      throw apiErr;
    }
    console.warn("API submission failed, attempting direct Firestore save:", apiErr.message);
  }

  // 5. Fallback: Direct Firestore creation with status: "pending" and verified userId
  const docRef = await addDoc(collection(firestore, "reviews"), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  localStorage.setItem(LAST_SUBMIT_KEY, Date.now().toString());

  return {
    success: true,
    message: "Thank you! Your review has been submitted for moderation and will appear publicly once approved.",
    reviewId: docRef.id,
  };
}
