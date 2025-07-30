// src/components/orders/OrderSummaryView.tsx
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Order } from "@/data/order";
import {
  formatDisplayDate,
  formatCurrency,
  getOrderStatusBadgeVariant,
} from "@/lib/utils";

interface OrderSummaryViewProps {
  order: Order;
  onUpdateStatus: (newStatus: Order["status"]) => void;
  isUpdatingStatus: boolean;
}

const OrderSummaryView: React.FC<OrderSummaryViewProps> = ({
  order,
  onUpdateStatus,
  isUpdatingStatus,
}) => {
  return (
    <Card className="shadow-sm rounded-lg border overflow-hidden">
      <CardHeader className="bg-card">
        <CardTitle className="text-lg font-semibold">Order Summary</CardTitle>
        <CardDescription>
          ID: <span className="font-mono text-xs">{order.id}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 text-sm space-y-3">
        <div className="flex justify-between items-center">
          <span>
            <strong>Order Date:</strong>
          </span>
          <span>{formatDisplayDate(order.orderDate)}</span>
        </div>

        {/* Shipping Fees Display */}
        <div className="flex justify-between items-center">
          <span>
            <strong>Shipping Fees:</strong>
          </span>
          <span className="font-semibold">
            {formatCurrency(order.shippingFees)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span>
            <strong>Total Amount:</strong>
          </span>
          <span className="font-semibold">
            {formatCurrency(order.totalAmount)}
          </span>
        </div>

        {/* Status and Status Update Buttons */}
        <div className="flex items-center flex-wrap gap-2 pt-2 border-t mt-2">
          <strong className="mr-2 shrink-0">Status:</strong>
          <Badge
            variant={getOrderStatusBadgeVariant(order.status)}
            className="text-xs font-medium px-2.5 py-0.5 rounded-full"
          >
            {order.status
              ? order.status.charAt(0).toUpperCase() + order.status.slice(1)
              : "N/A"}
          </Badge>

          {/* Status Update Buttons */}
          <div className="ml-auto flex gap-1 flex-wrap">
            {order.status === "pending" && (
              <Button
                size="xs"
                variant="outline"
                onClick={() => onUpdateStatus("processing")}
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus && order.status === "pending" ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : null}
                Mark Processing
              </Button>
            )}
            {order.status === "processing" && (
              <Button
                size="xs"
                variant="outline"
                onClick={() => onUpdateStatus("shipped")}
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus && order.status === "processing" ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : null}
                Mark Shipped
              </Button>
            )}
            {order.status === "shipped" && (
              <Button
                size="xs"
                variant="outline"
                onClick={() => onUpdateStatus("delivered")}
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus && order.status === "shipped" ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : null}
                Mark Delivered
              </Button>
            )}
            {order.status !== "delivered" && order.status !== "cancelled" && (
              <Button
                size="xs"
                variant="destructive"
                onClick={() => onUpdateStatus("cancelled")}
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus &&
                order.status !== "delivered" &&
                order.status !== "cancelled" ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : null}
                Mark Cancelled
              </Button>
            )}
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="pt-2 border-t mt-2">
            <strong>Notes:</strong>
            <p className="text-muted-foreground text-xs italic mt-1 whitespace-pre-wrap">
              {order.notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderSummaryView;
