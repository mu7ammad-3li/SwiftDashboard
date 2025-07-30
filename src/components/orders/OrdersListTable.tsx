// src/components/orders/OrdersListTable.tsx
import React from "react";
import { Order } from "@/data/order"; // Assuming Order type is defined here
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatDisplayDate,
  formatCurrency,
  getOrderStatusBadgeVariant,
} from "@/lib/utils"; // Centralized utilities

// Props for the OrdersListTable component
interface OrdersListTableProps {
  orders: Order[];
  isLoading: boolean;
  error?: string | null;
  onRowClick: (orderId: string) => void; // Callback when an order row is clicked
}

const OrdersListTable: React.FC<OrdersListTableProps> = ({
  orders,
  isLoading,
  error,
  onRowClick,
}) => {
  // Renders skeleton rows for loading state
  const renderLoadingSkeletons = (count = 10) =>
    Array.from({ length: count }).map((_, index) => (
      <TableRow key={`skeleton-order-${index}`}>
        <TableCell>
          <Skeleton className="h-4 w-3/4" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-full" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-20" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-6 w-20 rounded-md" />
        </TableCell>
      </TableRow>
    ));

  // If loading, display skeleton rows
  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer Phone (ID)</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{renderLoadingSkeletons()}</TableBody>
      </Table>
    );
  }

  // If there's an error and no orders to display
  if (error && orders.length === 0) {
    return (
      <div className="text-center py-10 text-destructive">
        <p>Error loading orders: {error}</p>
      </div>
    );
  }

  // If not loading, no error, but no orders found
  if (!isLoading && !error && orders.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <p>No orders found.</p>
      </div>
    );
  }

  // Render the actual table with order data
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order ID</TableHead>
          <TableHead>Customer Phone (ID)</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow
            key={order.id}
            onClick={() => onRowClick(order.id)}
            className="cursor-pointer hover:bg-muted/50"
            title={`View details for order ${order.id}`}
          >
            <TableCell className="font-medium truncate max-w-[150px]">
              {order.id}
            </TableCell>
            <TableCell className="truncate max-w-[150px]">
              {order.customerId || "N/A"}
            </TableCell>
            <TableCell>
              {/* Use formatDisplayDate from utils for consistent date formatting */}
              {formatDisplayDate(order.orderDate, "dd/MM/yyyy")}
            </TableCell>
            <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
            <TableCell>
              <Badge
                variant={getOrderStatusBadgeVariant(order.status)}
                className="text-xs font-normal"
              >
                {order.status
                  ? order.status.charAt(0).toUpperCase() + order.status.slice(1)
                  : "N/A"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default OrdersListTable;
