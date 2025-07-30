// src/services/customerService.ts
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  query,
  where,
  Timestamp,
  serverTimestamp,
  deleteDoc, // <-- Import deleteDoc
} from "firebase/firestore";
import { db } from "../lib/firebase"; // Adjust path if needed
import { Customer } from "../data/customer"; // Adjust path if needed
import { formatPhoneNumber } from "../lib/utils"; // Crucial for ensuring ID consistency

const CUSTOMERS_COLLECTION = "customers";

// --- Existing Functions (getCustomers, getCustomerById, findOrCreateCustomer, updateCustomer) ---
// (Keep the implementations from the previous version)
/**
 * Fetches all active customers from Firestore.
 * Filters out customers marked with status 'deleted' or 'archived'.
 * @returns {Promise<Customer[]>} A promise that resolves to an array of active customers.
 * @throws {Error} Throws an error if fetching fails.
 */
export const getCustomers = async (): Promise<Customer[]> => {
  try {
    // Fetch ALL customers, filtering/sorting is done client-side if needed now
    const q = query(collection(db, CUSTOMERS_COLLECTION));
    const querySnapshot = await getDocs(q);
    const customers: Customer[] = [];
    querySnapshot.forEach((doc) => {
      // Ensure the document ID (formatted phone) is included in the returned object
      customers.push({ id: doc.id, ...doc.data() } as Customer);
    });
    console.log(`Fetched ${customers.length} total customers.`);
    return customers;
  } catch (error) {
    console.error("Error fetching customers: ", error);
    throw new Error("Failed to fetch customers.");
  }
};

export const getCustomerById = async (
  formattedPhone: string
): Promise<Customer | null> => {
  if (!formattedPhone || formattedPhone.length !== 11) {
    console.error("Invalid formatted phone number provided:", formattedPhone);
    return null;
  }
  try {
    const customerDocRef = doc(db, CUSTOMERS_COLLECTION, formattedPhone);
    const docSnap = await getDoc(customerDocRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Customer;
    } else {
      console.log("No customer found with phone:", formattedPhone);
      return null;
    }
  } catch (error) {
    console.error("Error fetching customer by ID: ", error);
    throw new Error(`Failed to fetch customer with phone ${formattedPhone}.`);
  }
};

export const findOrCreateCustomer = async (
  customerData: Omit<Customer, "id" | "status" | "createdAt"> & {
    phone: string;
  }
): Promise<Customer> => {
  const formattedPhone = customerData.phone;
  if (!formattedPhone || formattedPhone.length !== 11) {
    throw new Error("A valid 11-digit formatted phone number is required.");
  }
  const customerDocRef = doc(db, CUSTOMERS_COLLECTION, formattedPhone);
  try {
    const docSnap = await getDoc(customerDocRef);
    if (docSnap.exists()) {
      console.log("Customer found:", formattedPhone);
      return { id: docSnap.id, ...docSnap.data() } as Customer;
    } else {
      console.log("Customer not found, creating new one:", formattedPhone);
      const newCustomer: Omit<Customer, "id"> = {
        fullName: customerData.fullName,
        email: customerData.email || "",
        phone: formattedPhone,
        secondPhone: customerData.secondPhone || "",
        address: customerData.address || {
          governorate: "",
          city: "",
          landMark: "",
          fullAdress: "",
        },
        status: "active", // Default status
      };
      await setDoc(customerDocRef, newCustomer);
      console.log("New customer created with ID:", formattedPhone);
      return { id: formattedPhone, ...newCustomer };
    }
  } catch (error) {
    console.error("Error finding or creating customer: ", error);
    throw new Error(
      `Failed to find or create customer with phone ${formattedPhone}.`
    );
  }
};

export const updateCustomer = async (
  formattedPhone: string,
  updates: Partial<Omit<Customer, "id" | "phone">>
): Promise<boolean> => {
  if (!formattedPhone || formattedPhone.length !== 11) {
    console.error(
      "Invalid formatted phone number provided for update:",
      formattedPhone
    );
    return false;
  }
  if (Object.keys(updates).length === 0) {
    console.warn("No updates provided for customer:", formattedPhone);
    return true;
  }
  if ("phone" in updates) {
    console.error("Primary phone number cannot be updated.");
    throw new Error("Primary phone number (ID) cannot be updated.");
  }
  const customerDocRef = doc(db, CUSTOMERS_COLLECTION, formattedPhone);
  try {
    await updateDoc(customerDocRef, updates);
    console.log("Customer updated successfully:", formattedPhone);
    return true;
  } catch (error) {
    console.error("Error updating customer: ", error);
    throw new Error(`Failed to update customer ${formattedPhone}.`);
  }
};

// --- NEW FUNCTION ---
/**
 * Deletes a customer document from Firestore (Hard Delete).
 * @param {string} formattedPhone - The formatted 11-digit phone number (document ID).
 * @returns {Promise<boolean>} A promise resolving to true if successful.
 * @throws {Error} Throws an error if the delete operation fails.
 */
export const deleteCustomer = async (
  formattedPhone: string
): Promise<boolean> => {
  if (!formattedPhone || formattedPhone.length !== 11) {
    console.error(
      "Invalid formatted phone number provided for delete:",
      formattedPhone
    );
    throw new Error("Invalid customer ID for delete.");
  }
  const customerDocRef = doc(db, CUSTOMERS_COLLECTION, formattedPhone);
  try {
    await deleteDoc(customerDocRef); // Use deleteDoc for hard delete
    console.log("Customer hard deleted successfully:", formattedPhone);
    return true;
  } catch (error) {
    console.error("Error deleting customer (hard delete): ", error);
    throw new Error(`Failed to hard delete customer ${formattedPhone}.`);
  }
};
