// src/pages/CustomerDetailsPage.tsx
import React, { useState, useEffect, useCallback, ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";

// --- Service Imports ---
import {
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "../services/customerService"; // Adjust path if needed
import { getOrdersByCustomerId } from "../services/orderService"; // Adjust path if needed

// --- Data Type Imports ---
import { Customer } from "../data/customer"; // Adjust path if needed
import { Order } from "../data/order"; // Adjust path if needed
import governoratesData from "../data/governorates"; // Adjust path if needed

// --- UI Component Imports ---
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogDescription,
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
  // AlertDialogTrigger is now part of CustomerProfileCard, but AlertDialog root is here
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import AddOrderDialog from "@/components/AddOrderDialog"; // For adding new orders

// --- Refactored View Components ---
import CustomerProfileCard from "@/components/customers/CustomerProfileCard";
import CustomerContactInfoView from "@/components/customers/CustomerContactInfoView";
import CustomerAddressInfoView from "@/components/customers/CustomerAddressInfoView";
import CustomerOrdersListView from "@/components/customers/CustomerOrdersListView";

// --- Refactored Edit Form Component ---
import CustomerEditForm, {
  CustomerEditFormData,
} from "@/components/customers/CustomerEditForm"; // Ensure correct path

// --- Utility Imports ---
import { formatPhoneNumber } from "../lib/utils"; // Assuming path is correct

// --- Icon Imports ---
import { ArrowLeft, Loader2, Save, XCircle } from "lucide-react";

// --- Constants and Defaults ---
const defaultAddress = {
  governorate: "",
  city: "",
  landMark: "",
  fullAdress: "",
};

const CustomerDetailsPage: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // --- State Variables ---
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [relatedOrders, setRelatedOrders] = useState<Order[]>([]);
  const [loadingCustomer, setLoadingCustomer] = useState<boolean>(true);
  const [loadingRelatedOrders, setLoadingRelatedOrders] =
    useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Modal/Dialog Visibility
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false); // For archive confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); // For delete confirmation
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);

  // Form Data for Edit Modal
  const [editFormData, setEditFormData] = useState<CustomerEditFormData>({
    address: { ...defaultAddress },
  });
  const [citiesForEditForm, setCitiesForEditForm] = useState<string[]>([]);

  // Action Loading Indicators
  const [isUpdating, setIsUpdating] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- Data Fetching Callbacks ---
  const fetchCustomerDetails = useCallback(async () => {
    if (!customerId) {
      setError("Customer ID is missing.");
      setLoadingCustomer(false);
      return;
    }
    setLoadingCustomer(true);
    setError(null);
    try {
      const fetchedCustomer = await getCustomerById(customerId);
      if (fetchedCustomer) {
        const currentCustomer = {
          ...fetchedCustomer,
          status: fetchedCustomer.status || "active",
          address: fetchedCustomer.address || { ...defaultAddress },
        };
        setCustomer(currentCustomer);
        // Pre-fill edit form data when customer is fetched
        setEditFormData({
          fullName: currentCustomer.fullName || "",
          email: currentCustomer.email || "",
          phone: currentCustomer.phone || "", // Usually non-editable ID
          secondPhone: currentCustomer.secondPhone || "",
          address: { ...defaultAddress, ...(currentCustomer.address || {}) },
          status: currentCustomer.status || "active",
        });
        if (currentCustomer.address?.governorate) {
          const govData =
            governoratesData[
              currentCustomer.address
                .governorate as keyof typeof governoratesData
            ];
          setCitiesForEditForm(
            govData
              ? Object.values(govData.Cities || {}).map((c) => c.CityName)
              : []
          );
        }
      } else {
        setError(`Customer with ID ${customerId} not found.`);
        toast({
          title: "Error",
          description: "Customer not found.",
          variant: "destructive",
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to load customer details: ${msg}`);
      toast({
        title: "Error Loading Customer",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoadingCustomer(false);
    }
  }, [customerId, toast]);

  const fetchCustomerOrders = useCallback(async () => {
    if (!customerId) return;
    setLoadingRelatedOrders(true);
    setOrdersError(null);
    try {
      const orders = await getOrdersByCustomerId(customerId);
      setRelatedOrders(orders);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Unknown error fetching orders.";
      setOrdersError(errorMsg);
    } finally {
      setLoadingRelatedOrders(false);
    }
  }, [customerId]);

  // --- Effects ---
  useEffect(() => {
    fetchCustomerDetails();
    fetchCustomerOrders();
  }, [fetchCustomerDetails, fetchCustomerOrders]);

  // --- Modal & Dialog Handlers ---
  const handleOpenEditModal = () => {
    if (!customer) return;
    // Ensure editFormData is fresh based on the current customer state when opening modal
    setEditFormData({
      fullName: customer.fullName || "",
      email: customer.email || "",
      phone: customer.phone || "",
      secondPhone: customer.secondPhone || "",
      address: { ...defaultAddress, ...(customer.address || {}) },
      status: customer.status || "active",
    });
    if (customer.address?.governorate) {
      const govData =
        governoratesData[
          customer.address.governorate as keyof typeof governoratesData
        ];
      setCitiesForEditForm(
        govData
          ? Object.values(govData.Cities || {}).map((c) => c.CityName)
          : []
      );
    } else {
      setCitiesForEditForm([]);
    }
    setIsEditModalOpen(true);
  };
  const handleCloseEditModal = () => setIsEditModalOpen(false);

  const handleOpenArchiveDialog = () => {
    if (!customer) return; // Ensure customer data is available
    setIsArchiveDialogOpen(true);
  };
  const handleCloseArchiveDialog = () => setIsArchiveDialogOpen(false);

  const handleOpenDeleteDialog = () => {
    if (!customer) return; // Ensure customer data is available
    setIsDeleteDialogOpen(true);
  };
  // No explicit handleCloseDeleteDialog, onOpenChange of AlertDialog will handle it.

  const handleOpenAddOrderModal = () => setIsAddOrderOpen(true);

  // --- Edit Form Change Handlers ---
  const handleEditFormDirectChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "phone") {
      toast({
        title: "Info",
        description: "Primary phone (ID) cannot be changed.",
        variant: "default",
      });
      return;
    }
    if (name.startsWith("address.")) {
      const field = name.split(".")[1];
      setEditFormData((prev) => ({
        ...prev,
        address: { ...(prev.address || defaultAddress), [field]: value },
      }));
    } else {
      setEditFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleEditFormSelectValueChange = (
    name: "governorate" | "city" | "status",
    value: string
  ) => {
    setEditFormData((prev) => {
      if (!prev) return { address: defaultAddress }; // Should not happen if modal is open
      if (name === "governorate") {
        const govData =
          governoratesData[value as keyof typeof governoratesData];
        setCitiesForEditForm(
          govData
            ? Object.values(govData.Cities || {}).map((c) => c.CityName)
            : []
        );
        return {
          ...prev,
          address: {
            ...(prev.address || defaultAddress),
            governorate: value,
            city: "",
          },
        };
      } else if (name === "city") {
        return {
          ...prev,
          address: { ...(prev.address || defaultAddress), city: value },
        };
      } else if (name === "status") {
        return { ...prev, status: value as Customer["status"] };
      }
      return prev;
    });
  };

  // --- Action Handlers (Update, Archive, Delete) ---
  const handleUpdateCustomer = async () => {
    if (!customer || !customer.id || !editFormData) {
      toast({
        title: "Error",
        description: "Customer data is missing for update.",
        variant: "destructive",
      });
      return;
    }
    const formattedSecondPhone = formatPhoneNumber(editFormData.secondPhone);
    if (
      editFormData.secondPhone &&
      (!formattedSecondPhone || formattedSecondPhone.length !== 11)
    ) {
      toast({
        title: "Validation Error",
        description: "Secondary phone must be 11 digits if provided.",
        variant: "destructive",
      });
      return;
    }
    if (!editFormData.fullName?.trim()) {
      toast({
        title: "Validation Error",
        description: "Full Name cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    if (!editFormData.address?.governorate?.trim()) {
      toast({
        title: "Validation Error",
        description: "Governorate cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    if (!editFormData.address?.city?.trim()) {
      toast({
        title: "Validation Error",
        description: "City cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    if (!editFormData.address?.fullAdress?.trim()) {
      toast({
        title: "Validation Error",
        description: "Full Address cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const updatePayload: Partial<Omit<Customer, "id" | "phone">> = {
        fullName: editFormData.fullName,
        email: editFormData.email || undefined,
        secondPhone: formattedSecondPhone || undefined,
        fullAdress: editFormData.address,
        status: editFormData.status as Customer["status"],
      };
      const success = await updateCustomer(customer.id, updatePayload);
      if (success) {
        await fetchCustomerDetails();
        toast({ title: "Customer updated successfully!" });
        handleCloseEditModal();
      } else {
        throw new Error("Update failed in service");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Update Failed",
        description: `Could not update customer: ${msg}`,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleArchiveCustomer = async () => {
    if (!customer || !customer.id) return;
    setIsArchiving(true);
    try {
      const success = await updateCustomer(customer.id, { status: "archived" });
      if (success) {
        setCustomer((prev) => (prev ? { ...prev, status: "archived" } : null));
        toast({ title: "Customer archived successfully!" });
        setIsArchiveDialogOpen(false); // Close dialog on success
      } else {
        throw new Error("Archive failed in service");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Archive Failed",
        description: `Could not archive customer: ${msg}`,
        variant: "destructive",
      });
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customer || !customer.id) return;
    setIsDeleting(true);
    try {
      const success = await deleteCustomer(customer.id);
      if (success) {
        toast({
          title: "Customer Deleted",
          description: `Customer "${
            customer.fullName || customer.id
          }" was permanently deleted.`,
        });
        setIsDeleteDialogOpen(false); // Close dialog on success
        navigate("/customers", { replace: true });
      } else {
        throw new Error("Deletion failed in service");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Deletion Failed",
        description: `Could not delete customer: ${msg}`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOrderCreated = (newOrderId: string) => {
    toast({
      title: "Order Created",
      description: `New order ${newOrderId} added for this customer.`,
    });
    fetchCustomerOrders();
  };

  // --- Render Logic ---
  if (loadingCustomer && !customer) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center mb-4">
          <Skeleton className="h-9 w-9 rounded-md mr-4" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-8 w-32 mt-4" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-[calc(100vh-var(--header-height,60px))]">
        <p className="text-destructive text-center mb-4">{error}</p>
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-[calc(100vh-var(--header-height,60px))]">
        <p className="text-muted-foreground text-center mb-4">
          Customer data could not be loaded or customer does not exist.
        </p>
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  const governorateNamesForEdit = Object.keys(governoratesData || {});

  return (
    <>
      <ScrollArea className="h-[calc(100vh-var(--header-height,60px))] bg-slate-50">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <div className="flex items-center mb-4">
            <Button
              variant="outline"
              size="icon"
              className="mr-4 rounded-full"
              onClick={() => navigate(-1)}
              title="Go Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Customer Details</h1>
          </div>

          {/* AlertDialog for Delete Confirmation - wraps the profile card or relevant trigger section */}
          <AlertDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            {/* The CustomerProfileCard contains the AlertDialogTrigger */}
            <CustomerProfileCard
              customer={customer}
              onEdit={handleOpenEditModal}
              onArchive={handleOpenArchiveDialog}
              onDelete={handleOpenDeleteDialog} // This sets isDeleteDialogOpen to true
              onAddNewOrder={handleOpenAddOrderModal}
              isArchiving={isArchiving}
              isDeleting={isDeleting}
            />
            {/* AlertDialogContent is rendered conditionally by `open` prop of AlertDialog */}
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will **permanently delete**
                  the customer "{customer?.fullName || customer?.id}" and all
                  associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  disabled={isDeleting}
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteCustomer}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isDeleting ? "Deleting..." : "Yes, permanently delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <CustomerContactInfoView
              customer={customer}
              isLoading={loadingCustomer}
            />
            <CustomerAddressInfoView
              address={customer.address}
              isLoading={loadingCustomer}
            />
          </div>
          <CustomerOrdersListView
            orders={relatedOrders}
            isLoading={loadingRelatedOrders}
            error={ordersError}
          />
        </div>
      </ScrollArea>

      {/* Edit Customer Dialog (Modal) */}
      <Dialog open={isEditModalOpen} onOpenChange={handleCloseEditModal}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Edit Customer: {customer.fullName}</DialogTitle>
            <DialogDescription>
              Update customer details. Primary phone (ID) cannot be changed.
              Required fields (*).
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-6 -mr-6">
            <CustomerEditForm
              formData={editFormData}
              onFormChange={handleEditFormDirectChange}
              onSelectChange={handleEditFormSelectValueChange}
              isSaving={isUpdating}
              governorateNames={governorateNamesForEdit}
              citiesForForm={citiesForEditForm}
            />
          </ScrollArea>
          <DialogFooter className="mt-auto pt-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isUpdating}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={handleUpdateCustomer}
              disabled={isUpdating}
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Dialog (separate from delete) */}
      <AlertDialog
        open={isArchiveDialogOpen}
        onOpenChange={setIsArchiveDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Customer?</AlertDialogTitle>
            <AlertDialogDescription>
              Archiving "{customer?.fullName || customer?.id}" will hide them
              from the main active list but retain their data. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isArchiving}
              onClick={handleCloseArchiveDialog}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchiveCustomer}
              disabled={isArchiving}
              className="bg-yellow-500 hover:bg-yellow-500/90 text-white"
            >
              {isArchiving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isArchiving ? "Archiving..." : "Yes, archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Order Dialog */}
      <AddOrderDialog
        isOpen={isAddOrderOpen}
        onOpenChange={setIsAddOrderOpen}
        onOrderCreated={handleOrderCreated}
        initialCustomerId={customer?.id}
      />
    </>
  );
};

export default CustomerDetailsPage;
