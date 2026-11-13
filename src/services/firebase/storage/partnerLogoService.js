import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { storage } from "../../../firebase/firebaseConfig";
import { compressImage } from "../../../utils/imageCompression";

/**
 * Upload a partner logo image to Firebase Storage with compression.
 * @param {File} file - The image file to upload.
 * @param {Object} options - Configuration options.
 * @param {string} options.partnerName - Partner name for metadata.
 * @returns {Promise<string>} Download URL of the uploaded image
 */
export async function uploadPartnerLogo(file, { partnerName = "partner" } = {}) {
  if (!file) throw new Error("No file provided for upload.");

  const fileId = uuidv4();
  const sanitizedName = partnerName.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 20);

  // Compress logo image appropriately for vector/raster display in orbital circles
  const compressed = await compressImage(file, {
    maxSizeMB: 0.15,
    maxWidthOrHeight: 512,
    fileType: "image/webp",
    initialQuality: 0.9,
  });

  const storagePath = `partners/logos/${sanitizedName}_${fileId}.webp`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, compressed, {
    contentType: "image/webp",
    customMetadata: {
      type: "partner_logo",
      partnerName,
      uploadedAt: new Date().toISOString(),
    },
  });

  const downloadUrl = await getDownloadURL(storageRef);
  return downloadUrl;
}
