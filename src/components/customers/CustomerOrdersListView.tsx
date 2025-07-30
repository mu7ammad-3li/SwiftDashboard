// src/components/customers/CustomerOrdersListView.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Order } from "@/data/order"; // Order data type
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton"; // For loading state
import { Loader2, Package } from "lucide-react"; // Icons
import { cn } from "@/lib/utils"; // Utility for class names
import {
  formatDisplayDate,
  formatCurrency,
  getOrderStatusBadgeVariant,
  getOrderCardClass, // Utility to get card styling based on status
} from "@/lib/utils"; // Centralized utility functions

// Props for the CustomerOrdersListView component
interface CustomerOrdersListViewProps {
  orders: Order[];
  isLoading: boolean;
  error?: string | null;
}

const CustomerOrdersListView: React.FC<CustomerOrdersListViewProps> = ({
  orders,
  isLoading,
  error,
}) => {
  const navigate = useNavigate();

  // Handler to navigate to the full details page for a specific order
  const handleOrderClick = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  // Render loading skeletons for the order cards
  const renderLoadingSkeletons = (count = 3) =>
    Array.from({ length: count }).map((_, index) => (
      <Card
        key={`skeleton-order-${index}`}
        className="shadow-sm rounded-lg border animate-pulse"
      >
        <CardHeader className="p-3">
          <Skeleton className="h-5 w-3/4" />
        </CardHeader>
        <CardContent className="p-3 text-xs space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    ));

  return (
    <div className="mt-6">
      <h3 className="text-xl font-semibold mb-3 text-foreground border-t pt-4">
        Related Orders
      </h3>
      {isLoading ? (
        // Display loading skeletons if data is being fetched
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {renderLoadingSkeletons()}
        </div>
      ) : error ? (
        // Display an error message if fetching failed
        <p className="text-sm text-destructive">{error}</p>
      ) : orders.length === 0 ? (
        // Display a message if no orders are found for this customer
        <p className="text-sm text-muted-foreground italic">
          No orders found for this customer.
        </p>
      ) : (
        // Display the list of order cards
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <Card
              key={order.id}
              className={cn(
                "shadow-sm overflow-hidden cursor-pointer transition-all duration-150 hover:shadow-md",
                getOrderCardClass(order.status) // Apply dynamic styling based on order status
              )}
              onClick={() => handleOrderClick(order.id)}
              title={`View Order ${order.id}`}
            >
              <CardHeader className="p-3 bg-background/30 backdrop-blur-sm">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span className="flex items-center">
                    <Package className="h-4 w-4 mr-2 text-primary/80" />
                    ID:{" "}
                    <span className="ml-1 font-mono text-xs">
                      {order.id.substring(0, 8)}...
                    </span>
                  </span>
                  <Badge
                    variant={getOrderStatusBadgeVariant(order.status)}
                    className={cn("text-xs font-normal", {
                      "bg-green-100 text-green-800 border-green-200":
                        order.status === "delivered",
                      // Add other status-specific badge styles if needed
                    })}
                  >
                    {order.status
                      ? order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)
                      : "N/A"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 text-xs space-y-1">
                <p>
                  <strong>Date:</strong> {formatDisplayDate(order.orderDate)}
                </p>
                <p>
                  <strong>Total:</strong> {formatCurrency(order.totalAmount)}
                </p>
                <p className="text-muted-foreground">
                  {order.items?.length || 0} item(s)
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerOrdersListView;
