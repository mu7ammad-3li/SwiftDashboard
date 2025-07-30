// src/services/financeService.ts
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  serverTimestamp, // For potential createdAt/updatedAt fields if added later
} from "firebase/firestore";
import { db } from "../lib/firebase"; // Firebase app initialization
import { RawMaterialPurchase } from "../data/finances"; // Interface for raw material purchases

const RAW_MATERIAL_PURCHASES_COLLECTION = "rawMaterialPurchases";

/**
 * Adds a new raw material purchase record to Firestore.
 * @param purchaseData - The data for the new purchase, excluding the 'id'.
 * 'purchaseDate' should be a JS Date object and will be converted to a Timestamp.
 * @returns Promise<string> The ID of the newly created purchase document.
 * @throws {Error} If adding to Firestore fails.
 */
export const addRawMaterialPurchase = async (
  purchaseData: Omit<RawMaterialPurchase, "id" | "purchaseDate"> & {
    purchaseDate: Date;
  }
): Promise<string> => {
  if (!db) {
    console.error("Firestore DB not initialized in addRawMaterialPurchase");
    throw new Error("Firestore is not initialized.");
  }
  try {
    const dataToSave = {
      ...purchaseData,
      purchaseDate: Timestamp.fromDate(purchaseData.purchaseDate), // Convert JS Date to Firestore Timestamp
      // Consider adding createdAt: serverTimestamp() if you want to track record creation time
    };
    const docRef = await addDoc(
      collection(db, RAW_MATERIAL_PURCHASES_COLLECTION),
      dataToSave
    );
    return docRef.id;
  } catch (error) {
    console.error("Error adding raw material purchase: ", error);
    throw new Error("Failed to add raw material purchase to Firestore.");
  }
};

/**
 * Fetches all raw material purchase records from Firestore.
 * Orders them by purchaseDate in descending order (most recent first).
 * @returns Promise<RawMaterialPurchase[]> An array of purchase records.
 * @throws {Error} If fetching from Firestore fails.
 */
export const getRawMaterialPurchases = async (): Promise<
  RawMaterialPurchase[]
> => {
  if (!db) {
    console.error("Firestore DB not initialized in getRawMaterialPurchases");
    throw new Error("Firestore is not initialized.");
  }
  try {
    const q = query(
      collection(db, RAW_MATERIAL_PURCHASES_COLLECTION),
      orderBy("purchaseDate", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        // Ensure purchaseDate is converted from Timestamp to JS Date for frontend use
        purchaseDate: (data.purchaseDate as Timestamp).toDate(),
      } as RawMaterialPurchase;
    });
  } catch (error) {
    console.error("Error fetching raw material purchases: ", error);
    if (
      error instanceof Error &&
      error.message.includes("indexes?create_composite")
    ) {
      console.error(
        "Firestore Index Missing: Query for raw material purchases requires an index on 'purchaseDate'. " +
          "Please create this index in your Firebase console for the 'rawMaterialPurchases' collection."
      );
      throw new Error(
        "Firestore index missing for purchases query. See console."
      );
    }
    throw new Error("Failed to fetch raw material purchases from Firestore.");
  }
};

/**
 * Fetches a single raw material purchase record by its ID.
 * @param purchaseId - The ID of the purchase record.
 * @returns Promise<RawMaterialPurchase | null> The purchase record if found, otherwise null.
 * @throws {Error} If fetching from Firestore fails.
 */
export const getRawMaterialPurchaseById = async (
  purchaseId: string
): Promise<RawMaterialPurchase | null> => {
  if (!db) {
    console.error("Firestore DB not initialized in getRawMaterialPurchaseById");
    throw new Error("Firestore is not initialized.");
  }
  if (!purchaseId) {
    console.warn("getRawMaterialPurchaseById called with no ID.");
    return null;
  }
  try {
    const docRef = doc(db, RAW_MATERIAL_PURCHASES_COLLECTION, purchaseId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        purchaseDate: (data.purchaseDate as Timestamp).toDate(),
      } as RawMaterialPurchase;
    }
    return null;
  } catch (error) {
    console.error(
      `Error fetching raw material purchase by ID "${purchaseId}": `,
      error
    );
    throw new Error(`Failed to fetch raw material purchase ${purchaseId}.`);
  }
};

/**
 * Updates an existing raw material purchase record in Firestore.
 * @param purchaseId - The ID of the purchase record to update.
 * @param updates - Partial data for the purchase record.
 * If 'purchaseDate' is updated, it should be a JS Date object.
 * @returns Promise<boolean> True if successful.
 * @throws {Error} If updating Firestore fails.
 */
export const updateRawMaterialPurchase = async (
  purchaseId: string,
  updates: Partial<
    Omit<RawMaterialPurchase, "id" | "purchaseDate"> & { purchaseDate?: Date }
  >
): Promise<boolean> => {
  if (!db) {
    console.error("Firestore DB not initialized in updateRawMaterialPurchase");
    throw new Error("Firestore is not initialized.");
  }
  if (!purchaseId) {
    throw new Error("Purchase ID is required for update.");
  }
  try {
    const dataToUpdate: { [key: string]: any } = { ...updates };
    if (updates.purchaseDate instanceof Date) {
      dataToUpdate.purchaseDate = Timestamp.fromDate(updates.purchaseDate);
    }
    // Consider adding updatedAt: serverTimestamp() if tracking record modification time

    const docRef = doc(db, RAW_MATERIAL_PURCHASES_COLLECTION, purchaseId);
    await updateDoc(docRef, dataToUpdate);
    return true;
  } catch (error) {
    console.error(
      `Error updating raw material purchase "${purchaseId}": `,
      error
    );
    throw new Error(`Failed to update raw material purchase ${purchaseId}.`);
  }
};

/**
 * Deletes a raw material purchase record from Firestore.
 * @param purchaseId - The ID of the purchase record to delete.
 * @returns Promise<boolean> True if successful.
 * @throws {Error} If deleting from Firestore fails.
 */
export const deleteRawMaterialPurchase = async (
  purchaseId: string
): Promise<boolean> => {
  if (!db) {
    console.error("Firestore DB not initialized in deleteRawMaterialPurchase");
    throw new Error("Firestore is not initialized.");
  }
  if (!purchaseId) {
    throw new Error("Purchase ID is required for delete.");
  }
  try {
    const docRef = doc(db, RAW_MATERIAL_PURCHASES_COLLECTION, purchaseId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error(
      `Error deleting raw material purchase "${purchaseId}": `,
      error
    );
    throw new Error(`Failed to delete raw material purchase ${purchaseId}.`);
  }
};
