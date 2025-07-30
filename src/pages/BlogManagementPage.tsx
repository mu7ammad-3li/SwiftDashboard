// src/pages/BlogManagementPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getBlogPosts, deleteBlogPost } from "../services/blogService";
// Updated import to use UnifiedBlogPost
import type { UnifiedBlogPost, BlogPostStatus } from "../data/blog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Newspaper,
  Image as ImageIcon,
  CheckCircle, // For published
  FileText, // For draft
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatDisplayDate } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import BlogFormDialog from "@/components/blogs/BlogFormDialog";
// No need to import Timestamp from 'firebase/firestore' here if dates are JS Date objects

const StatusBadge: React.FC<{ status: BlogPostStatus }> = ({ status }) => {
  let variant: "default" | "secondary" | "outline" | "destructive" | "success" =
    "secondary"; // Added success for typing
  let Icon = FileText;
  let text = "Draft";

  if (status === "published") {
    variant = "success"; // Using a success-like variant for published
    Icon = CheckCircle;
    text = "Published";
  }

  return (
    <Badge variant={variant} className="capitalize text-xs">
      <Icon className="mr-1 h-3 w-3" />
      {text}
    </Badge>
  );
};

const BlogManagementPage: React.FC = () => {
  const [blogPosts, setBlogPosts] = useState<UnifiedBlogPost[]>([]); // Use UnifiedBlogPost
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<UnifiedBlogPost | null>(null); // Use UnifiedBlogPost

  const [openDeleteDialogPostId, setOpenDeleteDialogPostId] = useState<
    string | null
  >(null);
  const [postPendingDeletion, setPostPendingDeletion] =
    useState<UnifiedBlogPost | null>(null); // Use UnifiedBlogPost
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const posts = await getBlogPosts(); // Service now returns UnifiedBlogPost[]
      setBlogPosts(posts);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to load blog posts: ${errorMsg}`);
      toast({
        title: "Error Loading Posts",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleOpenFormDialog = (post?: UnifiedBlogPost) => {
    // Param is UnifiedBlogPost
    setEditingPost(post || null);
    setIsFormOpen(true);
  };

  const handleCloseFormDialog = () => {
    setIsFormOpen(false);
    setEditingPost(null);
  };

  const handleFormSuccess = () => {
    handleCloseFormDialog();
    fetchPosts();
  };

  const handleTriggerDeleteDialog = (post: UnifiedBlogPost) => {
    // Param is UnifiedBlogPost
    setPostPendingDeletion(post);
    setOpenDeleteDialogPostId(post.id);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialogPostId(null);
    setPostPendingDeletion(null);
  };

  const handleConfirmDelete = async () => {
    if (!postPendingDeletion) return;
    setIsDeleting(true);
    try {
      // deleteBlogPost service function expects postId and optionally imageUrl
      await deleteBlogPost(postPendingDeletion.id);
      toast({
        title: "Success",
        description: `Blog post "${postPendingDeletion.title}" deleted.`,
      });
      setBlogPosts((prev) =>
        prev.filter((p) => p.id !== postPendingDeletion.id)
      );
      handleCloseDeleteDialog();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not delete post.";
      toast({
        title: "Deletion Failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const renderLoadingSkeletons = (count = 5) =>
    Array.from({ length: count }).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell>
          <div className="h-10 w-10 bg-muted rounded-md animate-pulse"></div>
        </TableCell>
        <TableCell>
          <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
        </TableCell>
        <TableCell>
          <div className="h-4 bg-muted rounded animate-pulse w-1/2"></div>
        </TableCell>
        <TableCell>
          <div className="h-4 bg-muted rounded animate-pulse w-1/2"></div>
        </TableCell>
        <TableCell>
          <div className="h-4 bg-muted rounded animate-pulse w-1/4"></div>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex gap-1 justify-end">
            <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
            <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
            <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
          </div>
        </TableCell>
      </TableRow>
    ));

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-2xl font-bold flex items-center">
            <Newspaper className="mr-2 h-6 w-6" /> Blog Post Management
          </h2>
          <Button onClick={() => handleOpenFormDialog()} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Post
          </Button>
        </div>

        {error && <p className="text-destructive p-4 text-center">{error}</p>}

        <ScrollArea className="flex-grow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Published</TableHead>
                <TableHead className="text-right w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                renderLoadingSkeletons()
              ) : !error && blogPosts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-10"
                  >
                    No blog posts found. Click "Add New Post" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                blogPosts.map(
                  (
                    post // post is UnifiedBlogPost
                  ) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        {post.imageUrl ? (
                          <img
                            src={post.imageUrl}
                            alt={post.title}
                            className="h-10 w-10 object-cover rounded-md"
                            onError={(e) =>
                              (e.currentTarget.src =
                                "https://placehold.co/40x40/eee/ccc?text=?")
                            }
                          />
                        ) : (
                          <div className="h-10 w-10 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                            <ImageIcon size={20} />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium truncate max-w-xs">
                        {/* Link to the public view page */}
                        <Link
                          to={`/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline hover:text-primary"
                          title={`View public post: ${post.title}`}
                        >
                          {post.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={post.status} />
                      </TableCell>
                      <TableCell>{post.author || "N/A"}</TableCell>
                      <TableCell>
                        {/* post.publishedAt is now a Date object */}
                        {formatDisplayDate(post.publishedAt, "MMM d, yy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="View Post Details (Admin)"
                          // Navigate to an admin-specific view page.
                          // For now, this navigates to a placeholder path.
                          // You might want to create a separate ViewBlogPostPage for admin or enhance the public one.
                          onClick={() =>
                            navigate(`/admin/blogs/view/${post.slug}`)
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Edit Post"
                          onClick={() => handleOpenFormDialog(post)}
                          className="ml-1"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog
                          open={openDeleteDialogPostId === post.id}
                          onOpenChange={(isOpen) => {
                            if (!isOpen) {
                              handleCloseDeleteDialog();
                            }
                          }}
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Delete Post"
                              className="text-destructive hover:text-destructive ml-1"
                              onClick={() => handleTriggerDeleteDialog(post)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Are you absolutely sure?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently delete the blog post "
                                {postPendingDeletion?.id === post.id
                                  ? postPendingDeletion.title
                                  : post.title}
                                ".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel
                                onClick={handleCloseDeleteDialog}
                                disabled={isDeleting}
                              >
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                {isDeleting && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {isDeleting ? "Deleting..." : "Yes, delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  )
                )
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {isFormOpen && ( // Render dialog only when needed
        <BlogFormDialog
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSuccess={handleFormSuccess}
          post={editingPost} // Pass UnifiedBlogPost
        />
      )}
    </>
  );
};

export default BlogManagementPage;
