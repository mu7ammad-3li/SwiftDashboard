// src/pages/OrderDetailsPage.tsx
import React, {
  useState,
  useEffect,
  useCallback,
  ChangeEvent,
  FormEvent,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Assuming path is correct
import {
  getOrderById,
  updateOrder,
  deleteOrder,
  addInternalNoteToOrder,
} from "../services/orderService"; // Assuming path is correct
import { getCustomerById } from "../services/customerService"; // Assuming path is correct
import { getProducts } from "../services/productService"; // Assuming path and Product export are correct
import { Order, OrderItem, InternalNote } from "../data/order"; // Assuming path is correct
import { Customer } from "../data/customer"; // Assuming path is correct
import governoratesData from "../data/governorates"; // Assuming path is correct
import { Product } from "../data/products"; // Adjust path if needed

// UI Components
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton"; // For main page loading
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
import { useToast } from "@/components/ui/use-toast";

// Icons
import { ArrowLeft, Loader2, Edit, Save, XCircle, Trash2 } from "lucide-react";

// Refactored View Components
import OrderSummaryView from "@/components/orders/OrderSummaryView";
import OrderItemsView from "@/components/orders/OrderItemsView";
import CustomerInfoView from "@/components/orders/CustomerInfoView";
import ShippingAddressView from "@/components/orders/ShippingAddressView";
import OrderLogs from "@/components/orders/OrderLogs";

// Refactored Edit Form Component
import OrderEditForm, {
  EditableOrderStateForm,
  EditableOrderItemForm,
} from "@/components/orders/OrderEditForm"; // Ensure correct path

// Centralized Utilities
import { formatCurrency } from "@/lib/utils"; // Only formatCurrency might be needed directly here now

// Define structure for editable order state (consistent with OrderEditForm)
// This is used internally by OrderDetailsPage to manage the state passed to OrderEditForm
type EditableOrderStateInternal = EditableOrderStateForm;
type EditableOrderItemInternal = EditableOrderItemForm;

const OrderDetailsPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser, loading: authLoading } = useAuth();

  // --- State Variables ---
  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  // This state will hold the data for the OrderEditForm
  const [editableOrderFormData, setEditableOrderFormData] =
    useState<EditableOrderStateInternal | null>(null);

  // Loading states
  const [loadingOrder, setLoadingOrder] = useState<boolean>(true);
  const [loadingCustomer, setLoadingCustomer] = useState<boolean>(false);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // UI mode states
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false); // For view mode status updates

  // --- Helper: Initialize Editable State ---
  const initializeEditableFormState = useCallback(
    (
      currentOrder: Order | null,
      productsList: Product[]
    ): EditableOrderStateInternal | null => {
      if (!currentOrder) return null;
      const editableItems: EditableOrderItemInternal[] = currentOrder.items.map(
        (item) => {
          const productInfo = productsList.find(
            (p) => p.id === item.product.id
          );
          return {
            productId: item.product.id,
            productName:
              productInfo?.name || item.product.name || "Unknown Product",
            quantity: item.quantity,
            originalPrice: item.originalPrice,
            priceAtPurchase: item.priceAtPurchase,
            wasOnSale: item.wasOnSale,
          };
        }
      );
      return {
        customerId: currentOrder.customerId,
        items: editableItems,
        status: currentOrder.status,
        shippingAddress: {
          ...(currentOrder.shippingAddress || {
            governorate: "",
            city: "",
            landMark: "",
            fullAdress: "",
          }),
        },
        notes: currentOrder.notes || "",
        totalAmount: currentOrder.totalAmount,
        shippingFees: currentOrder.shippingFees || 0,
      };
    },
    []
  );

  // --- Data Fetching Callbacks ---
  const fetchOrderAndRelatedData = useCallback(async () => {
    if (!orderId) {
      setError("Order ID is missing in the URL.");
      setLoadingOrder(false);
      setLoadingProducts(false);
      return;
    }
    setLoadingOrder(true);
    setLoadingProducts(true);
    setError(null);
    try {
      const [fetchedOrder, fetchedProducts] = await Promise.all([
        getOrderById(orderId),
        getProducts(),
      ]);

      setAllProducts(fetchedProducts || []);
      setLoadingProducts(false);

      if (fetchedOrder) {
        setOrder(fetchedOrder);
        // Initialize the form data when order data is fetched
        setEditableOrderFormData(
          initializeEditableFormState(fetchedOrder, fetchedProducts || [])
        );

        if (fetchedOrder.customerId) {
          setLoadingCustomer(true);
          getCustomerById(fetchedOrder.customerId)
            .then(setCustomer)
            .catch((err) => {
              console.error(
                `Error fetching customer ${fetchedOrder.customerId}:`,
                err
              );
              setCustomer(null);
            })
            .finally(() => setLoadingCustomer(false));
        } else {
          setCustomer(null);
          setLoadingCustomer(false);
        }
      } else {
        setError("Order not found.");
        toast({
          title: "Error",
          description: "Order not found.",
          variant: "destructive",
        });
        setCustomer(null);
        setLoadingCustomer(false);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to load order details or products: ${msg}`);
      toast({
        title: "Error Loading Data",
        description: msg,
        variant: "destructive",
      });
      setCustomer(null);
      setLoadingCustomer(false);
      setLoadingProducts(false);
    } finally {
      setLoadingOrder(false);
    }
  }, [orderId, toast, initializeEditableFormState]);

  useEffect(() => {
    if (!authLoading && orderId) {
      fetchOrderAndRelatedData();
    } else if (!orderId) {
      setError("Order ID is missing.");
      setLoadingOrder(false);
      setLoadingProducts(false);
    }
  }, [fetchOrderAndRelatedData, orderId, authLoading]);

  // --- Edit Mode Toggle ---
  const handleEditToggle = () => {
    if (!isEditing && order && allProducts.length > 0) {
      // Entering edit mode, ensure editableOrderFormData is up-to-date
      setEditableOrderFormData(initializeEditableFormState(order, allProducts));
    } else if (!isEditing && (!order || allProducts.length === 0)) {
      toast({
        title: "Please wait",
        description: "Order or product data is still loading.",
        variant: "default",
      });
      return;
    }
    setIsEditing(!isEditing);
    setError(null); // Clear previous save errors
  };

  // --- Form Data Update Handlers (to be passed to OrderEditForm) ---
  const calculateEditableTotal = useCallback(
    (items: EditableOrderItemInternal[], shippingFees: number): number => {
      const itemsTotal = items.reduce(
        (sum, item) => sum + item.priceAtPurchase * item.quantity,
        0
      );
      return itemsTotal + shippingFees;
    },
    []
  );

  const handleFormFieldChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditableOrderFormData((prev) => {
      if (!prev) return null;
      if (name === "shippingFees") {
        const newShippingFees = parseFloat(value) || 0;
        return {
          ...prev,
          shippingFees: newShippingFees,
          totalAmount: calculateEditableTotal(prev.items, newShippingFees),
        };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleFormAddressChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditableOrderFormData((prev) =>
      prev
        ? {
            ...prev,
            shippingAddress: { ...prev.shippingAddress, [name]: value },
          }
        : null
    );
  };

  const handleFormSelectChange = (fieldName: string, value: string) => {
    setEditableOrderFormData((prev) => {
      if (!prev) return null;
      if (fieldName === "governorate") {
        return {
          ...prev,
          shippingAddress: {
            ...prev.shippingAddress,
            governorate: value,
            city: "",
          },
        };
      } else if (fieldName === "city") {
        return {
          ...prev,
          shippingAddress: { ...prev.shippingAddress, city: value },
        };
      } else if (fieldName === "status") {
        return { ...prev, status: value as Order["status"] };
      }
      return prev;
    });
  };

  const handleFormItemChange = (
    index: number,
    field: keyof EditableOrderItemInternal | "priceAtPurchase",
    value: string | number
  ) => {
    setEditableOrderFormData((prev) => {
      if (!prev) return null;
      const updatedItems = [...prev.items];
      const currentItem = updatedItems[index];

      if (field === "productId") {
        const selectedProduct = allProducts.find((p) => p.id === value);
        if (selectedProduct) {
          const salePriceNum = parseFloat(
            selectedProduct.salePrice?.replace(/[^0-9.]/g, "") || "0"
          );
          const originalPriceNum = parseFloat(
            selectedProduct.price.replace(/[^0-9.]/g, "") || "0"
          );
          const priceToUse =
            selectedProduct.onSale && salePriceNum > 0
              ? salePriceNum
              : originalPriceNum;
          updatedItems[index] = {
            ...currentItem,
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            priceAtPurchase: priceToUse,
            originalPrice: originalPriceNum,
            wasOnSale: selectedProduct.onSale && salePriceNum > 0,
          };
        }
      } else if (field === "quantity") {
        updatedItems[index] = {
          ...currentItem,
          quantity: Math.max(1, Number(value) || 1),
        };
      } else if (field === "priceAtPurchase") {
        updatedItems[index] = {
          ...currentItem,
          priceAtPurchase: Math.max(0, Number(value) || 0),
        };
      }
      return {
        ...prev,
        items: updatedItems,
        totalAmount: calculateEditableTotal(updatedItems, prev.shippingFees),
      };
    });
  };

  const handleFormAddItem = () => {
    setEditableOrderFormData((prev) => {
      if (!prev || allProducts.length === 0) return prev;
      const firstProduct = allProducts[0];
      const salePriceNum = parseFloat(
        firstProduct.salePrice?.replace(/[^0-9.]/g, "") || "0"
      );
      const originalPriceNum = parseFloat(
        firstProduct.price.replace(/[^0-9.]/g, "") || "0"
      );
      const priceToUse =
        firstProduct.onSale && salePriceNum > 0
          ? salePriceNum
          : originalPriceNum;
      const newItem: EditableOrderItemInternal = {
        productId: firstProduct.id,
        productName: firstProduct.name,
        quantity: 1,
        originalPrice: originalPriceNum,
        priceAtPurchase: priceToUse,
        wasOnSale: firstProduct.onSale && salePriceNum > 0,
      };
      const updatedItems = [...prev.items, newItem];
      return {
        ...prev,
        items: updatedItems,
        totalAmount: calculateEditableTotal(updatedItems, prev.shippingFees),
      };
    });
  };

  const handleFormRemoveItem = (index: number) => {
    setEditableOrderFormData((prev) => {
      if (!prev || prev.items.length <= 1) {
        toast({
          title: "Cannot remove last item",
          description: "An order must have at least one item.",
          variant: "destructive",
        });
        return prev;
      }
      const updatedItems = prev.items.filter((_, i) => i !== index);
      return {
        ...prev,
        items: updatedItems,
        totalAmount: calculateEditableTotal(updatedItems, prev.shippingFees),
      };
    });
  };

  // --- Save Changes ---
  const handleSaveChanges = async (e?: FormEvent) => {
    // Make e optional
    if (e) e.preventDefault(); // Prevent default if called from form submit
    if (!orderId || !editableOrderFormData || !currentUser) {
      toast({
        title: "Error",
        description: "Missing data or user not authenticated.",
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    setError(null);

    const itemsToSave: OrderItem[] = editableOrderFormData.items.map(
      (item) => ({
        product: { id: item.productId, name: item.productName },
        quantity: item.quantity,
        originalPrice: item.originalPrice,
        priceAtPurchase: item.priceAtPurchase,
        wasOnSale: item.wasOnSale,
      })
    );

    const updates: Partial<
      Omit<Order, "id" | "internalNotes" | "orderDate" | "customerId">
    > = {
      status: editableOrderFormData.status,
      shippingAddress: editableOrderFormData.shippingAddress,
      notes: editableOrderFormData.notes,
      items: itemsToSave,
      totalAmount: editableOrderFormData.totalAmount,
      shippingFees: editableOrderFormData.shippingFees,
    };

    let changesSummary = "Order details updated. ";
    if (order) {
      if (order.status !== updates.status)
        changesSummary += `Status: ${order.status} -> ${updates.status}. `;
      if (
        JSON.stringify(order.shippingAddress) !==
        JSON.stringify(updates.shippingAddress)
      )
        changesSummary += `Address updated. `;
      if (order.notes !== updates.notes) changesSummary += `Notes updated. `;
      if (JSON.stringify(order.items) !== JSON.stringify(updates.items))
        changesSummary += `Items updated. `;
      if (order.totalAmount !== updates.totalAmount)
        changesSummary += `Total: ${formatCurrency(
          order.totalAmount
        )} -> ${formatCurrency(updates.totalAmount)}. `;
      if (order.shippingFees !== updates.shippingFees)
        changesSummary += `Shipping: ${formatCurrency(
          order.shippingFees
        )} -> ${formatCurrency(updates.shippingFees)}. `;
    }
    const userId =
      currentUser.email || `UID: ${currentUser.uid}` || "Unknown User";

    try {
      const success = await updateOrder(orderId, updates);
      if (success) {
        await addInternalNoteToOrder(
          orderId,
          "Order Updated",
          changesSummary,
          userId
        );
        await fetchOrderAndRelatedData(); // Refresh all data
        toast({ title: "Success", description: "Order updated successfully." });
        setIsEditing(false);
      } else {
        throw new Error("Update operation returned false.");
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not save changes.";
      setError(`Failed to save changes: ${msg}`);
      toast({
        title: "Error",
        description: `Failed to save changes: ${msg}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // --- Delete Order ---
  const handleDeleteOrder = async () => {
    if (!orderId || !currentUser) {
      toast({
        title: "Error",
        description: "Missing order ID or user not authenticated.",
        variant: "destructive",
      });
      return;
    }
    setIsDeleting(true);
    setError(null);
    try {
      const success = await deleteOrder(orderId);
      if (success) {
        toast({ title: "Success", description: "Order deleted successfully." });
        navigate(-1);
      } else {
        throw new Error("Delete operation returned false.");
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not delete order.";
      setError(`Failed to delete order: ${msg}`);
      toast({
        title: "Error",
        description: `Failed to delete order: ${msg}`,
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

  // --- Note Added Callback ---
  const handleNoteAdded = useCallback(() => {
    fetchOrderAndRelatedData();
  }, [fetchOrderAndRelatedData]);

  // --- Navigation Handlers ---
  const handleBackClick = () => navigate(-1);
  const handleCustomerClick = (customerIdToNav: string) => {
    if (customerIdToNav) navigate(`/customers/${customerIdToNav}`);
    else
      toast({
        title: "Navigation Error",
        description: "Customer ID is missing.",
        variant: "destructive",
      });
  };

  // --- Status Update Handler (for View Mode) ---
  const handleUpdateStatus = async (newStatus: Order["status"]) => {
    if (!order || !order.id || !currentUser) {
      toast({
        title: "Error",
        description: "Missing data or user not authenticated.",
        variant: "destructive",
      });
      return;
    }
    if (authLoading) {
      toast({ title: "Please wait", description: "Authentication loading." });
      return;
    }
    const userId =
      currentUser.email || `UID: ${currentUser.uid}` || "Unknown User";
    const oldStatus = order.status;
    if (oldStatus === newStatus) return;

    setIsUpdatingStatus(true);
    try {
      const success = await updateOrder(order.id, { status: newStatus });
      if (success) {
        await addInternalNoteToOrder(
          order.id,
          `Status Changed: ${oldStatus} -> ${newStatus}`,
          `Order status updated by ${userId}.`,
          userId
        );
        await fetchOrderAndRelatedData();
        toast({
          title: "Success",
          description: `Order status updated to ${newStatus}.`,
        });
      } else {
        throw new Error("Order status update failed in service.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Update Failed",
        description: `Could not update status: ${msg}`,
        variant: "destructive",
      });
      fetchOrderAndRelatedData(); // Re-fetch to ensure UI consistency
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // --- Upselling Logic (remains in parent, passed to form) ---
  const getUpsellSuggestion = (): string | null => {
    if (!editableOrderFormData) return null; // Use form data for suggestion
    const hasNonConcentrated = editableOrderFormData.items.some(
      (item) => item.productId === "spray" || item.productId === "ant-killer"
    );
    if (hasNonConcentrated) {
      const hasBedGuard = editableOrderFormData.items.some(
        (item) => item.productId === "BedGuard20"
      );
      const hasMultiGuard = editableOrderFormData.items.some(
        (item) => item.productId === "multiguard20"
      );
      if (!hasBedGuard && !hasMultiGuard)
        return "عرض خاص: استبدل البخاخات المخففة بالعبوات المركزة (بيد جارد + مالتي جارد) بـ 500 جنيه فقط بدلاً من 600، مع شحن مجاني! كل عبوة مركزة (250 جنيه) تكفي لـ 5 لتر وتأتي مع زجاجة خلط، سرنجة، وبخاخ.";
      if (!hasBedGuard)
        return "أضف عبوة بيد جارد المركزة (250 جنيه) واحصل على شحن مجاني للطلب كله!";
      if (!hasMultiGuard)
        return "أضف عبوة مالتي جارد المركزة (250 جنيه) واحصل على شحن مجاني للطلب كله!";
    }
    return null;
  };

  // --- Loading and Error States ---
  if (authLoading || (loadingOrder && !order && !error)) {
    // Show loader if auth is loading OR initial order load is happening without an error yet
    return (
      <div className="flex justify-center items-center h-[calc(100vh-var(--header-height,60px))]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (error && !isEditing && !order) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-[calc(100vh-var(--header-height,60px))]">
        <p className="text-destructive text-center mb-4">{error}</p>
        <Button onClick={handleBackClick} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }
  if (!order && !loadingOrder && !error) {
    // If loading is finished, no error, and order is still null
    return (
      <div className="p-6 flex flex-col items-center justify-center h-[calc(100vh-var(--header-height,60px))]">
        <p className="text-muted-foreground text-center mb-4">
          Order data could not be loaded or does not exist.
        </p>
        <Button onClick={handleBackClick} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  // Prepare data for Edit Form Dropdowns
  const governorateNames = Object.keys(governoratesData);
  const cities = editableOrderFormData?.shippingAddress.governorate
    ? Object.values(
        governoratesData[
          editableOrderFormData.shippingAddress
            .governorate as keyof typeof governoratesData
        ]?.Cities || {}
      ).map((c) => c.CityName)
    : [];
  const upsellMessage = isEditing ? getUpsellSuggestion() : null;
  const currentUserIdString =
    currentUser?.email || `UID: ${currentUser?.uid}` || "Unknown User";

  return (
    <>
      <ScrollArea className="h-[calc(100vh-var(--header-height,60px))] bg-muted/30">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Button
                variant="outline"
                size="icon"
                className="mr-4 rounded-full"
                onClick={handleBackClick}
                title="Go Back"
                disabled={isSaving || isDeleting}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold tracking-tight">
                {isEditing ? "Edit Order" : "Order Details"}
              </h1>
              {(loadingOrder || isSaving || isDeleting) && (
                <Loader2 className="ml-3 h-5 w-5 animate-spin text-muted-foreground" />
              )}
            </div>
            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditToggle}
                    disabled={
                      isSaving ||
                      isDeleting ||
                      loadingProducts ||
                      allProducts.length === 0 ||
                      !order
                    }
                  >
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isSaving || isDeleting || !order}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete the order.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteOrder}
                          disabled={isDeleting}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          {isDeleting && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}{" "}
                          {isDeleting ? "Deleting..." : "Delete Order"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditToggle}
                    disabled={isSaving}
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                  {/* The form now has its own implicit submission, but we can keep this button to trigger it */}
                  <Button
                    form="order-edit-form"
                    type="submit"
                    size="sm"
                    disabled={isSaving || !editableOrderFormData}
                  >
                    <Save className="mr-2 h-4 w-4" />{" "}
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Global Error Display (e.g., for save errors when in edit mode) */}
          {error && isEditing && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-md text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* --- VIEW MODE --- */}
          {!isEditing && order && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <OrderSummaryView
                  order={order}
                  onUpdateStatus={handleUpdateStatus}
                  isUpdatingStatus={isUpdatingStatus}
                />
                <OrderItemsView items={order.items} />
                <OrderLogs
                  orderId={order.id}
                  notes={order.internalNotes}
                  onNoteAdded={handleNoteAdded}
                  currentUserId={currentUserIdString}
                />
              </div>
              <div className="lg:col-span-1 space-y-6">
                <CustomerInfoView
                  customer={customer}
                  orderCustomerId={order.customerId}
                  isLoading={loadingCustomer}
                  onCustomerClick={handleCustomerClick}
                />
                <ShippingAddressView shippingAddress={order.shippingAddress} />
              </div>
            </div>
          )}

          {/* --- EDIT FORM --- */}
          {isEditing && editableOrderFormData && (
            <OrderEditForm
              editableOrderData={editableOrderFormData}
              allProducts={allProducts}
              customerName={customer?.fullName}
              onFieldChange={handleFormFieldChange}
              onAddressChange={handleFormAddressChange}
              onSelectChange={handleFormSelectChange}
              onItemChange={handleFormItemChange}
              onAddItem={handleFormAddItem}
              onRemoveItem={handleFormRemoveItem}
              onSubmit={handleSaveChanges} // Pass the save handler
              isSaving={isSaving}
              governorateNames={governorateNames}
              cities={cities}
              upsellMessage={upsellMessage}
            />
          )}
        </div>
      </ScrollArea>
    </>
  );
};

export default OrderDetailsPage;
