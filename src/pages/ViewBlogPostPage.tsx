// src/pages/ViewBlogPostPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  useParams,
  useNavigate,
  Link as RouterLink,
  useLocation,
} from "react-router-dom"; // Added useLocation
import ReactMarkdown from "react-markdown";
// Import both service functions
import { getBlogPostBySlug } from "../services/blogService";
import { UnifiedBlogPost } from "../data/blog";
import { Product } from "../data/products";
import { getProductById } from "../services/productService";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  ExternalLink,
  Image as ImageIconPlaceholder,
  AlertTriangle,
  ShieldAlert, // Icon for admin view notice
} from "lucide-react";
import { formatDisplayDate, formatCurrency } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const ViewBlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation(); // Hook to get current location

  const [blogPost, setBlogPost] = useState<UnifiedBlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProductsData, setRelatedProductsData] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdminView, setIsAdminView] = useState(false);

  useEffect(() => {
    // Determine if this is an admin view based on the path
    setIsAdminView(location.pathname.startsWith("/admin/blogs/view/"));
  }, [location.pathname]);

  const fetchPostData = useCallback(async () => {
    if (!slug) {
      setError("Blog post identifier is missing.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let post: UnifiedBlogPost | null = null;
      if (isAdminView) {
        // Admin view: fetch any post (draft or published)
        post = await getBlogPostBySlug(slug);
        if (!post) {
          setError(
            "Blog post not found (admin view). It may have been deleted or the slug is incorrect."
          );
        }
      } else {
        // Public view: fetch only published posts
        post = await getBlogPostBySlug(slug);
        if (!post) {
          setError("Blog post not found or not published.");
        }
      }

      if (post) {
        setBlogPost(post);
        if (post.relatedProducts && post.relatedProducts.length > 0) {
          setLoadingRelated(true);
          const fetchedProductsPromises = post.relatedProducts.map(
            (productId) => getProductById(productId)
          );
          const fetchedProductsResults = await Promise.all(
            fetchedProductsPromises
          );
          setRelatedProductsData(
            fetchedProductsResults.filter((p): p is Product => p !== null)
          );
          setLoadingRelated(false);
        }
      }
      // Error messages are set within the if/else blocks above
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
  }, [slug, isAdminView]); // Add isAdminView as a dependency

  useEffect(() => {
    // Only fetch if isAdminView has been determined.
    // This prevents fetching twice on initial load if isAdminView state update triggers a re-render.
    if (typeof isAdminView === "boolean") {
      fetchPostData();
    }
  }, [fetchPostData, isAdminView]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-4xl min-h-screen">
        <Button variant="outline" size="sm" className="mb-6" disabled>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Skeleton className="h-12 w-3/4 mb-3" />
        <Skeleton className="h-5 w-1/2 mb-6" />
        <Skeleton className="h-80 w-full mb-8 rounded-lg" />
        <Skeleton className="h-6 w-full mb-3" />
        <Skeleton className="h-6 w-full mb-3" />
        <Skeleton className="h-6 w-5/6 mb-3" />
        <Skeleton className="h-6 w-full mb-3 mt-8" />
        <Skeleton className="h-6 w-2/3" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-3">
          Error Loading Post
        </h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button
          variant="outline"
          onClick={() => navigate(isAdminView ? "/blog-management" : "/blog")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to{" "}
          {isAdminView ? "Management" : "Blog"}
        </Button>
      </div>
    );
  }

  if (!blogPost) {
    // This state should ideally be covered by the error message from fetchPostData
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 text-center">
        <ImageIconPlaceholder className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-3">
          Blog Post Not Found
        </h2>
        <p className="text-muted-foreground mb-6">
          The blog post you are looking for could not be loaded.
        </p>
        <Button
          variant="outline"
          onClick={() => navigate(isAdminView ? "/blog-management" : "/blog")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to{" "}
          {isAdminView ? "Management" : "Blog"}
        </Button>
      </div>
    );
  }

  const publishedDate = blogPost.publishedAt;

  return (
    <div className="bg-background text-foreground dark:bg-gray-900 py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Button
          variant="outline"
          size="sm"
          className="mb-8 group"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back
        </Button>

        {isAdminView && blogPost.status === "draft" && (
          <div className="mb-6 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-md flex items-center">
            <ShieldAlert className="h-5 w-5 mr-3" />
            <p className="text-sm font-medium">
              You are viewing a DRAFT post. This post is not visible to the
              public.
            </p>
          </div>
        )}
        {isAdminView && blogPost.status === "published" && (
          <div className="mb-6 p-3 bg-green-100 border-l-4 border-green-500 text-green-700 rounded-md flex items-center">
            <ShieldAlert className="h-5 w-5 mr-3" />
            <p className="text-sm font-medium">
              You are previewing a PUBLISHED post.
            </p>
          </div>
        )}

        <article className="bg-card dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden">
          {blogPost.imageUrl && (
            <img
              src={blogPost.imageUrl}
              alt={blogPost.title}
              className="w-full h-64 md:h-80 lg:h-96 object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const placeholder = document.createElement("div");
                placeholder.className =
                  "w-full h-64 md:h-80 lg:h-96 bg-muted dark:bg-gray-700 flex items-center justify-center text-muted-foreground dark:text-gray-500";
                placeholder.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 21.44A2.05 2.05 0 0 0 21 21H3a2 2 0 0 1-2-2V5c0-.52.2-1.01.56-1.38L2.12 2.12a1 1 0 0 1 1.41 0L21.88 20.88a1 1 0 0 1 0 1.41Z"/><path d="M10.44 10.44 3 18"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L15.53 12.47"/></svg>`;
                target.parentNode?.insertBefore(placeholder, target);
              }}
            />
          )}
          {!blogPost.imageUrl && (
            <div className="w-full h-64 md:h-80 lg:h-96 bg-muted dark:bg-gray-700 flex flex-col items-center justify-center text-muted-foreground dark:text-gray-500">
              <ImageIconPlaceholder size={64} strokeWidth={1.5} />
              <p className="mt-2 text-sm">No image available</p>
            </div>
          )}

          <div className="p-6 md:p-8 lg:p-10">
            <header className="mb-6">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground dark:text-white mb-3 leading-tight">
                {blogPost.title}
              </h1>
              <div className="text-sm text-muted-foreground dark:text-gray-400 space-x-2">
                {blogPost.author && (
                  <span className="font-medium text-foreground dark:text-gray-300">
                    By {blogPost.author}
                  </span>
                )}
                {blogPost.author && blogPost.publishedAt && "•"}
                <span>{formatDisplayDate(publishedDate, "PPP")}</span>
              </div>
              {blogPost.excerpt && (
                <p className="mt-4 text-lg text-muted-foreground dark:text-gray-300 italic">
                  {blogPost.excerpt}
                </p>
              )}
            </header>

            <div className="prose prose-lg dark:prose-invert max-w-none markdown-content text-foreground/90 dark:text-gray-300">
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
                      className="text-primary dark:text-orange-400 hover:underline"
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
                      className="pl-4 italic border-l-4 border-muted-foreground/30 dark:border-gray-600 my-5 text-muted-foreground dark:text-gray-400"
                      {...props}
                    />
                  ),
                  code: ({ node, inline, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || "");
                    return !inline && match ? (
                      <pre
                        className={`${className} bg-muted dark:bg-gray-800 p-4 rounded-md overflow-x-auto my-5 text-sm shadow`}
                        {...props}
                      >
                        <code>{String(children).replace(/\n$/, "")}</code>
                      </pre>
                    ) : (
                      <code
                        className={`${className} bg-muted/50 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono`}
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

        {relatedProductsData.length > 0 && (
          <section className="mt-12 pt-8 border-t border-border dark:border-gray-700">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center text-foreground dark:text-white">
              Related Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {loadingRelated
                ? Array.from({ length: 3 }).map((_, idx) => (
                    <Card
                      key={`skeleton-related-${idx}`}
                      className="overflow-hidden shadow-lg rounded-lg bg-card dark:bg-gray-800"
                    >
                      <Skeleton className="h-56 w-full" />
                      <CardContent className="p-5">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-4" />
                        <Skeleton className="h-10 w-28" />
                      </CardContent>
                    </Card>
                  ))
                : relatedProductsData.map((product) => (
                    <Card
                      key={product.id}
                      className="overflow-hidden shadow-lg rounded-lg bg-card dark:bg-gray-800 flex flex-col transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1"
                    >
                      <RouterLink
                        to={`/products/${product.id}`}
                        className="block"
                      >
                        <img
                          src={
                            product.image ||
                            "https://placehold.co/400x300/e2e8f0/cbd5e0?text=Product"
                          }
                          alt={product.name}
                          className="w-full h-56 object-cover"
                          onError={(e) =>
                            (e.currentTarget.src =
                              "https://placehold.co/400x300/e2e8f0/cbd5e0?text=Product")
                          }
                        />
                      </RouterLink>
                      <CardHeader className="pb-2 px-5 pt-5">
                        <CardTitle className="text-xl font-semibold text-foreground dark:text-white hover:text-primary dark:hover:text-orange-400 transition-colors">
                          <RouterLink to={`/products/${product.id}`}>
                            {product.name}
                          </RouterLink>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-5 flex-grow">
                        <p className="text-sm text-muted-foreground dark:text-gray-400 mb-3 line-clamp-2">
                          {product.shortDescription}
                        </p>
                        <p className="text-xl font-bold text-primary dark:text-orange-400">
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
                            <span className="text-sm line-through text-muted-foreground dark:text-gray-400 ml-2">
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
                          className="w-full group border-primary text-primary hover:bg-primary hover:text-primary-foreground dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-400 dark:hover:text-gray-900 transition-all"
                        >
                          <RouterLink to={`/products/${product.id}`}>
                            View Product{" "}
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

export default ViewBlogPostPage;
