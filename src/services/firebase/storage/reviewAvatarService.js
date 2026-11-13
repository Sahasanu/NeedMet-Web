import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { storage } from "../../../firebase/firebaseConfig";
import { compressImage } from "../../../utils/imageCompression";

/**
 * Upload reviewer avatar image to Firebase Storage with compression.
 * @param {File} file - The image file to compress & upload.
 * @param {Object} options - Metadata options.
 * @param {string} options.reviewerName - Name of the reviewer.
 * @returns {Promise<string>} Download URL of the uploaded avatar.
 */
export async function uploadReviewAvatar(file, { reviewerName = "user" } = {}) {
  if (!file) throw new Error("No file provided for upload.");

  const fileId = uuidv4();
  const sanitizedName = reviewerName.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 20);

  // Compress avatar for circular thumbnail display
  const compressed = await compressImage(file, {
    maxSizeMB: 0.15,
    maxWidthOrHeight: 400,
    fileType: "image/webp",
    initialQuality: 0.85,
  });

  const storagePath = `reviews/avatars/${sanitizedName}_${fileId}.webp`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, compressed, {
    contentType: "image/webp",
    customMetadata: {
      type: "review_avatar",
      reviewerName,
      uploadedAt: new Date().toISOString(),
    },
  });

  return await getDownloadURL(storageRef);
}
