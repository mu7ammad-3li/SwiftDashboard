// BlogPost.tsx (Frontend E-commerce page for displaying a single blog post)
import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link as RouterLink, useNavigate } from "react-router-dom"; // Added useNavigate
import ReactMarkdown from "react-markdown";
import { getBlogBySlug, BlogPost } from "../services/blogService"; // Updated import path and BlogPost type
import { Product, productsData } from "../data/products"; // Using hardcoded productsData for now
// import { getProductById } from '../services/productService'; // Ideal: use a product service
import { formatDisplayDate, formatCurrency } from "../lib/utils"; // Assuming utils.ts is in lib/
import Spinner from "../components/ui/Spinner"; // Assuming Spinner component path
import { Button } from "@/components/ui/button"; // Assuming shadcn Button
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"; // Assuming shadcn Card
import { Badge } from "@/components/ui/badge"; // Assuming shadcn Badge
import {
  ArrowLeft,
  ExternalLink,
  Image as ImageIconPlaceholder,
} from "lucide-react"; // Icons
import { Timestamp } from "firebase/firestore"; // Import Timestamp
import { Skeleton } from "./ui/skeleton";

// Helper function to simulate fetching a product by ID from productsData
// In a real app, this would be an async call to your productService
const getProductByIdMock = (id: string): Product | undefined => {
  return productsData.find((p) => p.id === id);
};

const IndividualBlogPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate(); // Hook for navigation

  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProductsData, setRelatedProductsData] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPostData = useCallback(async () => {
    if (!slug) {
      setError("Blog post identifier is missing.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const post = await getBlogBySlug(slug);
      if (post) {
        setBlogPost(post);
        if (post.relatedProducts && post.relatedProducts.length > 0) {
          setLoadingRelated(true);
          // Simulate fetching product details
          const fetchedProducts = post.relatedProducts
            .map((productId) => getProductByIdMock(productId))
            .filter((p) => p !== undefined) as Product[];
          setRelatedProductsData(fetchedProducts);
          setLoadingRelated(false);
        }
      } else {
        setError("Blog post not found.");
      }
    } catch (err) {
      console.error("Error fetching blog post:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred while fetching the post."
      );
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchPostData();
  }, [fetchPostData]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Spinner />
        <p className="text-lg text-gray-600 dark:text-gray-400 mt-4">
          Loading blog post...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 text-center">
        <h2 className="text-2xl font-semibold text-red-600 dark:text-red-400 mb-4">
          Error
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
        <Button variant="outline" onClick={() => navigate("/blog")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
        </Button>
      </div>
    );
  }

  if (!blogPost) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 text-center">
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Blog Post Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The blog post you are looking for does not exist or may have been
          moved.
        </p>
        <Button variant="outline" onClick={() => navigate("/blog")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
        </Button>
      </div>
    );
  }

  const publishedDate =
    blogPost.publishedAt instanceof Timestamp
      ? blogPost.publishedAt.toDate()
      : new Date(); // Fallback, though service should ensure Timestamp

  return (
    <div className="bg-gray-50 dark:bg-gray-900 py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Button
          variant="outline"
          size="sm"
          className="mb-8 group"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />{" "}
          Back
        </Button>

        <article className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden">
          {blogPost.imageUrl && (
            <img
              src={blogPost.imageUrl}
              alt={blogPost.title}
              className="w-full h-64 md:h-80 lg:h-96 object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none"; // Hide broken image
                // Optionally, show a placeholder div
                const placeholder = document.createElement("div");
                placeholder.className =
                  "w-full h-64 md:h-80 lg:h-96 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500";
                placeholder.innerHTML =
                  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image-off"><path d="M21.44 21.44A2.05 2.05 0 0 0 21 21H3a2 2 0 0 1-2-2V5c0-.52.2-1.01.56-1.38L2.12 2.12a1 1 0 0 1 1.41 0L21.88 20.88a1 1 0 0 1 0 1.41Z"/><path d="M10.44 10.44 3 18"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L15.53 12.47"/></svg>';
                target.parentNode?.insertBefore(placeholder, target);
              }}
            />
          )}
          {!blogPost.imageUrl && (
            <div className="w-full h-64 md:h-80 lg:h-96 bg-gray-200 dark:bg-gray-700 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
              <ImageIconPlaceholder size={64} strokeWidth={1.5} />
              <p className="mt-2 text-sm">No image available</p>
            </div>
          )}

          <div className="p-6 md:p-8 lg:p-10">
            <header className="mb-6">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
                {blogPost.title}
              </h1>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {blogPost.author && (
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    By {blogPost.author}
                  </span>
                )}
                {blogPost.author && blogPost.publishedAt && " • "}
                {blogPost.publishedAt && (
                  <span>{formatDisplayDate(publishedDate, "PPP")}</span>
                )}
              </div>
            </header>

            <div className="prose prose-lg dark:prose-invert max-w-none markdown-content text-gray-700 dark:text-gray-300">
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => (
                    <h1
                      className="text-3xl font-semibold mt-8 mb-4 border-b pb-2 dark:border-gray-700"
                      {...props}
                    />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2
                      className="text-2xl font-semibold mt-6 mb-3 border-b pb-1 dark:border-gray-700"
                      {...props}
                    />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3
                      className="text-xl font-semibold mt-4 mb-2"
                      {...props}
                    />
                  ),
                  p: ({ node, ...props }) => (
                    <p className="my-5 leading-relaxed" {...props} />
                  ),
                  a: ({ node, ...props }) => (
                    <a
                      className="text-bella dark:text-bella-light hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props}
                    />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul className="list-disc pl-6 my-5 space-y-1" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol
                      className="list-decimal pl-6 my-5 space-y-1"
                      {...props}
                    />
                  ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote
                      className="pl-4 italic border-l-4 border-gray-300 dark:border-gray-600 my-5 text-gray-600 dark:text-gray-400"
                      {...props}
                    />
                  ),
                  code: ({ node, inline, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || "");
                    return !inline && match ? (
                      <pre
                        className={
                          className +
                          " bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto my-5 text-sm shadow"
                        }
                        {...props}
                      >
                        <code>{String(children).replace(/\n$/, "")}</code>
                      </pre>
                    ) : (
                      <code
                        className={
                          className +
                          " bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono"
                        }
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {blogPost.content}
              </ReactMarkdown>
            </div>
          </div>
        </article>

        {/* Related Products Section */}
        {relatedProductsData.length > 0 && (
          <section className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center text-gray-800 dark:text-white">
              منتجات ذات صلة
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {loadingRelated
                ? Array.from({ length: 3 }).map(
                    (
                      _,
                      idx // Show 3 skeletons while loading related
                    ) => (
                      <Card
                        key={`skeleton-related-${idx}`}
                        className="overflow-hidden shadow-lg rounded-lg bg-white dark:bg-gray-800"
                      >
                        <Skeleton className="h-56 w-full" />
                        <CardContent className="p-5">
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-1/2 mb-4" />
                          <Skeleton className="h-10 w-28" />
                        </CardContent>
                      </Card>
                    )
                  )
                : relatedProductsData.map((product) => (
                    <Card
                      key={product.id}
                      className="overflow-hidden shadow-lg rounded-lg bg-white dark:bg-gray-800 flex flex-col transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1"
                    >
                      <RouterLink to={`/store/${product.id}`} className="block">
                        <img
                          src={
                            product.image ||
                            "https://placehold.co/400x300/e2e8f0/cbd5e0?text=Bella+Product"
                          }
                          alt={product.name}
                          className="w-full h-56 object-cover"
                          onError={(e) =>
                            (e.currentTarget.src =
                              "https://placehold.co/400x300/e2e8f0/cbd5e0?text=Bella+Product")
                          }
                        />
                      </RouterLink>
                      <CardHeader className="pb-2 px-5 pt-5">
                        <CardTitle className="text-xl font-semibold text-gray-800 dark:text-white hover:text-bella dark:hover:text-bella-light transition-colors">
                          <RouterLink to={`/store/${product.id}`}>
                            {product.name}
                          </RouterLink>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-5 flex-grow">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {product.shortDescription}
                        </p>
                        <p className="text-xl font-bold text-bella dark:text-bella-light">
                          {product.onSale && product.salePrice
                            ? formatCurrency(
                                parseFloat(
                                  product.salePrice.replace(/[^0-9.]/g, "")
                                )
                              )
                            : formatCurrency(
                                parseFloat(
                                  product.price.replace(/[^0-9.]/g, "")
                                )
                              )}
                          {product.onSale && product.salePrice && (
                            <span className="text-sm line-through text-gray-500 dark:text-gray-400 ml-2">
                              {formatCurrency(
                                parseFloat(
                                  product.price.replace(/[^0-9.]/g, "")
                                )
                              )}
                            </span>
                          )}
                        </p>
                      </CardContent>
                      <CardFooter className="px-5 pb-5 pt-3 border-t dark:border-gray-700">
                        <Button
                          asChild
                          variant="outline"
                          className="w-full group border-bella text-bella hover:bg-bella hover:text-white dark:border-bella-light dark:text-bella-light dark:hover:bg-bella-light dark:hover:text-gray-900 transition-all"
                        >
                          <RouterLink to={`/store/${product.id}`}>
                            عرض المنتج{" "}
                            <ExternalLink className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </RouterLink>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default IndividualBlogPage;
