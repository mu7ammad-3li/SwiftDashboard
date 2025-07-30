// src/components/blogs/BlogFormDialog.tsx
import React, { useState, useEffect, useCallback, ChangeEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ImageIcon, PlusCircle, XCircle } from "lucide-react";
import type { UnifiedBlogPost, BlogPostStatus } from "@/data/blog";
import { addBlogPost, updateBlogPost } from "@/services/blogService";
import { getProducts } from "@/services/productService";
import type { Product } from "@/data/products";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface BlogFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  post?: UnifiedBlogPost | null;
}

const BlogFormDialog: React.FC<BlogFormDialogProps> = ({
  isOpen,
  onOpenChange,
  onSuccess,
  post,
}) => {
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [author, setAuthor] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedRelatedProducts, setSelectedRelatedProducts] = useState<
    string[]
  >([]);
  const [publishedAtString, setPublishedAtString] = useState<string>("");
  const [priority, setPriority] = useState<number>(3);
  const [status, setStatus] = useState<BlogPostStatus>("draft");

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productToAdd, setProductToAdd] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  const generateSlug = useCallback((titleStr: string) => {
    return titleStr
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "")
      .replace(/--+/g, "-");
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (post) {
        setTitle(post.title || "");
        setSlug(post.slug || generateSlug(post.title || ""));
        setContent(post.content || "");
        setExcerpt(post.excerpt || "");
        setAuthor(post.author || "");
        setImageUrl(post.imageUrl || "");
        setSelectedRelatedProducts(post.relatedProducts || []);
        setPriority(post.Priority || 3);
        setStatus(post.status || "draft");
        if (
          post.publishedAt instanceof Date &&
          !isNaN(post.publishedAt.getTime())
        ) {
          setPublishedAtString(post.publishedAt.toISOString().split("T")[0]);
        } else {
          setPublishedAtString("");
        }
      } else {
        setTitle("");
        setSlug("");
        setContent("");
        setExcerpt("");
        setAuthor("");
        setImageUrl("");
        setSelectedRelatedProducts([]);
        setPriority(3);
        setStatus("draft");
        setPublishedAtString(new Date().toISOString().split("T")[0]);
      }
      setProductToAdd("");
    }
  }, [post, isOpen, generateSlug]);

  useEffect(() => {
    const fetchProds = async () => {
      setIsLoadingProducts(true);
      try {
        const productsData = await getProducts();
        setAllProducts(productsData);
      } catch (error) {
        toast({
          title: "Error Fetching Products",
          description: (error as Error).message,
          variant: "destructive",
        });
      } finally {
        setIsLoadingProducts(false);
      }
    };
    if (isOpen) fetchProds();
  }, [isOpen, toast]);

  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!post || !slug) {
      setSlug(generateSlug(newTitle));
    }
  };

  const handleAddRelatedProduct = () => {
    if (productToAdd && !selectedRelatedProducts.includes(productToAdd)) {
      setSelectedRelatedProducts([...selectedRelatedProducts, productToAdd]);
    } else if (selectedRelatedProducts.includes(productToAdd)) {
      toast({
        title: "Info",
        description: "Product already added.",
        variant: "default",
      });
    }
    setProductToAdd("");
  };

  const handleRemoveRelatedProduct = (productIdToRemove: string) => {
    setSelectedRelatedProducts(
      selectedRelatedProducts.filter((id) => id !== productIdToRemove)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !excerpt.trim()) {
      toast({
        title: "Validation Error",
        description: "Title, Content, and Excerpt are required fields.",
        variant: "destructive",
      });
      return;
    }
    if (priority < 1 || priority > 5) {
      toast({
        title: "Validation Error",
        description: "Priority must be between 1 and 5.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    const finalSlug = slug.trim() || generateSlug(title);

    let publishedAtDate: Date | undefined = undefined;
    if (publishedAtString) {
      const parsedDate = new Date(publishedAtString);
      if (!isNaN(parsedDate.getTime())) {
        if (
          post &&
          post.publishedAt instanceof Date &&
          publishedAtString === post.publishedAt.toISOString().split("T")[0]
        ) {
          publishedAtDate = new Date(post.publishedAt);
        } else {
          const [year, month, day] = publishedAtString.split("-").map(Number);
          publishedAtDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
        }
      } else {
        toast({
          title: "Invalid Date",
          description: "The published date is not valid.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
    }

    const blogPostPayload: Omit<
      UnifiedBlogPost,
      "id" | "isStatic" | "publishedAt" | "updatedAt"
    > & { publishedAt?: Date } = {
      title: title.trim(),
      slug: finalSlug,
      content: content.trim(),
      excerpt: excerpt.trim(),
      author: author.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      relatedProducts: selectedRelatedProducts,
      Priority: priority,
      status: status,
    };
    if (publishedAtDate) {
      blogPostPayload.publishedAt = publishedAtDate;
    }

    try {
      if (post && post.id) {
        await updateBlogPost(
          post.id,
          blogPostPayload as Partial<Omit<UnifiedBlogPost, "id" | "isStatic">>
        );
        toast({
          title: "Success",
          description: "Blog post updated successfully.",
        });
      } else {
        await addBlogPost(blogPostPayload);
        toast({
          title: "Success",
          description: "Blog post created successfully.",
        });
      }
      onSuccess();
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "An unknown error occurred.";
      toast({
        title: "Operation Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {post ? "Edit Blog Post" : "Add New Blog Post"}
          </DialogTitle>
          <DialogDescription>
            {post
              ? "Update the details for this blog post."
              : "Fill in the information for your new blog post."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow min-h-0 pr-6 -mr-6">
          <form
            onSubmit={handleSubmit}
            className="space-y-6 py-4"
            id="blogPostForm"
          >
            {/* Title Input */}
            <div>
              <Label htmlFor="title" className="font-semibold">
                Title*
              </Label>
              <Input
                id="title"
                value={title}
                onChange={handleTitleChange}
                placeholder="Enter post title"
                disabled={isSubmitting}
                required
                className="mt-1"
              />
            </div>

            {/* Slug Input */}
            <div>
              <Label htmlFor="slug" className="font-semibold">
                Slug
              </Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g., my-awesome-post (auto-generated if blank)"
                disabled={isSubmitting}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                The URL-friendly version of the title. Leave blank to
                auto-generate if new, or to keep existing if editing and
                unchanged.
              </p>
            </div>

            {/* Excerpt Textarea */}
            <div>
              <Label htmlFor="excerpt" className="font-semibold">
                Excerpt (Short Summary)*
              </Label>
              <Textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Write a brief summary for previews and SEO (max 200 characters recommended)."
                disabled={isSubmitting}
                rows={3}
                required
                className="mt-1"
                maxLength={250}
              />
              <p className="text-xs text-muted-foreground mt-1">
                A concise summary of the post.
              </p>
            </div>

            {/* Content Textarea */}
            <div>
              <Label htmlFor="content" className="font-semibold">
                Content (Markdown Supported)*
              </Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your blog post content here. You can use Markdown for formatting."
                disabled={isSubmitting}
                rows={12}
                required
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use Markdown for text formatting (e.g., # Heading, *italic*,
                **bold**, [link](url)).
              </p>
            </div>

            {/* Priority Input */}
            <div>
              <Label htmlFor="priority" className="font-semibold">
                Priority (1-5, 1 is highest)*
              </Label>
              <Input
                id="priority"
                type="number"
                value={priority}
                onChange={(e) =>
                  setPriority(
                    Math.max(1, Math.min(5, parseInt(e.target.value, 10) || 3))
                  )
                }
                placeholder="1 (Highest) - 5 (Lowest)"
                disabled={isSubmitting}
                min="1"
                max="5"
                required
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Controls display order. Lower numbers appear first.
              </p>
            </div>

            {/* Status Select Input */}
            <div>
              <Label htmlFor="status" className="font-semibold">
                Status*
              </Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as BlogPostStatus)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="status" className="mt-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Set post visibility. Only 'Published' posts appear on the public
                site.
              </p>
            </div>

            {/* Published At Date Input */}
            <div>
              <Label htmlFor="publishedAt" className="font-semibold">
                Published Date*
              </Label>
              <Input
                id="publishedAt"
                type="date"
                value={publishedAtString}
                onChange={(e) => setPublishedAtString(e.target.value)}
                disabled={isSubmitting}
                required
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Set the publication date. For new posts, defaults to today.
              </p>
            </div>

            {/* Author Input */}
            <div>
              <Label htmlFor="author" className="font-semibold">
                Author
              </Label>
              <Input
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Author's name (optional)"
                disabled={isSubmitting}
                className="mt-1"
              />
            </div>

            {/* Image URL Input & Preview */}
            <div>
              <Label htmlFor="imageUrl" className="font-semibold">
                Featured Image URL
              </Label>
              <Input
                id="imageUrl"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                disabled={isSubmitting}
                className="mt-1"
              />
              {imageUrl && (
                <div className="mt-3">
                  <Label className="text-xs text-muted-foreground">
                    Image Preview:
                  </Label>
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="mt-1 h-24 w-auto object-contain rounded-md border shadow-sm bg-muted"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="text-destructive p-0 h-auto text-xs mt-1"
                    onClick={() => setImageUrl("")}
                    disabled={isSubmitting}
                  >
                    Remove Image URL
                  </Button>
                </div>
              )}
              {!imageUrl && (
                <div className="mt-2 h-24 w-full bg-muted rounded-md flex items-center justify-center text-muted-foreground border">
                  <ImageIcon size={40} />
                  <span className="ml-2">No image URL provided</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Paste the full URL of an externally hosted image.
              </p>
            </div>

            {/* Related Products Section - Modified for multiple products */}
            <div className="space-y-3">
              <Label className="font-semibold">
                Related Products (Optional)
              </Label>
              <div className="flex items-center gap-2">
                <Select
                  value={productToAdd}
                  onValueChange={setProductToAdd}
                  disabled={isSubmitting || isLoadingProducts}
                >
                  <SelectTrigger className="flex-grow">
                    {/* The placeholder in SelectValue will be shown when productToAdd is "" */}
                    <SelectValue
                      placeholder={
                        isLoadingProducts
                          ? "Loading products..."
                          : "Select a product to add"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {/*
                      REMOVED: <SelectItem value="" disabled>Select a product</SelectItem>
                      This item caused the error because its value is an empty string.
                      The placeholder functionality is handled by SelectValue.
                    */}
                    {!isLoadingProducts &&
                      allProducts
                        .filter((p) => !selectedRelatedProducts.includes(p.id))
                        .map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {" "}
                            {/* Ensure product.id is never "" */}
                            {product.name} ({product.price})
                          </SelectItem>
                        ))}
                    {isLoadingProducts && (
                      <SelectItem value="loading-placeholder" disabled>
                        Loading...
                      </SelectItem>
                    )}{" "}
                    {/* Use a non-empty unique value for loading item */}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddRelatedProduct}
                  disabled={isSubmitting || isLoadingProducts || !productToAdd}
                  title="Add selected product"
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>

              {selectedRelatedProducts.length > 0 && (
                <div className="mt-2 space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Selected Products:
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedRelatedProducts.map((productId) => {
                      const productDetails = allProducts.find(
                        (p) => p.id === productId
                      );
                      return (
                        <Badge
                          key={productId}
                          variant="secondary"
                          className="flex items-center gap-1.5 pr-1"
                        >
                          {productDetails?.name || productId}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() =>
                              handleRemoveRelatedProduct(productId)
                            }
                            disabled={isSubmitting}
                            title={`Remove ${
                              productDetails?.name || "product"
                            }`}
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Link this blog post to relevant products.
              </p>
            </div>
          </form>
        </ScrollArea>

        <DialogFooter className="mt-auto pt-6 border-t">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            form="blogPostForm"
            disabled={isSubmitting || isLoadingProducts}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting
              ? post
                ? "Saving Changes..."
                : "Creating Post..."
              : post
              ? "Save Changes"
              : "Create Post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BlogFormDialog;
