// src/services/productService.ts
import {
  collection,
  doc,
  getDoc,
  addDoc, // Use addDoc for auto-generated IDs
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy, // Optional: Add if you want default sorting
  // where, // Optional: Add if filtering is needed
  Timestamp, // Optional: If you track created/updated times
  serverTimestamp, // Optional: For server-side timestamps
} from "firebase/firestore";
import { db } from "../lib/firebase"; // Adjust path if needed
import { Product } from "../data/products"; // Adjust path if needed

// Define the collection name as a constant
const PRODUCTS_COLLECTION = "products";

/**
 * Fetches all products from the Firestore 'products' collection.
 * @returns {Promise<Product[]>} A promise resolving to an array of products.
 * @throws {Error} Throws an error if fetching fails.
 */
export const getProducts = async (): Promise<Product[]> => {
  try {
    // Basic query for all documents in the collection
    // Optional: Add orderBy('name', 'asc') for default sorting, ensure index exists
    const q = query(collection(db, PRODUCTS_COLLECTION));
    const querySnapshot = await getDocs(q);

    const products: Product[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Map Firestore data to the Product interface, including the document ID
      products.push({
        id: doc.id,
        name: data.name || "",
        image: data.image || "",
        price: data.price || "0", // Ensure consistency (string/number)
        shortDescription: data.shortDescription || "",
        FreeDelivery: data.FreeDelivery || false,
        featured: data.featured || false,
        onSale: data.onSale || false,
        salePrice: data.salePrice, // Can be undefined/null
        details: data.details || {
          longDescription: "",
          features: [],
          instructions: [],
        }, // Default nested object
      } as Product); // Type assertion
    });

    console.log(`Fetched ${products.length} products.`);
    return products;
  } catch (error) {
    console.error("Error fetching products: ", error);
    throw new Error("Failed to fetch products from the database.");
  }
};

/**
 * Fetches a single product by its Firestore document ID.
 * @param {string} productId - The Firestore document ID of the product.
 * @returns {Promise<Product | null>} A promise resolving to the product or null if not found.
 * @throws {Error} Throws an error if fetching fails.
 */
export const getProductById = async (
  productId: string
): Promise<Product | null> => {
  if (!productId) {
    console.error("Invalid product ID provided to getProductById.");
    return null;
  }
  try {
    const productDocRef = doc(db, PRODUCTS_COLLECTION, productId);
    const docSnap = await getDoc(productDocRef);

    if (docSnap.exists()) {
      console.log("Product found:", docSnap.id);
      const data = docSnap.data();
      // Map Firestore data to the Product interface
      return {
        id: docSnap.id,
        name: data.name || "",
        image: data.image || "",
        price: data.price || "0",
        shortDescription: data.shortDescription || "",
        FreeDelivery: data.FreeDelivery || false,
        featured: data.featured || false,
        onSale: data.onSale || false,
        salePrice: data.salePrice,
        details: data.details || {
          longDescription: "",
          features: [],
          instructions: [],
        },
      } as Product;
    } else {
      console.log("No product found with ID:", productId);
      return null; // Return null if the document doesn't exist
    }
  } catch (error) {
    console.error("Error fetching product by ID: ", error);
    throw new Error(`Failed to fetch product with ID ${productId}.`);
  }
};

/**
 * Adds a new product document to the Firestore 'products' collection.
 * Firestore will automatically generate the document ID.
 * @param {Omit<Product, "id">} productData - The product data (without the 'id' field).
 * @returns {Promise<string>} A promise resolving to the new product's document ID.
 * @throws {Error} Throws an error if adding the document fails.
 */
export const addProduct = async (
  productData: Omit<Product, "id">
): Promise<string> => {
  try {
    const productCollectionRef = collection(db, PRODUCTS_COLLECTION);

    // Optional: Add a creation timestamp
    // const dataToAdd = { ...productData, createdAt: serverTimestamp() };
    // const docRef = await addDoc(productCollectionRef, dataToAdd);

    // Add the document without timestamp
    const docRef = await addDoc(productCollectionRef, productData);

    console.log("New product added with ID:", docRef.id);
    return docRef.id; // Return the auto-generated Firestore document ID
  } catch (error) {
    console.error("Error adding product: ", error);
    throw new Error("Failed to add the new product.");
  }
};

/**
 * Updates specific fields for an existing product in Firestore.
 * @param {string} productId - The Firestore document ID of the product to update.
 * @param {Partial<Omit<Product, "id">>} updates - An object containing the fields to update.
 * @returns {Promise<boolean>} A promise resolving to true if the update was successful.
 * @throws {Error} Throws an error if the update fails.
 */
export const updateProduct = async (
  productId: string,
  updates: Partial<Omit<Product, "id">> // Allow updating any field except 'id'
): Promise<boolean> => {
  if (!productId) {
    console.error("Invalid product ID provided for update.");
    throw new Error("Invalid product ID for update.");
  }
  // Prevent accidental empty updates
  if (!updates || Object.keys(updates).length === 0) {
    console.warn("No update data provided for product:", productId);
    return true; // Consider this success as no update was needed
  }

  const productDocRef = doc(db, PRODUCTS_COLLECTION, productId);

  try {
    // Optional: Add an 'updatedAt' timestamp
    // const dataToUpdate = { ...updates, updatedAt: serverTimestamp() };
    // await updateDoc(productDocRef, dataToUpdate);

    // Perform the update operation
    await updateDoc(productDocRef, updates);
    console.log("Product updated successfully:", productId);
    return true; // Indicate success
  } catch (error) {
    console.error("Error updating product: ", error);
    throw new Error(`Failed to update product ${productId}.`);
  }
};

/**
 * Deletes a product document from Firestore (Hard Delete).
 * **Warning:** This permanently removes the product data.
 * @param {string} productId - The Firestore document ID of the product to delete.
 * @returns {Promise<boolean>} A promise resolving to true if successful.
 * @throws {Error} Throws an error if deletion fails.
 */
export const deleteProduct = async (productId: string): Promise<boolean> => {
  if (!productId) {
    console.error("Invalid product ID provided for delete.");
    throw new Error("Invalid product ID for delete.");
  }
  const productDocRef = doc(db, PRODUCTS_COLLECTION, productId);
  try {
    // Perform the delete operation
    await deleteDoc(productDocRef);
    console.log("Product deleted successfully:", productId);
    return true; // Indicate success
  } catch (error) {
    console.error("Error deleting product: ", error);
    throw new Error(`Failed to delete product ${productId}.`);
  }
};
