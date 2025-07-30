import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate

// --- Service Imports ---
import {
  getCustomers,
  findOrCreateCustomer,
} from "../services/customerService"; // Removed updateCustomer

// --- Data Type Imports ---
import { Customer } from "../data/customer";

// --- UI Component Imports ---
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
  CardDescription, // Kept for modal description
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose, // Keep for modal close
} from "@/components/ui/dialog";
// Removed AlertDialog imports as delete/archive moved to details page
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Import Select components
import { useToast } from "@/components/ui/use-toast";

// --- Utility Imports ---
import { formatPhoneNumber } from "../lib/utils";
import { cn } from "@/lib/utils"; // For conditional classes

// --- Icon Imports ---
import { UserPlus, Search, Loader2 } from "lucide-react"; // Removed Eye, Edit, Trash2, Archive

// --- Governorate Data Import ---
import governoratesData from "../data/governorates"; // Import the actual data object

// --- Constants and Defaults ---
const defaultAddress = {
  governorate: "",
  city: "",
  landMark: "",
  fullAdress: "",
};
const initialFindOrCreateData = {
  phone: "",
  fullName: "",
  email: "",
  secondPhone: "",
  address: { ...defaultAddress },
};

// --- Component ---
const CustomersPage: React.FC = () => {
  // --- State Variables ---
  // Customer Data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true); // Initial customer list loading
  const [error, setError] = useState<string | null>(null); // Customer list fetching error

  // Modal/Dialog Visibility
  const [isFindOrCreateModalOpen, setIsFindOrCreateModalOpen] = useState(false);

  // Form Data
  const [findOrCreateData, setFindOrCreateData] = useState(
    initialFindOrCreateData
  );

  // Action Loading Indicators
  const [isFindingOrCreating, setIsFindingOrCreating] = useState(false);

  // State for City dropdown in Find/Add modal
  const [citiesForFindAdd, setCitiesForFindAdd] = useState<string[]>([]);

  // --- Hooks ---
  const navigate = useNavigate(); // Initialize navigate hook
  const { toast } = useToast();

  // --- Data Fetching Callbacks ---
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const customerList = await getCustomers(); // Fetch ALL customers
      // Process list: ensure ID exists, default status locally if missing
      const customersWithDefaults: Customer[] = customerList
        .map((c) => {
          const customerId = c.id || formatPhoneNumber(c.phone);
          if (!customerId) {
            console.warn("Customer missing ID:", c);
            // Optionally filter out customers without valid IDs if needed
            // return null;
            return {
              ...c,
              id: `invalid-${Date.now()}`,
              status: c.status || "active",
            }; // Fallback ID
          }
          return { ...c, id: customerId, status: c.status || "active" };
        })
        .filter((c): c is Customer => c !== null); // Remove nulls if filtering

      // Filter out deleted customers from the main view
      const activeAndArchivedCustomers = customersWithDefaults.filter(
        (c) => c.status !== "deleted"
      );

      setCustomers(activeAndArchivedCustomers);
    } catch (err) {
      console.error("Error fetching customers:", err);
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to load customers: ${errorMsg}`);
      toast({
        title: "Error Loading Customers",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // --- Effects ---
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // --- Modal Handlers ---
  const handleOpenFindOrCreateModal = () => {
    setFindOrCreateData(initialFindOrCreateData);
    setCitiesForFindAdd([]); // Reset cities when opening
    setIsFindOrCreateModalOpen(true);
  };
  const handleCloseFindOrCreateModal = () => {
    setIsFindOrCreateModalOpen(false);
  };

  // --- Row Click Handler ---
  const handleCustomerRowClick = (customerId: string | undefined) => {
    if (customerId) {
      navigate(`/customers/${customerId}`); // Navigate to details page
    } else {
      console.error("Cannot navigate: Customer ID is undefined.");
      toast({
        title: "Navigation Error",
        description: "Invalid customer ID.",
        variant: "destructive",
      });
    }
  };

  // --- Form Change Handlers ---
  const handleFindOrCreateFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    // Handle address fields EXCEPT governorate and city (handled by handleSelectChange)
    if (
      name.startsWith("address.") &&
      name !== "address.governorate" &&
      name !== "address.city"
    ) {
      const field = name.split(".")[1];
      setFindOrCreateData((prev) => ({
        ...prev,
        address: { ...(prev.address || defaultAddress), [field]: value },
      }));
    } else if (
      !name.startsWith("address.") &&
      name !== "governorate" &&
      name !== "city"
    ) {
      // Handle top-level fields (phone, fullName, email, secondPhone)
      setFindOrCreateData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Specific handler for Select components in Find/Add modal
  const handleFindAddSelectChange = (
    name: "governorate" | "city",
    value: string
  ) => {
    setFindOrCreateData((prev) => {
      if (name === "governorate") {
        // Reset city and update city list when governorate changes
        const newCities = governoratesData[
          value as keyof typeof governoratesData
        ]
          ? Object.values(
              governoratesData[value as keyof typeof governoratesData].Cities ||
                {}
            ).map((c) => c.CityName)
          : [];
        setCitiesForFindAdd(newCities);
        return {
          ...prev,
          address: { ...prev.address, governorate: value, city: "" },
        };
      } else if (name === "city") {
        return { ...prev, address: { ...prev.address, city: value } };
      }
      // This part should ideally not be reached if only governorate/city use this handler
      return { ...prev, [name]: value };
    });
  };

  // --- Core Logic Handlers ---
  const handleFindOrCreateSubmit = async () => {
    setIsFindingOrCreating(true);
    const formattedPhone = formatPhoneNumber(findOrCreateData.phone);

    // --- Validation ---
    if (!formattedPhone || formattedPhone.length !== 11) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid 11-digit primary phone number.",
        variant: "destructive",
      });
      setIsFindingOrCreating(false);
      return;
    }

    const isAttemptingCreate = !!(
      findOrCreateData.fullName ||
      findOrCreateData.address.fullAdress ||
      findOrCreateData.address.city ||
      findOrCreateData.address.governorate
    );

    if (isAttemptingCreate) {
      if (!findOrCreateData.fullName) {
        toast({
          title: "Validation Error",
          description: "Full Name is required when creating a customer.",
          variant: "destructive",
        });
        setIsFindingOrCreating(false);
        return;
      }
      if (!findOrCreateData.address.governorate) {
        toast({
          title: "Validation Error",
          description: "Governorate is required when creating a customer.",
          variant: "destructive",
        });
        setIsFindingOrCreating(false);
        return;
      }
      if (!findOrCreateData.address.city) {
        toast({
          title: "Validation Error",
          description: "City is required when creating a customer.",
          variant: "destructive",
        });
        setIsFindingOrCreating(false);
        return;
      }
      if (!findOrCreateData.address.fullAdress) {
        toast({
          title: "Validation Error",
          description: "Full Address is required when creating a customer.",
          variant: "destructive",
        });
        setIsFindingOrCreating(false);
        return;
      }

      const formattedSecondPhoneCreate = formatPhoneNumber(
        findOrCreateData.secondPhone
      );
      if (
        findOrCreateData.secondPhone &&
        (!formattedSecondPhoneCreate ||
          formattedSecondPhoneCreate.length !== 11)
      ) {
        toast({
          title: "Validation Error",
          description: "Secondary phone number must be 11 digits if provided.",
          variant: "destructive",
        });
        setIsFindingOrCreating(false);
        return;
      }
    }
    // --- End Validation ---

    try {
      const customerDataForService: Omit<
        Customer,
        "id" | "status" | "createdAt"
      > & { phone: string } = {
        phone: formattedPhone,
        fullName: findOrCreateData.fullName || "", // Will be empty if just finding
        email: findOrCreateData.email || undefined,
        secondPhone:
          formatPhoneNumber(findOrCreateData.secondPhone) || undefined,
        address: {
          governorate: findOrCreateData.address.governorate || "",
          city: findOrCreateData.address.city || "",
          landMark: findOrCreateData.address.landMark || "",
          fullAdress: findOrCreateData.address.fullAdress || "",
        },
      };

      const resultCustomer = await findOrCreateCustomer(customerDataForService);

      if (resultCustomer && resultCustomer.id) {
        const finalCustomer: Customer = {
          ...resultCustomer,
          id: resultCustomer.id, // Use ID returned by service
          status: resultCustomer.status || "active",
        };

        // Navigate directly to the customer's details page
        navigate(`/customers/${finalCustomer.id}`);
        toast({
          title: "Success",
          description: `Navigating to details for ${
            finalCustomer.fullName || finalCustomer.id
          }.`,
        });
        handleCloseFindOrCreateModal();
      } else {
        throw new Error(
          "Operation failed - No customer data returned or missing ID"
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Operation Failed",
        description: `Could not find or create customer: ${msg}`,
        variant: "destructive",
      });
    } finally {
      setIsFindingOrCreating(false);
    }
  };

  // --- Prepare data for Find/Add Form Dropdowns ---
  const governorateNames = Object.keys(governoratesData || {});

  // --- Helper Functions ---
  // Helper function remains the same
  const getStatusBadgeVariant = (
    status?: Customer["status"]
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status?.toLowerCase()) {
      case "active":
        return "default"; // Greenish background
      case "archived":
        return "secondary"; // Greyish background
      case "deleted": // This shouldn't appear based on filter, but handle anyway
        return "destructive";
      default:
        return "outline";
    }
  };

  // --- Render Logic ---
  const renderLoadingSkeletons = (count = 8) =>
    Array.from({ length: count }).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-32" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-40" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-20" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-6 w-20 rounded-md" />
        </TableCell>
        {/* Remove Skeleton for actions column */}
      </TableRow>
    ));

  return (
    <>
      {/* Main Layout: List Only */}
      <div className="flex flex-col h-[calc(100vh-var(--header-height,60px))] bg-background">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-border flex-shrink-0">
          <h2 className="text-2xl font-bold">Customers</h2>
          <Button onClick={handleOpenFindOrCreateModal} size="sm">
            <UserPlus className="mr-2 h-4 w-4" /> Find / Add Customer
          </Button>
        </div>
        {error && <p className="text-destructive p-4 text-center">{error}</p>}
        {/* Customer Table */}
        <ScrollArea className="flex-grow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phone (ID)</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Status</TableHead>
                {/* No Actions Header */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                renderLoadingSkeletons()
              ) : !error && customers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5} // Adjusted colspan
                    className="text-center text-muted-foreground py-10"
                  >
                    No customers found. Use 'Find / Add Customer' to begin.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    onClick={() => handleCustomerRowClick(customer.id)} // Navigate on click
                    className={cn(
                      "cursor-pointer hover:bg-muted/50",
                      customer.status === "archived" && "opacity-60" // Dim archived
                    )}
                    title={`View details for ${
                      customer.fullName || customer.id
                    }`} // Add tooltip hint
                  >
                    <TableCell className="font-medium truncate max-w-[150px]">
                      {customer.phone}
                    </TableCell>
                    <TableCell className="truncate max-w-[200px]">
                      {customer.fullName || "N/A"}
                    </TableCell>
                    <TableCell className="truncate max-w-[250px]">
                      {customer.email || "N/A"}
                    </TableCell>
                    <TableCell className="truncate max-w-[150px]">
                      {customer.address?.city || "N/A"}
                    </TableCell>
                    {/* Status Cell */}
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(customer.status)}
                        className={cn(
                          "text-xs font-normal", // Use normal font weight
                          customer.status === "active" &&
                            "bg-green-100 text-green-800",
                          customer.status === "archived" &&
                            "bg-gray-200 text-gray-700"
                        )}
                      >
                        {customer.status
                          ? customer.status.charAt(0).toUpperCase() +
                            customer.status.slice(1)
                          : "Active"}
                      </Badge>
                    </TableCell>
                    {/* No Actions Cell */}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* --- Dialogs --- */}
      {/* Find or Create Dialog */}
      <Dialog
        open={isFindOrCreateModalOpen}
        onOpenChange={handleCloseFindOrCreateModal}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Find or Add Customer</DialogTitle>
            <CardDescription>
              Enter phone to find. Fill details to add if not found. Required
              fields marked (*).
            </CardDescription>
          </DialogHeader>
          {/* --- Form Grid --- */}
          <div className="grid gap-4 py-4">
            {/* Phone (Primary) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right col-span-1">
                Phone*
              </Label>
              <Input
                id="phone"
                name="phone"
                value={findOrCreateData.phone}
                onChange={handleFindOrCreateFormChange}
                className="col-span-3"
                placeholder="e.g., 01xxxxxxxxx"
                maxLength={15}
                required
              />
            </div>
            {/* Full Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fullName" className="text-right col-span-1">
                Full Name*
              </Label>
              <Input
                id="fullName"
                name="fullName"
                value={findOrCreateData.fullName}
                onChange={handleFindOrCreateFormChange}
                className="col-span-3"
                placeholder="Customer's full name"
              />
            </div>
            {/* Governorate */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label
                htmlFor="address.governorate"
                className="text-right col-span-1"
              >
                Governorate*
              </Label>
              {/* --- Governorate Dropdown --- */}
              <Select
                name="governorate"
                value={findOrCreateData.address.governorate}
                onValueChange={(value) =>
                  handleFindAddSelectChange("governorate", value)
                }
                // className="col-span-3" // Removed, Select handles width
                required
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select governorate" />
                </SelectTrigger>
                <SelectContent>
                  {governorateNames.map((gov) => (
                    <SelectItem key={gov} value={gov}>
                      {gov}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* City */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address.city" className="text-right col-span-1">
                City*
              </Label>
              {/* --- City Dropdown --- */}
              <Select
                name="address.city"
                value={findOrCreateData.address.city}
                onValueChange={(value) =>
                  handleFindAddSelectChange("city", value)
                }
                // className="col-span-3" // Removed
                required
                disabled={!findOrCreateData.address.governorate} // Disable if no governorate
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {citiesForFindAdd.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Full Address */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label
                htmlFor="address.fullAdress"
                className="text-right col-span-1"
              >
                Full Address*
              </Label>
              <Input
                id="address.fullAdress"
                name="address.fullAdress"
                value={findOrCreateData.address.fullAdress}
                onChange={handleFindOrCreateFormChange}
                className="col-span-3"
                placeholder="Street name, building, apartment, etc."
              />
            </div>
            {/* Landmark */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label
                htmlFor="address.landMark"
                className="text-right col-span-1"
              >
                Landmark
              </Label>
              <Input
                id="address.landMark"
                name="address.landMark"
                value={findOrCreateData.address.landMark}
                onChange={handleFindOrCreateFormChange}
                className="col-span-3"
                placeholder="Optional: Nearby notable place"
              />
            </div>
            {/* Email */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right col-span-1">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={findOrCreateData.email}
                onChange={handleFindOrCreateFormChange}
                className="col-span-3"
                placeholder="Optional: customer@example.com"
              />
            </div>
            {/* Secondary Phone */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="secondPhone" className="text-right col-span-1">
                Second Phone
              </Label>
              <Input
                id="secondPhone"
                name="secondPhone"
                value={findOrCreateData.secondPhone}
                onChange={handleFindOrCreateFormChange}
                className="col-span-3"
                placeholder="Optional: 01xxxxxxxxx"
                maxLength={15}
              />
            </div>
          </div>
          {/* --- End Form Grid --- */}
          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={isFindingOrCreating}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              onClick={handleFindOrCreateSubmit}
              disabled={isFindingOrCreating}
            >
              {isFindingOrCreating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              {isFindingOrCreating ? "Processing..." : "Find / Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CustomersPage;
