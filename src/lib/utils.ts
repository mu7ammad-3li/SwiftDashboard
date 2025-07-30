import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format as formatDateFns, isValid, parseISO } from "date-fns";
import { Timestamp } from "firebase/firestore"; // Import Timestamp
import type { OrderStatus as AppOrderStatus } from "@/data/order"; // Assuming OrderStatus type/enum
import type { CustomerStatus as AppCustomerStatus } from "@/data/customer"; // Assuming CustomerStatus type/enum
import type { VariantProps } from "class-variance-authority"; // For badge variants
import { badgeVariants } from "@/components/ui/badge"; // Assuming badgeVariants export variant types

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a phone number string:
 * - Translates Arabic numerals to English.
 * - Removes whitespace.
 * - Removes '+2' prefix if present.
 * - Returns the formatted string or null if input is invalid/empty.
 */
export function formatPhoneNumber(
  phone: string | null | undefined
): string | null {
  if (!phone) {
    return null; // Handle null or undefined input
  }

  const arabicNumeralsMap: { [key: string]: string } = {
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
  };

  let formatted = phone.toString(); // Ensure it's a string

  // 1. Translate Arabic numerals to English
  formatted = formatted.replace(
    /[٠-٩]/g,
    (match) => arabicNumeralsMap[match] || match
  );

  // 2. Remove whitespace
  formatted = formatted.replace(/\s+/g, "");

  // 3. Remove '+2' prefix if found
  if (formatted.startsWith("+2")) {
    formatted = formatted.substring(2);
  }

  // 4. Remove any non-digit characters that might remain
  formatted = formatted.replace(/\D/g, "");

  return formatted;
}

/**
 * Formats a date for display using date-fns.
 * Handles Date objects, Firebase Timestamps, ISO strings, or numbers (milliseconds).
 * @param dateInput The date to format.
 * @param formatString The date-fns format string (e.g., "PPpp", "MMM d, yyyy, h:mm a").
 * @returns Formatted date string or "N/A" if invalid.
 */
export const formatDisplayDate = (
  dateInput: any,
  formatString: string = "MMM d, yyyy, h:mm a" // Default format similar to previous toLocaleString
): string => {
  if (!dateInput) return "N/A";

  let date: Date | null = null;

  if (dateInput instanceof Date) {
    date = dateInput;
  } else if (dateInput instanceof Timestamp) {
    // Firestore Timestamp
    date = dateInput.toDate();
  } else if (typeof dateInput === "string") {
    date = parseISO(dateInput); // Try parsing ISO string
  } else if (typeof dateInput === "number") {
    date = new Date(dateInput); // Assume milliseconds
  }

  if (date && isValid(date)) {
    return formatDateFns(date, formatString);
  }
  return "Invalid Date";
};

/**
 * Formats a number as currency in EGP.
 * @param amount The amount to format.
 * @returns Formatted currency string or "EGP 0.00" if invalid.
 */
export const formatCurrency = (amount: number | undefined | null): string => {
  const numericAmount = Number(amount);
  if (!isNaN(numericAmount)) {
    return numericAmount.toLocaleString("en-EG", {
      style: "currency",
      currency: "EGP",
    });
  }
  return "EGP 0.00"; // Default
};

// Define a more specific type for badge variants if possible, or use the one from badgeVariants
type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

/**
 * Gets the badge variant for a given order status.
 * @param status The order status.
 * @returns The corresponding badge variant.
 */
export const getOrderStatusBadgeVariant = (
  status?: AppOrderStatus
): BadgeVariant => {
  switch (status?.toLowerCase()) {
    case "pending":
      return "warning";
    case "processing":
      return "info"; // Or a specific 'info' or 'processing' color
    case "shipped":
      return "shipped"; // Or a specific 'shipped' color
    case "delivered":
      return "success"; // Or a specific 'success' color (e.g., green)
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
};

/**
 * Gets the badge variant for a given customer status.
 * @param status The customer status.
 * @returns The corresponding badge variant.
 */
export const getCustomerStatusBadgeVariant = (
  status?: AppCustomerStatus
): BadgeVariant => {
  switch (status?.toLowerCase()) {
    case "active":
      return "default"; // Consider a 'success' variant for active
    case "archived":
      return "secondary";
    case "deleted":
      return "destructive"; // Should ideally not be displayed if filtered out
    default:
      return "outline";
  }
};

/**
 * Gets CSS classes for an order card based on its status.
 * @param status The order status.
 * @returns Tailwind CSS class string.
 */
export const getOrderCardClass = (status?: AppOrderStatus): string => {
  switch (status?.toLowerCase()) {
    case "pending":
      return "border-l-4 border-yellow-400 bg-yellow-50/50 hover:bg-yellow-100/50";
    case "processing":
      return "border-l-4 border-blue-400 bg-blue-50/50 hover:bg-blue-100/50";
    case "shipped":
      return "border-l-4 border-teal-400 bg-teal-50/50 hover:bg-teal-100/50";
    case "delivered":
      return "border-l-4 border-green-400 bg-green-50/50 hover:bg-green-100/50";
    case "cancelled":
      return "border-l-4 border-red-400 bg-red-50/50 opacity-70 hover:bg-red-100/50";
    default:
      return "border-l-4 border-gray-300 bg-gray-50/50 hover:bg-gray-100/50";
  }
};

/**
 * Generates initials from a name string for avatar fallbacks.
 * Takes the first letter of the first and last part of the name.
 * @param name The full name string.
 * @returns Uppercase initials string or "?" if name is not provided.
 */
export const getInitials = (name?: string): string => {
  if (!name || typeof name !== "string" || name.trim() === "") return "?";
  const parts = name.trim().split(/\s+/); // Split by any whitespace
  if (parts.length === 1 && parts[0]) {
    return parts[0][0].toUpperCase();
  }
  if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return "?";
};
