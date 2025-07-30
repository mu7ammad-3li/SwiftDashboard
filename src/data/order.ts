import { Product } from "./products"; // Import the existing Product interface
import { Timestamp } from "firebase/firestore"; // <-- Import Timestamp
export interface OrderItem {
  product: {
    // Simplified product reference
    id: string;
    name: string;
  };
  quantity: number;
  originalPrice: number; // Store the numeric original price per unit
  priceAtPurchase: number; // Store the actual numeric price paid per unit
  wasOnSale: boolean; // Indicate if the sale price was used
}
export interface InternalNote {
  title: string; // Short description of the event (e.g., "Order Created", "Status Changed")
  summary: string; // More details about the event (e.g., "Order placed via website checkout", "Status updated to Shipped")
  createdBy: string; // Identifier for who/what triggered the event (e.g., "System", "Admin: [Admin Name/ID]", customerId)
  timestamp: Timestamp; // Firestore Timestamp of when the event occurred
}
// --- End Internal Note definition ---
export interface Order {
  id: string; // Keep for potential frontend use, Firestore handles doc ID separately
  customerId: string;
  items: OrderItem[]; // Uses the finalized OrderItem interface
  orderDate: Date;
  totalAmount: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  shippingAddress: {
    governorate: string;
    city: string;
    landMark: string;
    fullAdress: string;
  };
  shippingFees: number;
  notes?: string; // Optional notes field
  // --- Add the Internal Notes array ---
  internalNotes?: InternalNote[]; // Array to store order history/events
  // --- End Internal Notes array ---
}
