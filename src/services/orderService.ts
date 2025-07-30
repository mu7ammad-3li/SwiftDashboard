// src/services/orderService.ts
import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  where,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  Timestamp, // Keep this import
  serverTimestamp, // Keep for createOrder initial note (optional)
  // arrayUnion, // Still not needed for adding notes
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Order, OrderItem, InternalNote } from "../data/order";

const ORDERS_COLLECTION = "orders";

// --- convertTimestampsToDates (Keep as is) ---
const convertTimestampsToDates = (data: any): any => {
  if (!data) return data;
  const convertedData = { ...data };
  for (const key in convertedData) {
    if (convertedData[key] instanceof Timestamp) {
      convertedData[key] = convertedData[key].toDate();
    }
  }
  if (Array.isArray(convertedData.internalNotes)) {
    convertedData.internalNotes = convertedData.internalNotes.map(
      (note: any) => {
        // Handles both Timestamps from server and potentially client
        if (note && note.timestamp instanceof Timestamp) {
          return { ...note, timestamp: note.timestamp.toDate() };
        }
        // If it was already converted or stored as Date (less likely now)
        if (note && note.timestamp instanceof Date) {
          return note; // Keep as Date object
        }
        // Handle cases where timestamp might be missing or invalid
        if (note && !note.timestamp) {
          console.warn("Note missing timestamp:", note);
          return { ...note, timestamp: new Date(0) }; // Provide a default fallback date
        }
        return note; // Return as is if not a Timestamp object
      }
    );
  } else {
    convertedData.internalNotes = [];
  }
  return convertedData;
};

// --- getOrders (Keep as is) ---
export const getOrders = async (): Promise<Order[]> => {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      orderBy("orderDate", "desc")
    );
    const querySnapshot = await getDocs(q);
    const orders: Order[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const orderDataWithDates = convertTimestampsToDates(data);
      orders.push({ id: doc.id, ...orderDataWithDates } as Order);
    });
    // console.log(`Fetched ${orders.length} orders.`); // Optional logging
    return orders;
  } catch (error) {
    console.error("Error fetching orders: ", error);
    throw new Error("Failed to fetch orders.");
  }
};

// --- getOrderById (Keep as is) ---
export const getOrderById = async (orderId: string): Promise<Order | null> => {
  if (!orderId) {
    console.error("Invalid order ID provided.");
    return null;
  }
  try {
    const orderDocRef = doc(db, ORDERS_COLLECTION, orderId);
    const docSnap = await getDoc(orderDocRef);

    if (docSnap.exists()) {
      // console.log("Order found:", docSnap.id); // Optional logging
      const data = docSnap.data();
      const orderDataWithDates = convertTimestampsToDates(data);
      return { id: docSnap.id, ...orderDataWithDates } as Order;
    } else {
      console.log("No order found with ID:", orderId);
      return null;
    }
  } catch (error) {
    console.error("Error fetching order by ID: ", error);
    throw new Error(`Failed to fetch order with ID ${orderId}.`);
  }
};

// --- createOrder (Consider using client timestamp for consistency) ---
export const createOrder = async (
  orderData: Omit<Order, "id" | "internalNotes">
): Promise<string> => {
  try {
    const orderCollectionRef = collection(db, ORDERS_COLLECTION);
    const createdBy = "System"; // Placeholder - Should be actual user if possible

    const dataToSave = {
      ...orderData,
      orderDate: Timestamp.fromDate(
        orderData.orderDate instanceof Date ? orderData.orderDate : new Date()
      ),
      internalNotes: [
        {
          title: "Order Created",
          summary: "Order automatically created.",
          // Using client-side Timestamp.now() for consistency with updated addInternalNoteToOrder
          timestamp: Timestamp.now(),
          // Alternatively, keep serverTimestamp() here as it's allowed in addDoc:
          // timestamp: serverTimestamp(),
          createdBy: createdBy,
        },
      ],
      items: orderData.items || [],
      status: orderData.status || "pending",
    };

    const docRef = await addDoc(orderCollectionRef, dataToSave);
    console.log("New order created with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating order: ", error);
    throw new Error("Failed to create order.");
  }
};

// --- updateOrder (Keep as is) ---
export const updateOrder = async (
  orderId: string,
  updates: Partial<Omit<Order, "id" | "internalNotes">>
): Promise<boolean> => {
  if (!orderId) {
    console.error("Invalid order ID provided for update.");
    return false;
  }
  if (Object.keys(updates).length === 0) {
    // console.warn("No updates provided for order:", orderId); // Optional logging
    return true;
  }
  const orderDocRef = doc(db, ORDERS_COLLECTION, orderId);
  try {
    const dataToUpdate = { ...updates };
    if (dataToUpdate.orderDate && dataToUpdate.orderDate instanceof Date) {
      dataToUpdate.orderDate = Timestamp.fromDate(dataToUpdate.orderDate);
    }
    await updateDoc(orderDocRef, dataToUpdate);
    // console.log("Order updated successfully:", orderId); // Optional logging
    return true;
  } catch (error) {
    console.error("Error updating order: ", error);
    throw new Error(`Failed to update order ${orderId}.`);
  }
};

// --- addInternalNoteToOrder (Corrected) ---
/**
 * Adds an internal note using a client-side timestamp.
 */
export const addInternalNoteToOrder = async (
  orderId: string,
  title: string,
  summary: string,
  createdBy: string = "system"
): Promise<boolean> => {
  if (!orderId || !title || !summary) {
    console.error("Order ID, title, and summary are required.");
    return false;
  }

  const orderDocRef = doc(db, ORDERS_COLLECTION, orderId);

  try {
    // 1. Get current data
    const docSnap = await getDoc(orderDocRef);
    if (!docSnap.exists()) {
      throw new Error(`Order ${orderId} not found.`);
    }
    const orderData = docSnap.data();
    const currentNotes: InternalNote[] = Array.isArray(orderData.internalNotes)
      ? orderData.internalNotes
      : [];

    // 2. Create the new note with a CLIENT-SIDE timestamp
    const newNote: InternalNote = {
      // Use the correct InternalNote type directly
      title: title,
      summary: summary,
      timestamp: Timestamp.now(), // Use client-side timestamp
      createdBy: createdBy,
    };

    // 3. Create the updated array
    const updatedNotes = [...currentNotes, newNote];

    // 4. Update the document
    await updateDoc(orderDocRef, {
      internalNotes: updatedNotes,
    });

    console.log(`Internal note added to order ${orderId} (client timestamp)`);
    return true;
  } catch (error) {
    console.error("Error adding internal note to order: ", error);
    // Re-throw with a more specific message if possible
    if (error instanceof Error) {
      throw new Error(`Failed to add internal note: ${error.message}`);
    } else {
      throw new Error(`Failed to add internal note to order ${orderId}.`);
    }
  }
};

// --- deleteOrder (Keep as is) ---
export const deleteOrder = async (orderId: string): Promise<boolean> => {
  if (!orderId) {
    console.error("Invalid order ID provided for delete.");
    return false;
  }
  const orderDocRef = doc(db, ORDERS_COLLECTION, orderId);
  try {
    await deleteDoc(orderDocRef);
    console.log("Order deleted successfully:", orderId);
    return true;
  } catch (error) {
    console.error("Error deleting order: ", error);
    throw new Error(`Failed to delete order ${orderId}.`);
  }
};

// --- getOrdersByCustomerId (Keep as is) ---
export const getOrdersByCustomerId = async (
  customerId: string
): Promise<Order[]> => {
  if (!customerId) {
    console.error("Invalid customer ID provided to getOrdersByCustomerId.");
    return [];
  }
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where("customerId", "==", customerId),
      orderBy("orderDate", "desc")
    );
    const querySnapshot = await getDocs(q);
    const orders: Order[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const orderDataWithDates = convertTimestampsToDates(data);
      orders.push({ id: doc.id, ...orderDataWithDates } as Order);
    });
    // console.log(`Fetched ${orders.length} orders for customer ${customerId}.`); // Optional logging
    return orders;
  } catch (error) {
    console.error(`Error fetching orders for customer ${customerId}: `, error);
    if (
      error instanceof Error &&
      error.message.includes("indexes?create_composite")
    ) {
      console.error(
        "Firestore index missing! Create a composite index for 'orders' on 'customerId' (Asc) and 'orderDate' (Desc)."
      );
      throw new Error(
        `Firestore index missing for customer orders query. Check console.`
      );
    }
    throw new Error(`Failed to fetch orders for customer ${customerId}.`);
  }
};
