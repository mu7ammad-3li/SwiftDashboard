// src/data/blog.ts
import { Timestamp } from "firebase/firestore";

/**
 * Defines the possible statuses for a blog post.
 * - "published": Visible to the public.
 * - "draft": Not visible, still under preparation.
 */
export type BlogPostStatus = "published" | "draft";

/**
 * The canonical interface for a blog post used throughout the frontend application.
 * This structure applies to both static posts and posts fetched from Firestore.
 */
export interface UnifiedBlogPost {
  /** Unique identifier for the blog post.
   * For Firestore posts, this is the document ID.
   * For static posts, this is a manually assigned unique string.
   */
  id: string;

  /** URL-friendly string used in the blog post's path (e.g., /blog/{slug}). Must be unique for published posts. */
  slug: string;

  /** The main title of the blog post. */
  title: string;

  /** The full content of the blog post, typically in Markdown format. */
  content: string;

  /** A short summary or teaser of the blog post, used for previews and meta descriptions. */
  excerpt: string;

  /** Optional URL for the main image associated with the blog post. */
  imageUrl?: string;

  /** The date and time when the blog post was originally published. Stored as a JS Date object in the frontend. */
  publishedAt: Date;

  /** Optional: The date and time when the blog post was last updated. Stored as a JS Date object in the frontend. */
  updatedAt?: Date;

  /** Optional: The name or identifier of the blog post's author. */
  author?: string;

  /** Optional: An array of product IDs or slugs that are related to this blog post. */
  relatedProducts?: string[];

  /**
   * Numeric value indicating the display priority of the post.
   * Lower numbers typically signify higher priority (e.g., for featured or pinned posts).
   * Default should be a neutral value like 3 or 5.
   */
  Priority: number;

  /** The current status of the blog post (e.g., "published" or "draft"). */
  status: BlogPostStatus;

  /**
   * A boolean flag indicating the source of the blog post.
   * - `true`: The post originates from the static `staticBlogs.ts` file.
   * - `false`: The post is fetched dynamically from Firestore.
   */
  isStatic: boolean;

  // Future considerations:
  // metaDescription?: string; // For SEO, if different from excerpt
  // tags?: string[]; // For categorization
}

/**
 * Helper function to convert Firestore document data (which uses Firebase Timestamps)
 * into the frontend-friendly UnifiedBlogPost structure (which uses JS Date objects).
 * This function is crucial for ensuring data consistency when fetching from Firestore.
 *
 * @param docId The Firestore document ID.
 * @param data The raw data object from a Firestore document. Expected to contain fields
 * corresponding to UnifiedBlogPost, with dates as Firestore Timestamps.
 * @returns A UnifiedBlogPost object.
 */
export const adaptFirestoreDocToUnifiedBlogPost = (
  docId: string,
  data: any // Consider defining a stricter FirestoreBlogPostData type for 'data'
): UnifiedBlogPost => {
  const publishedAtTimestamp = data.publishedAt;
  let publishedAtDate: Date;

  // Robust conversion for publishedAt
  if (publishedAtTimestamp instanceof Timestamp) {
    publishedAtDate = publishedAtTimestamp.toDate();
  } else if (
    typeof publishedAtTimestamp === "string" ||
    typeof publishedAtTimestamp === "number"
  ) {
    const parsedDate = new Date(publishedAtTimestamp);
    if (!isNaN(parsedDate.getTime())) {
      publishedAtDate = parsedDate;
    } else {
      publishedAtDate = new Date(); // Fallback
      console.warn(
        `Firestore Adapter: PublishedAt for post ID ${docId} was unparseable (${publishedAtTimestamp}). Defaulting to current date.`
      );
    }
  } else if (
    publishedAtTimestamp &&
    typeof publishedAtTimestamp.toDate === "function"
  ) {
    // Handle cases where it might be a different Timestamp-like object (e.g. from Admin SDK or older client SDKs)
    publishedAtDate = publishedAtTimestamp.toDate();
  } else {
    publishedAtDate = new Date(); // Fallback to now if undefined or unparseable
    console.warn(
      `Firestore Adapter: PublishedAt for post ID ${docId} was missing or invalid. Defaulting to current date.`
    );
  }

  // Robust conversion for updatedAt (optional field)
  let updatedAtDate: Date | undefined = undefined;
  if (data.updatedAt) {
    const updatedAtTimestamp = data.updatedAt;
    if (updatedAtTimestamp instanceof Timestamp) {
      updatedAtDate = updatedAtTimestamp.toDate();
    } else if (
      typeof updatedAtTimestamp === "string" ||
      typeof updatedAtTimestamp === "number"
    ) {
      const parsedDate = new Date(updatedAtTimestamp);
      if (!isNaN(parsedDate.getTime())) {
        updatedAtDate = parsedDate;
      } else {
        console.warn(
          `Firestore Adapter: UpdatedAt for post ID ${docId} was unparseable (${updatedAtTimestamp}).`
        );
      }
    } else if (
      updatedAtTimestamp &&
      typeof updatedAtTimestamp.toDate === "function"
    ) {
      updatedAtDate = updatedAtTimestamp.toDate();
    } else if (updatedAtTimestamp) {
      // If it exists but isn't a known type
      console.warn(
        `Firestore Adapter: UpdatedAt for post ID ${docId} was of an unexpected type.`
      );
    }
  }

  return {
    id: docId,
    title: data.title || "Untitled Post",
    slug: data.slug || docId, // Fallback slug to docId if not present; admin should ensure slugs are set.
    content: data.content || "",
    // Ensure excerpt is always a string, even if empty. Admin should provide this.
    excerpt:
      typeof data.excerpt === "string"
        ? data.excerpt
        : typeof data.content === "string"
        ? data.content.substring(0, 150).trim() + "..."
        : "No excerpt available.",
    imageUrl: data.imageUrl, // Assumes imageUrl is a string or undefined
    author: data.author, // Assumes author is a string or undefined
    relatedProducts: Array.isArray(data.relatedProducts)
      ? data.relatedProducts
      : [],
    publishedAt: publishedAtDate,
    updatedAt: updatedAtDate,
    Priority: typeof data.Priority === "number" ? data.Priority : 3, // Default priority if not set or invalid
    status:
      data.status === "published" || data.status === "draft"
        ? data.status
        : "draft", // Default to "draft" if status is invalid
    isStatic: false, // This adapter is for Firestore documents, so isStatic is always false.
  };
};
