// src/components/orders/OrderItemsView.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderItem } from "@/data/order";
import { formatCurrency } from "@/lib/utils";

interface OrderItemsViewProps {
  items: OrderItem[];
}

const OrderItemsView: React.FC<OrderItemsViewProps> = ({ items }) => {
  if (!items || items.length === 0) {
    return (
      <Card className="shadow-sm rounded-lg border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Items Ordered</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground italic">
            No items in this order.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm rounded-lg border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Items Ordered ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table className="text-sm">
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Product</TableHead>
              <TableHead className="text-center">Qty</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right pr-4">Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={item.product.id || index}>
                <TableCell className="font-medium pl-4">
                  {item.product.name || `ID: ${item.product.id}`}
                </TableCell>
                <TableCell className="text-center">{item.quantity}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(item.priceAtPurchase)}
                </TableCell>
                <TableCell className="text-right pr-4">
                  {formatCurrency(item.priceAtPurchase * item.quantity)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default OrderItemsView;
