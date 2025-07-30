// src/components/dashboard/RecentOrdersTable.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Order } from "@/data/order"; // Assuming Order type is defined here
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

// Import centralized utility functions
import {
  formatDisplayDate,
  formatCurrency,
  getOrderStatusBadgeVariant, // Renamed from getStatusBadgeVariant for clarity
} from "@/lib/utils"; // Assuming utils.ts is in src/lib/

// Interface for orders that include the customer's name
interface OrderWithCustomerName extends Order {
  customerName?: string;
}

// Props for the RecentOrdersTable component
interface RecentOrdersTableProps {
  orders: OrderWithCustomerName[];
  isLoading: boolean;
  error?: string | null; // Optional error message
}

const RecentOrdersTable: React.FC<RecentOrdersTableProps> = ({
  orders,
  isLoading,
  error,
}) => {
  const navigate = useNavigate();

  // Handler for viewing order details
  const handleViewDetails = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  // If loading and no orders yet, show a loader
  if (isLoading && orders.length === 0) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" /> Loading
        orders...
      </div>
    );
  }

  // If there's an error fetching orders (and no orders loaded)
  if (error && orders.length === 0) {
    return (
      <p className="text-destructive text-center py-4">
        Error loading orders: {error}
      </p>
    );
  }

  // If not loading and no orders are found (and no error)
  if (!isLoading && orders.length === 0 && !error) {
    return (
      <p className="text-muted-foreground text-center py-4">
        No recent orders found.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order ID</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {/* Display only the top 10 recent orders or all if less than 10 */}
        {orders.slice(0, 10).map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-medium font-mono text-xs">
              #{order.id.substring(0, 6)}...
            </TableCell>
            <TableCell>{order.customerName || "N/A"}</TableCell>
            <TableCell>
              {/* Use the centralized formatDisplayDate utility */}
              {formatDisplayDate(order.orderDate, "PPp")}
            </TableCell>
            <TableCell>
              <Badge
                // Use the centralized getOrderStatusBadgeVariant utility
                variant={getOrderStatusBadgeVariant(order.status)}
                className="text-xs"
              >
                {order.status
                  ? order.status.charAt(0).toUpperCase() + order.status.slice(1)
                  : "N/A"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              {/* Use the centralized formatCurrency utility */}
              {formatCurrency(order.totalAmount)}
            </TableCell>
            <TableCell>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewDetails(order.id)}
              >
                Details
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default RecentOrdersTable;
