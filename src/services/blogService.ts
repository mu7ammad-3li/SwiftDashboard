// src/services/blogService.ts
import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp, // Firestore Timestamp for writing
  serverTimestamp, // For setting server-side timestamps
  limit,
} from "firebase/firestore";
import { db } from "../lib/firebase"; // Firebase app initialization
import {
  UnifiedBlogPost,
  BlogPostStatus, // Now using BlogPostStatus from the unified definition
  adaptFirestoreDocToUnifiedBlogPost, // Adapter function
} from "../data/blog"; // Import the unified type and adapter

const BLOG_POSTS_COLLECTION = "blog_posts";

/**
 * Fetches all blog posts from Firestore for the admin panel.
 * Posts are ordered by 'Priority' (ascending) and then by 'publishedAt' (descending).
 * This version fetches all posts, regardless of status, for admin management.
 *
 * @returns Promise<UnifiedBlogPost[]> An array of all blog posts.
 * @throws {Error} If fetching from Firestore fails or if required indexes are missing.
 */
export const getBlogPosts = async (): Promise<UnifiedBlogPost[]> => {
  if (!db) {
    console.error(
      "Firestore database is not initialized in blogService.ts (getBlogPosts)"
    );
    throw new Error("Firestore is not initialized. Cannot fetch blogs.");
  }
  try {
    const q = query(
      collection(db, BLOG_POSTS_COLLECTION),
      orderBy("Priority", "asc"),
      orderBy("publishedAt", "desc") // Keep default ordering
    );
    const querySnapshot = await getDocs(q);

    // Map Firestore documents to the UnifiedBlogPost structure using the adapter.
    return querySnapshot.docs.map((docSnap) =>
      adaptFirestoreDocToUnifiedBlogPost(docSnap.id, docSnap.data())
    );
  } catch (error) {
    console.error("Error fetching all blog posts (admin): ", error);
    if (
      error instanceof Error &&
      error.message.includes("indexes?create_composite")
    ) {
      console.error(
        "Firestore Index Missing: The query for all blog posts (admin) requires a composite index. " +
          "Please create an index in your Firebase console for the 'blog_posts' collection with fields: " +
          "'Priority' (Ascending), and 'publishedAt' (Descending)."
      );
      throw new Error(
        "Firestore index missing for admin blog posts query. See console for details."
      );
    }
    throw new Error("Failed to fetch all blog posts for admin from Firestore.");
  }
};

/**
 * Fetches a single blog post by its ID from Firestore.
 * Uses the adapter to return a UnifiedBlogPost.
 *
 * @param postId The ID of the blog post.
 * @returns Promise<UnifiedBlogPost | null> The blog post if found, otherwise null.
 * @throws {Error} If fetching from Firestore fails.
 */
export const getBlogPostById = async (
  postId: string
): Promise<UnifiedBlogPost | null> => {
  if (!db) {
    console.error(
      "Firestore database is not initialized in blogService.ts (getBlogPostById)"
    );
    throw new Error("Firestore is not initialized. Cannot fetch blog by ID.");
  }
  if (!postId) {
    console.warn("getBlogPostById called with no postId");
    return null;
  }
  try {
    const postDocRef = doc(db, BLOG_POSTS_COLLECTION, postId);
    const docSnap = await getDoc(postDocRef);
    if (docSnap.exists()) {
      return adaptFirestoreDocToUnifiedBlogPost(docSnap.id, docSnap.data());
    }
    return null;
  } catch (error) {
    console.error(`Error fetching blog post by ID "${postId}": `, error);
    throw new Error(`Failed to fetch blog post ${postId} from Firestore.`);
  }
};

/**
 * Fetches a single blog post by its slug from Firestore.
 * This admin version can fetch posts of any status.
 * Uses the adapter to return a UnifiedBlogPost.
 *
 * @param slug The URL-friendly slug of the blog post.
 * @returns Promise<UnifiedBlogPost | null> The blog post if found, otherwise null.
 * @throws {Error} If fetching from Firestore fails or if required indexes are missing.
 */
export const getBlogPostBySlug = async (
  // Renamed from getPublishedBlogBySlug for admin context
  slug: string
): Promise<UnifiedBlogPost | null> => {
  if (!db) {
    console.error(
      "Firestore database is not initialized in blogService.ts (getBlogPostBySlug)"
    );
    throw new Error("Firestore is not initialized. Cannot fetch blog by slug.");
  }
  if (!slug || typeof slug !== "string" || slug.trim() === "") {
    console.warn("getBlogPostBySlug called with an invalid or empty slug.");
    return null;
  }
  try {
    // Query by slug - admin doesn't need to filter by status here, but can if desired
    const q = query(
      collection(db, BLOG_POSTS_COLLECTION),
      where("slug", "==", slug),
      limit(1) // Slugs should be unique
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      if (querySnapshot.docs.length > 1) {
        console.warn(
          `Data Integrity Issue: Multiple posts found with the same slug: "${slug}". Returning the first one found.`
        );
      }
      const docSnap = querySnapshot.docs[0];
      return adaptFirestoreDocToUnifiedBlogPost(docSnap.id, docSnap.data());
    }
    return null;
  } catch (error) {
    console.error(
      `Error fetching blog post by slug "${slug}" (admin): `,
      error
    );
    if (
      error instanceof Error &&
      error.message.includes("indexes?create_composite") // Though simple slug query might not need it unless combined
    ) {
      console.error(
        "Firestore Index Missing: The query for a blog post by slug might require an index if combined with other filters/orders. " +
          "Please create an index in your Firebase console for the 'blog_posts' collection with field: 'slug' (Ascending/Descending)."
      );
      throw new Error(
        "Firestore index missing for blog post slug query. See console for details."
      );
    }
    throw new Error(
      `Failed to fetch blog post with slug ${slug} from Firestore.`
    );
  }
};

/**
 * Adds a new blog post to Firestore.
 * The input `postData` should align with `UnifiedBlogPost` fields,
 * but `publishedAt` and `updatedAt` will be handled as Timestamps.
 * `isStatic` is not relevant for Firestore-backed posts.
 *
 * @param postData Data for the new blog post, excluding 'id' and 'isStatic'.
 * 'publishedAt' should be a JS Date if provided by client, will be converted.
 * @returns Promise<string> The ID of the newly created blog post.
 * @throws {Error} If adding to Firestore fails.
 */
export const addBlogPost = async (
  postData: Omit<
    UnifiedBlogPost,
    "id" | "isStatic" | "publishedAt" | "updatedAt"
  > & { publishedAt?: Date; updatedAt?: Date }
): Promise<string> => {
  if (!db) {
    console.error(
      "Firestore database is not initialized in blogService.ts (addBlogPost)"
    );
    throw new Error("Firestore is not initialized. Cannot add blog post.");
  }
  try {
    // Prepare data for Firestore, converting JS Dates to Timestamps
    const dataToSave: any = {
      ...postData,
      title: postData.title || "Untitled Post",
      slug: postData.slug || "", // Admin panel should ensure slug uniqueness
      content: postData.content || "",
      excerpt: postData.excerpt || "",
      imageUrl: postData.imageUrl || undefined,
      author: postData.author || undefined,
      relatedProducts: postData.relatedProducts || [],
      Priority: postData.Priority || 3,
      status: postData.status || "draft",
      // Convert dates to Timestamps for Firestore
      // publishedAt is set to serverTimestamp if not provided or invalid
      publishedAt:
        postData.publishedAt instanceof Date
          ? Timestamp.fromDate(postData.publishedAt)
          : serverTimestamp(),
    };
    // updatedAt is set on creation and on update
    dataToSave.updatedAt = serverTimestamp();

    const docRef = await addDoc(
      collection(db, BLOG_POSTS_COLLECTION),
      dataToSave
    );
    console.log("New blog post added with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding blog post: ", error);
    throw new Error("Failed to add blog post to Firestore.");
  }
};

/**
 * Updates an existing blog post in Firestore.
 * Input `updates` can be partial `UnifiedBlogPost` data.
 * JS Dates for `publishedAt` or `updatedAt` will be converted to Timestamps.
 *
 * @param postId The ID of the blog post to update.
 * @param updates Partial data for the blog post.
 * @returns Promise<boolean> True if successful.
 * @throws {Error} If updating Firestore fails.
 */
export const updateBlogPost = async (
  postId: string,
  updates: Partial<Omit<UnifiedBlogPost, "id" | "isStatic">>
): Promise<boolean> => {
  if (!db) {
    console.error(
      "Firestore database is not initialized in blogService.ts (updateBlogPost)"
    );
    throw new Error("Firestore is not initialized. Cannot update blog post.");
  }
  if (!postId) throw new Error("Post ID is required for update.");

  const postDocRef = doc(db, BLOG_POSTS_COLLECTION, postId);
  try {
    const dataToUpdate: { [key: string]: any } = { ...updates };

    // Convert JS Date objects to Firestore Timestamps if present in updates
    if (updates.publishedAt instanceof Date) {
      dataToUpdate.publishedAt = Timestamp.fromDate(updates.publishedAt);
    }
    // Always set/update the updatedAt field to the server timestamp on any update
    dataToUpdate.updatedAt = serverTimestamp();

    // Ensure imageUrl is explicitly set to undefined if passed as empty string, to remove it
    if (updates.imageUrl === "") {
      dataToUpdate.imageUrl = undefined; // Firestore deletes field if value is undefined
    }

    await updateDoc(postDocRef, dataToUpdate);
    console.log("Blog post updated successfully:", postId);
    return true;
  } catch (error) {
    console.error(`Error updating blog post "${postId}": `, error);
    throw new Error(`Failed to update blog post ${postId} in Firestore.`);
  }
};

/**
 * Deletes a blog post from Firestore.
 *
 * @param postId The ID of the blog post to delete.
 * @returns Promise<boolean> True if successful.
 * @throws {Error} If deleting from Firestore fails.
 */
export const deleteBlogPost = async (postId: string): Promise<boolean> => {
  if (!db) {
    console.error(
      "Firestore database is not initialized in blogService.ts (deleteBlogPost)"
    );
    throw new Error("Firestore is not initialized. Cannot delete blog post.");
  }
  if (!postId) throw new Error("Post ID is required for delete.");
  const postDocRef = doc(db, BLOG_POSTS_COLLECTION, postId);
  try {
    await deleteDoc(postDocRef);
    console.log("Blog post deleted successfully:", postId);
    return true;
  } catch (error) {
    console.error(`Error deleting blog post "${postId}": `, error);
    throw new Error(`Failed to delete blog post ${postId} from Firestore.`);
  }
};

// --- Functions for frontend (published posts only) ---

/**
 * Fetches all blog posts marked as "published" from Firestore.
 * Posts are ordered by 'Priority' (ascending) and then by 'publishedAt' (descending).
 * This is intended for the public-facing frontend.
 *
 * @returns Promise<UnifiedBlogPost[]> An array of published blog posts.
 * @throws {Error} If fetching from Firestore fails or if required indexes are missing.
 */
export const getAllPublishedBlogs = async (): Promise<UnifiedBlogPost[]> => {
  if (!db) {
    console.error(
      "Firestore database is not initialized in blogService.ts (getAllPublishedBlogs)"
    );
    throw new Error("Firestore is not initialized. Cannot fetch blogs.");
  }
  try {
    const q = query(
      collection(db, BLOG_POSTS_COLLECTION),
      where("status", "==", "published"),
      orderBy("Priority", "asc"),
      orderBy("publishedAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((docSnap) =>
      adaptFirestoreDocToUnifiedBlogPost(docSnap.id, docSnap.data())
    );
  } catch (error) {
    console.error("Error fetching all published blog posts: ", error);
    if (
      error instanceof Error &&
      error.message.includes("indexes?create_composite")
    ) {
      console.error(
        "Firestore Index Missing: The query for published blog posts requires a composite index. " +
          "Please create an index in your Firebase console for the 'blog_posts' collection with fields: " +
          "'status' (Ascending/Descending), 'Priority' (Ascending), and 'publishedAt' (Descending)."
      );
      throw new Error(
        "Firestore index missing for blog posts query. See console for details to create it in your Firebase console."
      );
    }
    throw new Error("Failed to fetch published blog posts from Firestore.");
  }
};

/**
 * Fetches a single blog post by its slug from Firestore, only if it's "published".
 * This is intended for the public-facing frontend.
 *
 * @param slug The URL-friendly slug of the blog post.
 * @returns Promise<UnifiedBlogPost | null> The blog post if found and published, otherwise null.
 * @throws {Error} If fetching from Firestore fails or if required indexes are missing.
 */
export const getPublishedBlogBySlug = async (
  slug: string
): Promise<UnifiedBlogPost | null> => {
  if (!db) {
    console.error(
      "Firestore database is not initialized in blogService.ts (getPublishedBlogBySlug)"
    );
    throw new Error("Firestore is not initialized. Cannot fetch blog by slug.");
  }
  if (!slug || typeof slug !== "string" || slug.trim() === "") {
    console.warn(
      "getPublishedBlogBySlug called with an invalid or empty slug."
    );
    return null;
  }
  try {
    const q = query(
      collection(db, BLOG_POSTS_COLLECTION),
      where("slug", "==", slug),
      where("status", "==", "published"),
      limit(1)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      if (querySnapshot.docs.length > 1) {
        console.warn(
          `Data Integrity Issue: Multiple published posts found with the same slug: "${slug}". Returning the first one found.`
        );
      }
      const docSnap = querySnapshot.docs[0];
      return adaptFirestoreDocToUnifiedBlogPost(docSnap.id, docSnap.data());
    }
    return null;
  } catch (error) {
    console.error(
      `Error fetching published blog post by slug "${slug}": `,
      error
    );
    if (
      error instanceof Error &&
      error.message.includes("indexes?create_composite")
    ) {
      console.error(
        "Firestore Index Missing: The query for a blog post by slug and status requires a composite index. " +
          "Please create an index in your Firebase console for the 'blog_posts' collection with fields: " +
          "'slug' (Ascending/Descending) and 'status' (Ascending/Descending)."
      );
      throw new Error(
        "Firestore index missing for blog post slug query. See console for details."
      );
    }
    throw new Error(
      `Failed to fetch published blog post with slug ${slug} from Firestore.`
    );
  }
};
