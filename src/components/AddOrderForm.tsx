// src/components/AddOrderForm.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Customer } from "../data/customer";
import { Product } from "../data/products";
import { OrderItem, Order } from "../data/order";
// Ensure findOrCreateCustomer is imported correctly
import {
  getCustomers,
  findOrCreateCustomer,
} from "../services/customerService";
import { getProducts } from "../services/productService";
import { createOrder } from "../services/orderService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Import Card components
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  PlusCircle,
  Trash2,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { formatPhoneNumber } from "../lib/utils";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import governoratesData from "../data/governorates";

// Props for the form component
interface AddOrderFormProps {
  initialCustomerId?: string;
  onOrderCreated: (newOrderId: string) => void;
  onCancel: () => void;
}

// Default empty address for new customer
const defaultAddress = {
  governorate: "",
  city: "",
  landMark: "",
  fullAdress: "",
};

// Helper to parse price string
const parsePrice = (priceString: string | undefined): number => {
  if (!priceString) return 0;
  const numericString = priceString.replace(/[^0-9.]/g, "");
  return parseFloat(numericString) || 0;
};

const AddOrderForm: React.FC<AddOrderFormProps> = ({
  initialCustomerId,
  onOrderCreated,
  onCancel,
}) => {
  // --- State ---
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialCustomerId || ""
  );
  const [selectedCustomerData, setSelectedCustomerData] =
    useState<Customer | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [shippingFee, setShippingFee] = useState<number>(50); // Default shipping fee
  const [notes, setNotes] = useState<string>("");
  const [loadingCustomers, setLoadingCustomers] = useState<boolean>(false);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);
  const [customerSearchValue, setCustomerSearchValue] = useState("");
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState<
    Omit<Customer, "id" | "status">
  >({
    fullName: "",
    phone: "",
    email: "",
    secondPhone: "",
    address: { ...defaultAddress },
  });
  const [citiesForNewCustomer, setCitiesForNewCustomer] = useState<string[]>(
    []
  );
  const { toast } = useToast();

  // --- Currency Formatter ---
  const formatCurrency = (amount: number | undefined | null): string => {
    const numericAmount = Number(amount);
    if (!isNaN(numericAmount)) {
      return numericAmount.toLocaleString("en-EG", {
        style: "currency",
        currency: "EGP",
      });
    }
    return "0.00 EGP";
  };

  // --- Fetch Initial Data ---
  useEffect(() => {
    const fetchData = async () => {
      setLoadingCustomers(true);
      setLoadingProducts(true);
      try {
        const [customerList, productList] = await Promise.all([
          getCustomers(),
          getProducts(),
        ]);
        setCustomers(customerList);
        setProducts(productList);
        if (initialCustomerId) {
          const initialCustomer = customerList.find(
            (c) => c.id === initialCustomerId
          );
          setSelectedCustomerData(initialCustomer || null);
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast({
          title: "Error",
          description: "Could not load customers or products.",
          variant: "destructive",
        });
      } finally {
        setLoadingCustomers(false);
        setLoadingProducts(false);
      }
    };
    fetchData();
  }, [toast, initialCustomerId]);

  // --- Update Selected Customer ---
  useEffect(() => {
    if (selectedCustomerId) {
      const customer = customers.find((c) => c.id === selectedCustomerId);
      setSelectedCustomerData(customer || null);
    } else {
      setSelectedCustomerData(null);
    }
  }, [selectedCustomerId, customers]);

  // --- Calculate Shipping Fee ---
  const calculateShippingFee = useCallback(() => {
    // 1. Check for Free Delivery products
    const hasFreeDeliveryProduct = orderItems.some((itemId) => {
      const product = products.find((p) => p.id === itemId.product.id);
      return product?.FreeDelivery === true;
    });
    if (hasFreeDeliveryProduct) {
      return 0; // Free delivery applies
    }

    // 2. Determine which address to use
    const addressSource = isCreatingCustomer
      ? newCustomerData.address
      : selectedCustomerData?.address;

    // 3. Get fee from the relevant city
    if (addressSource?.governorate && addressSource?.city) {
      const gov =
        governoratesData[
          addressSource.governorate as keyof typeof governoratesData
        ];
      const cityInfo = Object.values(gov?.Cities || {}).find(
        (c) => c.CityName === addressSource.city
      );
      return cityInfo?.shippingFees ?? 50; // Default to 50 if not found
    }
    return 50; // Default fee if no address or city
  }, [
    orderItems,
    selectedCustomerData,
    products,
    isCreatingCustomer,
    newCustomerData.address,
  ]);

  // --- Recalculate initial shipping fee when relevant data changes ---
  useEffect(() => {
    setShippingFee(calculateShippingFee());
  }, [
    orderItems,
    selectedCustomerData,
    newCustomerData.address,
    isCreatingCustomer,
    calculateShippingFee,
  ]);

  // --- Add Item to Order ---
  const handleAddItem = () => {
    if (!selectedProductId) {
      toast({
        title: "Select Product",
        description: "Please choose a product to add.",
        variant: "destructive",
      });
      return;
    }
    const productToAdd = products.find((p) => p.id === selectedProductId);
    if (!productToAdd) {
      toast({
        title: "Error",
        description: "Selected product not found.",
        variant: "destructive",
      });
      return;
    }

    const existingItemIndex = orderItems.findIndex(
      (item) => item.product.id === productToAdd.id
    );
    const originalPriceNum = parsePrice(productToAdd.price);
    const salePriceNum = parsePrice(productToAdd.salePrice);
    const priceToUse =
      productToAdd.onSale && salePriceNum > 0 ? salePriceNum : originalPriceNum;
    const isOnSale = productToAdd.onSale && salePriceNum > 0;

    if (existingItemIndex > -1) {
      const updatedItems = [...orderItems];
      updatedItems[existingItemIndex].quantity += 1;
      setOrderItems(updatedItems);
    } else {
      const newItem: OrderItem = {
        product: { id: productToAdd.id, name: productToAdd.name },
        quantity: 1,
        originalPrice: originalPriceNum,
        priceAtPurchase: priceToUse,
        wasOnSale: isOnSale,
      };
      setOrderItems((prevItems) => [...prevItems, newItem]);
    }
    setSelectedProductId("");
  };

  // --- Remove Item from Order ---
  const handleRemoveItem = (productId: string) => {
    setOrderItems((prevItems) =>
      prevItems.filter((item) => item.product.id !== productId)
    );
  };

  // --- Update Item Quantity ---
  const handleQuantityChange = (productId: string, newQuantity: number) => {
    const quantity = Math.max(1, newQuantity);
    setOrderItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  // --- Calculate Subtotal ---
  const calculateSubtotal = useCallback((): number => {
    return orderItems.reduce(
      (total, item) => total + item.priceAtPurchase * item.quantity,
      0
    );
  }, [orderItems]);

  // --- Handle New Customer Form Changes ---
  const handleNewCustomerChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const field = name.split(".")[1];
      setNewCustomerData((prev) => ({
        ...prev,
        address: { ...(prev.address || defaultAddress), [field]: value },
      }));
    } else {
      setNewCustomerData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // --- Handle New Customer Governorate/City Select ---
  const handleNewCustomerSelectChange = (
    name: "governorate" | "city",
    value: string
  ) => {
    setNewCustomerData((prev) => {
      const updatedAddress = { ...prev.address };
      if (name === "governorate") {
        updatedAddress.governorate = value;
        updatedAddress.city = ""; // Reset city when governorate changes
        const govData =
          governoratesData[value as keyof typeof governoratesData];
        const newCities = govData
          ? Object.values(govData.Cities || {}).map((c) => c.CityName)
          : [];
        setCitiesForNewCustomer(newCities);
      } else if (name === "city") {
        updatedAddress.city = value;
      }
      return { ...prev, address: updatedAddress };
    });
  };

  // --- Handle Shipping Fee Change ---
  const handleShippingFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setShippingFee(isNaN(value) ? 0 : value);
  };

  // --- Toggle Create/Select Customer ---
  const toggleCreateCustomer = (create: boolean) => {
    setIsCreatingCustomer(create);
    setSelectedCustomerId(""); // Clear selection when switching mode
    setSelectedCustomerData(null);
    setNewCustomerData({
      // Reset new customer form
      fullName: "",
      phone: "",
      email: "",
      secondPhone: "",
      address: { ...defaultAddress },
    });
    setCitiesForNewCustomer([]);
  };

  // --- Handle Order Submission ---
  const handleSubmit = async () => {
    // --- Validation ---
    let customerIdToUse = selectedCustomerId;
    let customerAddressToUse = selectedCustomerData?.address;

    // Validate if creating a new customer
    if (isCreatingCustomer) {
      const formattedNewPhone = formatPhoneNumber(newCustomerData.phone);
      if (!formattedNewPhone || formattedNewPhone.length !== 11) {
        toast({
          title: "Validation Error",
          description: "New customer requires a valid 11-digit phone number.",
          variant: "destructive",
        });
        return;
      }
      if (!newCustomerData.fullName.trim()) {
        toast({
          title: "Validation Error",
          description: "New customer requires a full name.",
          variant: "destructive",
        });
        return;
      }
      if (!newCustomerData.address.governorate) {
        toast({
          title: "Validation Error",
          description: "New customer requires a governorate.",
          variant: "destructive",
        });
        return;
      }
      if (!newCustomerData.address.city) {
        toast({
          title: "Validation Error",
          description: "New customer requires a city.",
          variant: "destructive",
        });
        return;
      }
      if (!newCustomerData.address.fullAdress) {
        toast({
          title: "Validation Error",
          description: "New customer requires a full address.",
          variant: "destructive",
        });
        return;
      }
      // Assign formatted phone and address for creation/order
      newCustomerData.phone = formattedNewPhone;
      customerIdToUse = formattedNewPhone; // Use the new phone as the potential ID
      customerAddressToUse = newCustomerData.address;
    }

    // Ensure a customer is selected or being created
    if (!customerIdToUse || !customerAddressToUse) {
      toast({
        title: "Customer Required",
        description:
          "Please select a customer or complete the new customer details.",
        variant: "destructive",
      });
      return;
    }

    // Validate order items
    if (orderItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one product to the order.",
        variant: "destructive",
      });
      return;
    }

    // --- Submission Process ---
    setIsSubmitting(true);
    try {
      // If creating a new customer, attempt to create/find them first
      if (isCreatingCustomer) {
        try {
          const createdOrFoundCustomer = await findOrCreateCustomer({
            phone: newCustomerData.phone, // Already formatted
            fullName: newCustomerData.fullName,
            email: newCustomerData.email,
            secondPhone: newCustomerData.secondPhone,
            address: newCustomerData.address,
          });
          customerIdToUse = createdOrFoundCustomer.id; // Use the definitive ID returned
          console.log(`Using/Created customer with ID: ${customerIdToUse}`);
        } catch (customerError) {
          console.error("Error creating/finding customer:", customerError);
          const msg =
            customerError instanceof Error
              ? customerError.message
              : "Failed to process customer.";
          toast({
            title: "Customer Error",
            description: msg,
            variant: "destructive",
          });
          setIsSubmitting(false);
          return; // Stop submission if customer creation fails
        }
      }

      // Proceed with order creation
      const subtotal = calculateSubtotal();
      const finalTotal = subtotal + shippingFee;

      const newOrderData: Omit<Order, "id" | "internalNotes"> = {
        customerId: customerIdToUse, // Use the final customer ID
        items: orderItems,
        orderDate: new Date(),
        shippingAddress: {
          // Use the final address determined earlier
          governorate: customerAddressToUse.governorate,
          city: customerAddressToUse.city,
          landMark: customerAddressToUse.landMark,
          fullAdress: customerAddressToUse.fullAdress,
        },
        shippingFees: shippingFee, // Include the final shipping fee
        totalAmount: finalTotal, // Include the final total
        status: "pending",
        notes: notes.trim() || undefined,
      };

      const newOrderId = await createOrder(newOrderData);
      toast({
        title: "Success",
        description: `Order ${newOrderId} created successfully!`,
      });
      onOrderCreated(newOrderId); // Call the success callback
    } catch (error) {
      console.error("Error creating order:", error);
      const msg =
        error instanceof Error ? error.message : "Unknown order creation error";
      toast({
        title: "Error Creating Order",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Filtered Customers for Combobox ---
  const filteredCustomers = customers.filter((customer) => {
    const searchTerm = customerSearchValue.toLowerCase().trim();
    if (!searchTerm) return true;
    const nameMatch = customer.fullName.toLowerCase().includes(searchTerm);
    const phoneMatch = customer.phone.includes(searchTerm);
    return nameMatch || phoneMatch;
  });

  // Prepare governorate names for dropdowns
  const governorateNames = Object.keys(governoratesData || {});

  // --- Render ---
  return (
    <div className="space-y-6 p-1">
      {" "}
      {/* Added slight padding */}
      {/* Customer Selection / Creation Toggle */}
      <div className="space-y-2">
        <Label htmlFor="customer-select">Customer*</Label>
        <Popover
          open={isCustomerPopoverOpen}
          onOpenChange={setIsCustomerPopoverOpen}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isCustomerPopoverOpen}
              className="w-full justify-between"
              id="customer-select"
              disabled={
                loadingCustomers || !!initialCustomerId || isCreatingCustomer
              } // Disable if creating
            >
              {selectedCustomerId
                ? customers.find((c) => c.id === selectedCustomerId)?.fullName +
                  " (" +
                  customers.find((c) => c.id === selectedCustomerId)?.phone +
                  ")"
                : loadingCustomers
                ? "Loading customers..."
                : "Select customer..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search customer by name or phone..."
                value={customerSearchValue}
                onValueChange={setCustomerSearchValue}
              />
              <CommandList>
                <CommandEmpty>No customer found.</CommandEmpty>
                <CommandGroup>
                  {filteredCustomers.map((customer) => (
                    <CommandItem
                      key={customer.id}
                      value={customer.id}
                      onSelect={(currentValue) => {
                        setSelectedCustomerId(
                          currentValue === selectedCustomerId
                            ? ""
                            : currentValue
                        );
                        setIsCustomerPopoverOpen(false);
                        setCustomerSearchValue("");
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCustomerId === customer.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {customer.fullName} ({customer.phone}) -{" "}
                      {customer.address?.city || "N/A"}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {/* Display selected customer's address */}
        {selectedCustomerData && !isCreatingCustomer && (
          <p className="text-xs text-muted-foreground mt-1">
            Shipping to: {selectedCustomerData.address.fullAdress},{" "}
            {selectedCustomerData.address.city},{" "}
            {selectedCustomerData.address.governorate}
          </p>
        )}
        {/* Toggle Button */}
        <Button
          type="button"
          variant="link"
          className="text-sm h-auto p-0"
          onClick={() => toggleCreateCustomer(!isCreatingCustomer)}
          disabled={!!initialCustomerId} // Disable if customer is pre-selected
        >
          {isCreatingCustomer
            ? "Or Select Existing Customer"
            : "Or Create New Customer"}
        </Button>
      </div>
      {/* --- New Customer Fields (Conditional) --- */}
      {isCreatingCustomer && (
        <Card className="p-4 border-dashed border-primary/50">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-lg">New Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-customer-phone">Phone*</Label>
                <Input
                  id="new-customer-phone"
                  name="phone"
                  value={newCustomerData.phone}
                  onChange={handleNewCustomerChange}
                  placeholder="01xxxxxxxxx"
                  maxLength={11}
                  required
                />
              </div>
              <div>
                <Label htmlFor="new-customer-name">Full Name*</Label>
                <Input
                  id="new-customer-name"
                  name="fullName"
                  value={newCustomerData.fullName}
                  onChange={handleNewCustomerChange}
                  placeholder="Customer's full name"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="new-customer-governorate">Governorate*</Label>
              <Select
                name="governorate"
                value={newCustomerData.address.governorate}
                onValueChange={(value) =>
                  handleNewCustomerSelectChange("governorate", value)
                }
                required
              >
                <SelectTrigger>
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
            <div>
              <Label htmlFor="new-customer-city">City*</Label>
              <Select
                name="city"
                value={newCustomerData.address.city}
                onValueChange={(value) =>
                  handleNewCustomerSelectChange("city", value)
                }
                required
                disabled={!newCustomerData.address.governorate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {citiesForNewCustomer.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="new-customer-address">Full Address*</Label>
              <Textarea
                id="new-customer-address"
                name="address.fullAdress" // Corrected name
                value={newCustomerData.address.fullAdress}
                onChange={handleNewCustomerChange}
                placeholder="Street name, building, apartment..."
                required
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="new-customer-landmark">Landmark</Label>
              <Input
                id="new-customer-landmark"
                name="address.landMark" // Corrected name
                value={newCustomerData.address.landMark}
                onChange={handleNewCustomerChange}
                placeholder="Optional: Nearby notable place"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-customer-email">Email</Label>
                <Input
                  id="new-customer-email"
                  name="email"
                  type="email"
                  value={newCustomerData.email || ""}
                  onChange={handleNewCustomerChange}
                  placeholder="Optional: customer@example.com"
                />
              </div>
              <div>
                <Label htmlFor="new-customer-secondPhone">Second Phone</Label>
                <Input
                  id="new-customer-secondPhone"
                  name="secondPhone"
                  value={newCustomerData.secondPhone || ""}
                  onChange={handleNewCustomerChange}
                  placeholder="Optional: 01xxxxxxxxx"
                  maxLength={11}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Product Selection & Adding */}
      <div className="flex items-end gap-2 pt-4 border-t">
        <div className="flex-grow">
          <Label htmlFor="product-select">Add Product*</Label>
          <Select
            value={selectedProductId}
            onValueChange={setSelectedProductId}
            disabled={loadingProducts}
          >
            <SelectTrigger id="product-select">
              <SelectValue
                placeholder={
                  loadingProducts ? "Loading products..." : "Select a product"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name} (
                  {product.onSale && product.salePrice
                    ? product.salePrice
                    : product.price}
                  )
                  {product.onSale && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Sale
                    </Badge>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button" // Ensure it's not submitting the form
          onClick={handleAddItem}
          size="icon"
          variant="outline"
          disabled={!selectedProductId || isSubmitting}
        >
          <PlusCircle className="h-4 w-4" />
          <span className="sr-only">Add Item</span>
        </Button>
      </div>
      {/* Order Items Table */}
      {orderItems.length > 0 && (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="w-[80px] text-center">Quantity</TableHead>
                <TableHead className="w-[100px] text-right">Price</TableHead>
                <TableHead className="w-[100px] text-right">Subtotal</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderItems.map((item) => (
                <TableRow key={item.product.id}>
                  <TableCell className="font-medium">
                    {item.product.name}
                    {item.wasOnSale && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Sale
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleQuantityChange(
                          item.product.id,
                          parseInt(e.target.value, 10) || 1
                        )
                      }
                      className="h-8 w-16 text-center"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.priceAtPurchase)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.priceAtPurchase * item.quantity)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(item.product.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {/* Shipping Fee & Total Amount */}
      {orderItems.length > 0 && (
        <div className="space-y-2 pt-4 border-t">
          <div className="flex justify-end items-center gap-4">
            <Label htmlFor="shipping-fee" className="text-sm font-medium">
              Shipping Fee:
            </Label>
            <Input
              id="shipping-fee"
              type="number"
              value={shippingFee}
              onChange={handleShippingFeeChange}
              className="h-8 w-24 text-right"
              disabled={isSubmitting}
              step="5" // Allow increments of 5 EGP
              min="0" // Minimum fee is 0
            />
          </div>
          <div className="text-right font-semibold text-lg">
            Subtotal: {formatCurrency(calculateSubtotal())}
          </div>
          <div className="text-right font-bold text-xl text-primary">
            Total: {formatCurrency(calculateSubtotal() + shippingFee)}
          </div>
        </div>
      )}
      {/* Notes */}
      <div>
        <Label htmlFor="order-notes">Order Notes (Optional)</Label>
        <Textarea
          id="order-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any internal or customer-facing notes..."
          className="mt-1"
          rows={3}
        />
      </div>
      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            orderItems.length === 0 ||
            (!selectedCustomerId && !isCreatingCustomer) || // Disable if no customer selected/being created
            (isCreatingCustomer && !newCustomerData.phone) // Basic check if creating
          }
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Creating Order..." : "Create Order"}
        </Button>
      </div>
    </div>
  );
};

export default AddOrderForm;
