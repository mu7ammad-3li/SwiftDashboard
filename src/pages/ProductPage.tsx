// src/pages/ProductPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  // Assuming these functions exist in your productService
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
} from "../services/productService"; // Adjust path if needed
import { Product } from "../data/products"; // Adjust path if needed
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  X,
  Eye,
  Edit,
  Trash2,
  PlusCircle,
  Image as ImageIcon,
  Loader2,
} from "lucide-react"; // Added icons
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogTrigger, // Import DialogTrigger
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // For long description
import { Checkbox } from "@/components/ui/checkbox"; // For boolean flags
import { Switch } from "@/components/ui/switch"; // Alternative for boolean flags
import { useToast } from "@/components/ui/use-toast";

// Default empty product structure for forms
const defaultProductDetails = {
  longDescription: "",
  features: [],
  instructions: [],
};
const defaultProduct: Omit<Product, "id"> = {
  name: "",
  image: "",
  price: "", // Keep as string if service expects string
  shortDescription: "",
  FreeDelivery: false,
  featured: false,
  onSale: false,
  salePrice: "", // Keep consistent type (string or undefined)
  details: { ...defaultProductDetails },
};

const ProductPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // --- Modal States ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // --- Form Data States ---
  const [productFormData, setProductFormData] = useState<Omit<Product, "id">>({
    ...defaultProduct,
  });
  const [productToEditId, setProductToEditId] = useState<string | null>(null); // Store ID for editing

  // --- Action Loading States ---
  const [isSubmitting, setIsSubmitting] = useState(false); // For add/update
  const [isDeleting, setIsDeleting] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // --- Data Fetching ---
  const fetchProducts = useCallback(
    async (selectProductId?: string) => {
      setLoading(true);
      setError(null);
      let fetchedProductList: Product[] = [];
      try {
        fetchedProductList = await getProducts();
        // Optional: Sort products alphabetically
        fetchedProductList.sort((a, b) => a.name.localeCompare(b.name));
        setProducts(fetchedProductList);

        if (selectProductId) {
          const reselected = fetchedProductList.find(
            (p) => p.id === selectProductId
          );
          setSelectedProduct(reselected || null);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(`Failed to load products: ${errorMsg}`);
        toast({
          title: "Error Loading Products",
          description: errorMsg,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // --- Modal Open/Close Handlers ---
  const handleOpenAddModal = () => {
    setProductFormData({
      ...defaultProduct,
      details: { ...defaultProductDetails },
    }); // Reset form
    setProductToEditId(null); // Ensure not in edit mode
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setProductToEditId(product.id);
    // Pre-fill form, ensuring deep copy of details
    setProductFormData({
      name: product.name || "",
      image: product.image || "",
      price: product.price || "",
      shortDescription: product.shortDescription || "",
      FreeDelivery: product.FreeDelivery || false,
      featured: product.featured || false,
      onSale: product.onSale || false,
      salePrice: product.salePrice || "",
      details: {
        longDescription: product.details?.longDescription || "",
        // Ensure arrays are copied, handle potential undefined
        features: [...(product.details?.features || [])],
        instructions: [...(product.details?.instructions || [])],
      },
    });
    setIsEditModalOpen(true);
  };

  const handleCloseProductModal = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setProductToEditId(null); // Clear edit ID
    setProductFormData({
      ...defaultProduct,
      details: { ...defaultProductDetails },
    }); // Reset form
  };

  const handleOpenDeleteDialog = (product: Product) => {
    setProductToDelete(product);
    // Dialog is opened via AlertDialogTrigger
  };

  // --- Form Change Handler ---
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    // Handle nested 'details' fields
    if (name.startsWith("details.")) {
      const detailField = name.split(".")[1] as keyof Product["details"];
      // Handle array fields (features, instructions) - assuming comma-separated input
      if (detailField === "features" || detailField === "instructions") {
        const items = value
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item); // Split, trim, remove empty
        setProductFormData((prev) => ({
          ...prev,
          details: {
            ...prev.details,
            [detailField]: items,
          },
        }));
      } else {
        // Handle other detail fields (like longDescription)
        setProductFormData((prev) => ({
          ...prev,
          details: {
            ...prev.details,
            [detailField]: value,
          },
        }));
      }
    } else {
      // Handle top-level fields
      setProductFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Specific handler for Checkbox/Switch components
  const handleBooleanChange = (
    field: keyof Omit<Product, "id" | "details">,
    checked: boolean
  ) => {
    setProductFormData((prev) => ({
      ...prev,
      [field]: checked,
    }));
    // If turning off 'onSale', clear salePrice
    if (field === "onSale" && !checked) {
      setProductFormData((prev) => ({ ...prev, salePrice: "" }));
    }
  };

  // --- Submit Handler (Add/Update) ---
  const handleSubmitProduct = async () => {
    setIsSubmitting(true);
    // Basic Validation
    if (
      !productFormData.name ||
      !productFormData.price ||
      !productFormData.image
    ) {
      toast({
        title: "Missing Fields",
        description: "Please fill in Name, Price, and Image URL.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      let productId = productToEditId; // Use existing ID if editing
      if (productToEditId) {
        // Update existing product
        const success = await updateProduct(productToEditId, productFormData);
        if (!success) throw new Error("Update failed in service");
        toast({
          title: "Success",
          description: "Product updated successfully.",
        });
      } else {
        // Add new product
        productId = await addProduct(productFormData); // Get the new ID
        if (!productId) throw new Error("Add failed in service");
        toast({ title: "Success", description: "Product added successfully." });
      }
      handleCloseProductModal();
      fetchProducts(productId); // Re-fetch and select the added/updated product
    } catch (err) {
      console.error("Error submitting product:", err);
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Submission Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Delete Handler ---
  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete || !productToDelete.id) return;
    const idToDelete = productToDelete.id;
    setIsDeleting(true);
    try {
      const success = await deleteProduct(idToDelete);
      if (!success) throw new Error("Delete failed in service");

      toast({ title: "Success", description: "Product deleted." });
      setProducts((prev) => prev.filter((p) => p.id !== idToDelete));
      if (selectedProduct?.id === idToDelete) {
        setSelectedProduct(null); // Close details if deleted
      }
      setProductToDelete(null); // Close dialog state
    } catch (err) {
      console.error("Error deleting product:", err);
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Deletion Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // --- Render Logic ---
  const renderLoadingSkeletons = (count = 6) =>
    Array.from({ length: count }).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell>
          <Skeleton className="h-10 w-10 rounded-md" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-3/4" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-6 w-20 rounded-md" />
        </TableCell>
        <TableCell className="text-right">
          <Skeleton className="h-8 w-20 rounded-md" />
        </TableCell>
      </TableRow>
    ));

  return (
    <>
      <div className="flex h-[calc(100vh-var(--header-height,60px))]">
        {/* Product List (Left Side) */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            selectedProduct ? "w-1/2 lg:w-2/3" : "w-full"
          } border-r border-border overflow-hidden flex flex-col`}
        >
          <div className="flex justify-between items-center p-4 border-b border-border flex-shrink-0">
            <h2 className="text-2xl font-bold">Products</h2>
            <Button onClick={handleOpenAddModal}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </div>

          {error && <p className="text-destructive p-4">{error}</p>}

          <ScrollArea className="flex-grow">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  renderLoadingSkeletons()
                ) : !error && products.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-10"
                    >
                      No products found.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      className={`cursor-pointer hover:bg-muted/50 ${
                        selectedProduct?.id === product.id ? "bg-muted" : ""
                      }`}
                    >
                      <TableCell>
                        <img
                          src={
                            product.image ||
                            "https://placehold.co/40x40/eee/ccc?text=?"
                          } // Placeholder
                          alt={product.name}
                          className="h-10 w-10 object-cover rounded-md"
                          onError={(e) =>
                            (e.currentTarget.src =
                              "https://placehold.co/40x40/eee/ccc?text=?")
                          } // Fallback
                        />
                      </TableCell>
                      <TableCell className="font-medium truncate max-w-[250px]">
                        {product.name}
                      </TableCell>
                      <TableCell>{product.price}</TableCell>
                      <TableCell>
                        {product.onSale && (
                          <Badge variant="secondary" className="mr-1">
                            Sale
                          </Badge>
                        )}
                        {product.featured && (
                          <Badge variant="outline">Featured</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="View Details"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProduct(product);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Edit Product"
                          className="ml-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(product);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {/* Delete Trigger */}
                        <AlertDialog
                          onOpenChange={(open) =>
                            !open && setProductToDelete(null)
                          }
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Delete Product"
                              className="text-destructive hover:text-destructive ml-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDeleteDialog(product);
                              }}
                              disabled={
                                isDeleting && productToDelete?.id === product.id
                              }
                            >
                              {isDeleting &&
                              productToDelete?.id === product.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          {/* Delete Content (conditional rendering might be needed if complex) */}
                          {productToDelete?.id === product.id && (
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will
                                  permanently delete the product "
                                  {productToDelete.name}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel disabled={isDeleting}>
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleConfirmDeleteProduct}
                                  disabled={isDeleting}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {isDeleting ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                                      Deleting...
                                    </>
                                  ) : (
                                    "Yes, delete"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          )}
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        {/* Product Details (Right Side) */}
        {selectedProduct && (
          <div className="w-1/2 lg:w-1/3 flex flex-col transition-all duration-300 ease-in-out animate-slide-in-right border-l border-border">
            <ScrollArea className="flex-grow">
              <Card className="m-4 shadow-md rounded-lg">
                <CardHeader className="pb-4 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-bold">
                        {selectedProduct.name}
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground pt-1">
                        ID: {selectedProduct.id}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedProduct(null)}
                      title="Close Details"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedProduct.onSale && (
                      <Badge variant="secondary">On Sale</Badge>
                    )}
                    {selectedProduct.featured && (
                      <Badge variant="outline">Featured</Badge>
                    )}
                    {selectedProduct.FreeDelivery && (
                      <Badge variant="default">Free Delivery</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <img
                    src={
                      selectedProduct.image ||
                      "https://placehold.co/600x400/eee/ccc?text=No+Image"
                    }
                    alt={selectedProduct.name}
                    className="w-full h-auto aspect-[3/2] object-cover rounded-md mb-4 bg-muted"
                    onError={(e) =>
                      (e.currentTarget.src =
                        "https://placehold.co/600x400/eee/ccc?text=No+Image")
                    }
                  />
                  <div className="text-sm space-y-1">
                    <p>
                      <strong>Price:</strong> {selectedProduct.price}{" "}
                      {selectedProduct.onSale && selectedProduct.salePrice ? (
                        <span className="text-destructive line-through ml-2">
                          {selectedProduct.price}
                        </span>
                      ) : (
                        ""
                      )}
                    </p>
                    {selectedProduct.onSale && selectedProduct.salePrice && (
                      <p>
                        <strong>Sale Price:</strong>{" "}
                        <span className="font-semibold text-primary">
                          {selectedProduct.salePrice}
                        </span>
                      </p>
                    )}
                    <p>
                      <strong>Description:</strong>{" "}
                      {selectedProduct.shortDescription}
                    </p>
                  </div>

                  {/* Details Section */}
                  {selectedProduct.details && (
                    <div className="space-y-3 pt-3 border-t">
                      {selectedProduct.details.longDescription && (
                        <div>
                          <h4 className="font-semibold text-md mb-1">
                            Details
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {selectedProduct.details.longDescription}
                          </p>
                        </div>
                      )}
                      {selectedProduct.details.features &&
                        selectedProduct.details.features.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-md mb-1">
                              Features
                            </h4>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                              {selectedProduct.details.features.map(
                                (feature, index) => (
                                  <li key={index}>{feature}</li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                      {selectedProduct.details.instructions &&
                        selectedProduct.details.instructions.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-md mb-1">
                              Instructions
                            </h4>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                              {selectedProduct.details.instructions.map(
                                (instruction, index) => (
                                  <li key={index}>{instruction}</li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button
                    size="sm"
                    onClick={() => handleOpenEditModal(selectedProduct)}
                  >
                    <Edit className="mr-2 h-4 w-4" /> Edit Product
                  </Button>
                  {/* Delete Trigger inside Footer */}
                  <AlertDialog
                    onOpenChange={(open) => !open && setProductToDelete(null)}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="ml-auto"
                        onClick={() => handleOpenDeleteDialog(selectedProduct)}
                        disabled={
                          isDeleting &&
                          productToDelete?.id === selectedProduct.id
                        }
                      >
                        {isDeleting &&
                        productToDelete?.id === selectedProduct.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    {/* Delete Content */}
                    {productToDelete?.id === selectedProduct.id && (
                      <AlertDialogContent>
                        {/* ... (Header, Description, Footer as above) ... */}
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete the product "{productToDelete.name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isDeleting}>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleConfirmDeleteProduct}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isDeleting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                                Deleting...
                              </>
                            ) : (
                              "Yes, delete"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    )}
                  </AlertDialog>
                </CardFooter>
              </Card>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* --- Add/Edit Product Dialog --- */}
      <Dialog
        open={isAddModalOpen || isEditModalOpen}
        onOpenChange={handleCloseProductModal}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {productToEditId ? "Edit Product" : "Add New Product"}
            </DialogTitle>
            <DialogDescription>
              {productToEditId
                ? "Update the details for this product."
                : "Fill in the details for the new product."}
            </DialogDescription>
          </DialogHeader>
          {/* Scrollable Form Area */}
          <ScrollArea className="flex-grow pr-6 -mr-6">
            {" "}
            {/* Negative margin trick for scrollbar */}
            <div className="grid gap-4 py-4 ">
              {/* Basic Info */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name*
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={productFormData.name}
                  onChange={handleFormChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="image" className="text-right">
                  Image URL*
                </Label>
                <Input
                  id="image"
                  name="image"
                  value={productFormData.image}
                  onChange={handleFormChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">
                  Price*
                </Label>
                <Input
                  id="price"
                  name="price"
                  value={productFormData.price}
                  onChange={handleFormChange}
                  className="col-span-3"
                  required
                  placeholder="e.g., 250 ج.م"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="shortDescription" className="text-right pt-2">
                  Short Desc.
                </Label>
                <Textarea
                  id="shortDescription"
                  name="shortDescription"
                  value={productFormData.shortDescription}
                  onChange={handleFormChange}
                  className="col-span-3"
                  rows={2}
                />
              </div>

              {/* Details Section */}
              <div className="grid grid-cols-4 items-start gap-4">
                <Label
                  htmlFor="details.longDescription"
                  className="text-right pt-2"
                >
                  Long Desc.
                </Label>
                <Textarea
                  id="details.longDescription"
                  name="details.longDescription"
                  value={productFormData.details.longDescription}
                  onChange={handleFormChange}
                  className="col-span-3"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="details.features" className="text-right pt-2">
                  Features
                </Label>
                <Textarea
                  id="details.features"
                  name="details.features"
                  value={productFormData.details.features.join(", ")}
                  onChange={handleFormChange}
                  className="col-span-3"
                  rows={3}
                  placeholder="Comma-separated list"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label
                  htmlFor="details.instructions"
                  className="text-right pt-2"
                >
                  Instructions
                </Label>
                <Textarea
                  id="details.instructions"
                  name="details.instructions"
                  value={productFormData.details.instructions.join(", ")}
                  onChange={handleFormChange}
                  className="col-span-3"
                  rows={3}
                  placeholder="Comma-separated list"
                />
              </div>

              {/* Flags and Sale Price */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="featured"
                    checked={productFormData.featured}
                    onCheckedChange={(checked) =>
                      handleBooleanChange("featured", checked)
                    }
                  />
                  <Label htmlFor="featured">Featured Product</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="FreeDelivery"
                    checked={productFormData.FreeDelivery}
                    onCheckedChange={(checked) =>
                      handleBooleanChange("FreeDelivery", checked)
                    }
                  />
                  <Label htmlFor="FreeDelivery">Free Delivery</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="onSale"
                    checked={productFormData.onSale}
                    onCheckedChange={(checked) =>
                      handleBooleanChange("onSale", checked)
                    }
                  />
                  <Label htmlFor="onSale">On Sale</Label>
                </div>
                {/* Sale Price (conditionally shown) */}
                {productFormData.onSale && (
                  <div className="col-span-2 grid grid-cols-4 items-center gap-4 -mt-2">
                    {" "}
                    {/* Span full width */}
                    <Label htmlFor="salePrice" className="text-right">
                      Sale Price
                    </Label>
                    <Input
                      id="salePrice"
                      name="salePrice"
                      value={productFormData.salePrice || ""}
                      onChange={handleFormChange}
                      className="col-span-3"
                      placeholder="e.g., 200 ج.م"
                    />
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="mt-auto pt-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              onClick={handleSubmitProduct}
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSubmitting
                ? "Saving..."
                : productToEditId
                ? "Save Changes"
                : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductPage;
