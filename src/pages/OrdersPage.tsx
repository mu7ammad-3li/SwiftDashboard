// src/pages/OrdersPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Order } from "../data/order"; // Assuming Order type is defined here
import { Button } from "@/components/ui/button";
import { getOrders } from "../services/orderService"; // getOrderById might not be needed here anymore
import { ScrollArea } from "@/components/ui/scroll-area";
import { PackageSearch, PlusCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import AddOrderDialog from "@/components/AddOrderDialog"; // Dialog for adding new orders

// Import the new OrdersListTable component
import OrdersListTable from "@/components/orders/OrdersListTable"; // Adjust path if necessary

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // State for Add Order Dialog visibility
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);

  // --- Data Fetching ---
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const orderList = await getOrders();
      // Sort orders by date, newest first
      orderList.sort((a, b) => {
        const dateA =
          a.orderDate instanceof Date
            ? a.orderDate.getTime()
            : (a.orderDate as any)?.seconds * 1000 || 0;
        const dateB =
          b.orderDate instanceof Date
            ? b.orderDate.getTime()
            : (b.orderDate as any)?.seconds * 1000 || 0;
        return dateB - dateA;
      });
      setOrders(orderList);
      return orderList; // Return for potential use after navigation
    } catch (err) {
      console.error("Error fetching orders:", err);
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to load orders: ${errorMsg}`);
      toast({
        title: "Error Loading Orders",
        description: errorMsg,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // --- Effect to fetch orders on mount AND handle navigation state (e.g., after creating an order) ---
  useEffect(() => {
    fetchOrders().then((fetchedOrders) => {
      const stateOrderId = location.state?.selectedOrderId;
      if (stateOrderId) {
        const orderExists = fetchedOrders.some((o) => o.id === stateOrderId);
        if (orderExists) {
          navigate(`/orders/${stateOrderId}`, { replace: true, state: {} }); // Clear state after navigation
        } else {
          console.warn(
            `Order ${stateOrderId} not found in initial list after navigation.`
          );
          toast({
            title: "Order Not Found",
            description: `Could not immediately find order ${stateOrderId}.`,
            variant: "destructive",
          });
          navigate(".", { replace: true, state: {} }); // Clear the state
        }
      }
    });
  }, [fetchOrders, location.state, navigate, toast]);

  // --- Row Click Handler (passed to OrdersListTable) ---
  const handleOrderRowClick = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  // --- Add Order Success Handler (passed to AddOrderDialog) ---
  const handleOrderCreated = (newOrderId: string) => {
    fetchOrders(); // Refresh the orders list
    // Optionally, navigate to the new order's detail page
    // navigate(`/orders/${newOrderId}`);
    toast({
      title: "Order Created",
      description: `Successfully created order ${newOrderId}.`,
    });
  };

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-var(--header-height,60px))] bg-background">
        {/* Header Section */}
        <div className="flex justify-between items-center p-4 border-b border-border flex-shrink-0">
          <h2 className="text-2xl font-bold flex items-center">
            <PackageSearch className="mr-2 h-6 w-6" /> Orders
          </h2>
          <Button onClick={() => setIsAddOrderOpen(true)} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" /> New Order
          </Button>
        </div>

        {/* Display general error if fetching failed and no orders are loaded */}
        {error && orders.length === 0 && !loading && (
          <p className="text-destructive p-4 text-center">{error}</p>
        )}

        {/* Order Table Section - uses the new component */}
        <ScrollArea className="flex-grow">
          <OrdersListTable
            orders={orders}
            isLoading={loading}
            error={error} // Pass error to table for its own handling if needed (e.g. specific table error message)
            onRowClick={handleOrderRowClick}
          />
        </ScrollArea>
      </div>

      {/* Add Order Dialog Component */}
      <AddOrderDialog
        isOpen={isAddOrderOpen}
        onOpenChange={setIsAddOrderOpen}
        onOrderCreated={handleOrderCreated}
        // No initialCustomerId needed here for a general "New Order" button
      />
    </>
  );
};

export default OrdersPage;
