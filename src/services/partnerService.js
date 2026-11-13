import { firestore } from "../firebase/firebaseConfig";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

const STORAGE_KEY = "needmet_db_partners_v2";

function getCachedPartners() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Could not read local partner cache:", e);
  }
  return [];
}

function setCachedPartners(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn("Could not save local partner cache:", e);
  }
}

/**
 * Fetch all partners from Firestore database.
 * No hardcoded seed data — if database is empty, returns empty array [].
 */
export async function getPartners(statusFilter = "all") {
  try {
    const partnersRef = collection(firestore, "partners");
    let snap;
    try {
      const q = query(partnersRef, orderBy("order", "asc"));
      snap = await getDocs(q);
    } catch {
      snap = await getDocs(partnersRef);
    }

    const items = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    // Cache the real DB documents locally
    setCachedPartners(items);

    let filtered = items;
    if (statusFilter === "active") {
      filtered = filtered.filter((p) => p.isActive !== false);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((p) => p.isActive === false);
    }

    return filtered;
  } catch (error) {
    console.warn("Firestore partners fetch error:", error.message);
    // Offline fallback to real DB cache (never seed)
    let cached = getCachedPartners();
    if (statusFilter === "active") {
      cached = cached.filter((p) => p.isActive !== false);
    } else if (statusFilter === "inactive") {
      cached = cached.filter((p) => p.isActive === false);
    }
    return cached;
  }
}

/**
 * Create a new partner record
 */
export async function createPartner(partnerData) {
  const id = partnerData.id || `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const record = {
    name: partnerData.name || "",
    logo: partnerData.logo || "",
    id,
    isActive: partnerData.isActive !== false,
    order: Number(partnerData.order) || 1,
    updatedAt: new Date().toISOString(),
  };

  try {
    const docRef = doc(firestore, "partners", id);
    await setDoc(docRef, {
      ...record,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Firestore write error, saving to local cache:", err.message);
  }

  // Update local cache
  const cached = getCachedPartners();
  const updated = [...cached, record];
  setCachedPartners(updated);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("needmet:partners_changed"));
  }

  return record;
}

/**
 * Update an existing partner record
 */
export async function updatePartner(id, partnerData) {
  const payload = {
    name: partnerData.name || "",
    logo: partnerData.logo || "",
    id,
    isActive: partnerData.isActive !== false,
    order: Number(partnerData.order) || 1,
    updatedAt: new Date().toISOString(),
  };

  try {
    const docRef = doc(firestore, "partners", id);
    await updateDoc(docRef, {
      ...payload,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Firestore update error, updating local cache:", err.message);
  }

  const cached = getCachedPartners();
  const updated = cached.map((p) => (p.id === id ? { ...p, ...payload } : p));
  setCachedPartners(updated);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("needmet:partners_changed"));
  }

  return payload;
}

/**
 * Delete a partner
 */
export async function deletePartner(id) {
  try {
    const docRef = doc(firestore, "partners", id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn("Firestore delete error, removing from local cache:", err.message);
  }

  const cached = getCachedPartners();
  const updated = cached.filter((p) => p.id !== id);
  setCachedPartners(updated);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("needmet:partners_changed"));
  }

  return { success: true, id };
}

/**
 * Toggle a partner's active state
 */
export async function togglePartnerStatus(id, currentStatus) {
  const nextStatus = !currentStatus;
  try {
    const docRef = doc(firestore, "partners", id);
    await updateDoc(docRef, {
      isActive: nextStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Firestore toggle error, updating local cache:", err.message);
  }

  const cached = getCachedPartners();
  const updated = cached.map((p) => (p.id === id ? { ...p, isActive: nextStatus } : p));
  setCachedPartners(updated);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("needmet:partners_changed"));
  }

  return { success: true, id, isActive: nextStatus };
}

/**
 * Reorder partners and persist updated order indices
 */
export async function reorderPartners(orderedList) {
  const updatedList = orderedList.map((partner, index) => ({
    ...partner,
    order: index + 1,
    updatedAt: new Date().toISOString(),
  }));

  setCachedPartners(updatedList);

  try {
    const promises = updatedList.map((p) => {
      const docRef = doc(firestore, "partners", p.id);
      return updateDoc(docRef, {
        order: p.order,
        updatedAt: serverTimestamp(),
      }).catch((e) => console.warn(`Reorder sync failed for partner ${p.id}:`, e));
    });
    await Promise.all(promises);
  } catch (err) {
    console.warn("Error persisting partner order to Firestore:", err);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("needmet:partners_changed"));
  }

  return updatedList;
}
