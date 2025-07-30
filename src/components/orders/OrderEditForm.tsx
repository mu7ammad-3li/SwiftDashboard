// src/components/orders/OrderEditForm.tsx
import React, { ChangeEvent, FormEvent } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MinusCircle, Trash2 } from "lucide-react"; // Removed Save icon, parent handles save button
import { Product } from "@/data/products";
import { Order, OrderItem } from "@/data/order"; // Added OrderItem for clarity
import { formatCurrency } from "@/lib/utils";

// Interface for the editable order item structure within the form
export interface EditableOrderItemForm extends Omit<OrderItem, "product"> {
  productId: string;
  productName: string;
}

// Interface for the overall editable order state managed by the parent
export interface EditableOrderStateForm {
  customerId: string;
  items: EditableOrderItemForm[];
  status: Order["status"];
  shippingAddress: {
    governorate: string;
    city: string;
    landMark: string;
    fullAdress: string;
  };
  notes?: string;
  totalAmount: number;
  shippingFees: number; // Ensure this is part of the state
}

// Props for the OrderEditForm component
interface OrderEditFormProps {
  editableOrderData: EditableOrderStateForm;
  allProducts: Product[];
  customerName?: string;
  onFieldChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onAddressChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onSelectChange: (
    name:
      | keyof EditableOrderStateForm
      | keyof EditableOrderStateForm["shippingAddress"],
    value: string
  ) => void;
  onItemChange: (
    index: number,
    field: keyof EditableOrderItemForm | "priceAtPurchase",
    value: string | number
  ) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onSubmit: (e: FormEvent) => void;
  isSaving: boolean;
  governorateNames: string[];
  cities: string[];
  upsellMessage?: string | null;
}

const OrderEditForm: React.FC<OrderEditFormProps> = ({
  editableOrderData,
  allProducts,
  customerName,
  onFieldChange,
  onAddressChange,
  onSelectChange,
  onItemChange,
  onAddItem,
  onRemoveItem,
  onSubmit, // This prop will be attached to the <form> tag
  isSaving,
  governorateNames,
  cities,
  upsellMessage,
}) => {
  return (
    // The form tag is important for the parent's submit button to work correctly if using form="form-id"
    <form id="order-edit-form" onSubmit={onSubmit} className="space-y-6">
      {upsellMessage && (
        <div className="p-3 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-md text-sm">
          <strong>💡 عرض خاص:</strong> {upsellMessage}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Customer (Read-only)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <Label>Name</Label>
            <p className="text-muted-foreground">{customerName || "N/A"}</p>
          </div>
          <div>
            <Label>Phone (ID)</Label>
            <p className="text-muted-foreground">
              {editableOrderData.customerId}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Product</TableHead>
                    <TableHead className="w-[120px] text-center">
                      Quantity
                    </TableHead>
                    <TableHead className="text-right">Price/Unit</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="pr-4">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editableOrderData.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="pl-4 min-w-[200px]">
                        <Select
                          value={item.productId}
                          onValueChange={(value) =>
                            onItemChange(index, "productId", value)
                          }
                          disabled={isSaving}
                        >
                          <SelectTrigger className="w-full h-9 text-xs">
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {allProducts.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} (
                                {formatCurrency(
                                  p.onSale && p.salePrice
                                    ? parseFloat(
                                        p.salePrice.replace(/[^0-9.]/g, "")
                                      )
                                    : parseFloat(
                                        p.price.replace(/[^0-9.]/g, "")
                                      )
                                )}
                                )
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              onItemChange(
                                index,
                                "quantity",
                                Math.max(1, item.quantity - 1)
                              )
                            }
                            disabled={isSaving || item.quantity <= 1}
                          >
                            <MinusCircle className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              onItemChange(
                                index,
                                "quantity",
                                parseInt(e.target.value, 10)
                              )
                            }
                            className="w-12 text-center h-8 px-1"
                            disabled={isSaving}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              onItemChange(index, "quantity", item.quantity + 1)
                            }
                            disabled={isSaving}
                          >
                            <PlusCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-xs min-w-[100px]">
                        <Input
                          type="number"
                          value={item.priceAtPurchase}
                          onChange={(e) =>
                            onItemChange(
                              index,
                              "priceAtPurchase",
                              parseFloat(e.target.value)
                            )
                          }
                          className="w-20 text-right h-8 px-1"
                          disabled={isSaving}
                          step="0.01"
                          min="0"
                        />
                        {item.wasOnSale && (
                          <Badge
                            variant="secondary"
                            className="ml-1 scale-75 origin-right"
                          >
                            Sale
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium min-w-[100px]">
                        {formatCurrency(item.priceAtPurchase * item.quantity)}
                      </TableCell>
                      <TableCell className="pr-4">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onRemoveItem(index)}
                          disabled={
                            isSaving || editableOrderData.items.length <= 1
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="pt-4 border-t flex flex-col sm:flex-row justify-between items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAddItem}
                disabled={isSaving || allProducts.length === 0}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Item
              </Button>
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="shippingFees"
                  className="text-xs whitespace-nowrap"
                >
                  Shipping Fees:
                </Label>
                <Input
                  id="shippingFees"
                  name="shippingFees" // This name is used by onFieldChange
                  type="number"
                  value={editableOrderData.shippingFees}
                  onChange={onFieldChange} // Parent handles state update and total recalculation
                  className="h-8 w-24 text-right"
                  disabled={isSaving}
                  step="1" // Or 0.01 for decimals
                  min="0"
                />
              </div>
              <div className="text-right font-semibold">
                Total: {formatCurrency(editableOrderData.totalAmount)}
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">
                Order Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="notes"
                name="notes"
                value={editableOrderData.notes || ""}
                onChange={onFieldChange}
                disabled={isSaving}
                placeholder="Add any relevant notes for this order..."
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                name="status"
                value={editableOrderData.status}
                onValueChange={(value) => onSelectChange("status", value)}
                required
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="governorate">Governorate</Label>
                <Select
                  name="governorate"
                  value={editableOrderData.shippingAddress.governorate}
                  onValueChange={(value) =>
                    onSelectChange("governorate", value)
                  }
                  required
                  disabled={isSaving}
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
                <Label htmlFor="city">City</Label>
                <Select
                  name="city"
                  value={editableOrderData.shippingAddress.city}
                  onValueChange={(value) => onSelectChange("city", value)}
                  required
                  disabled={
                    isSaving || !editableOrderData.shippingAddress.governorate
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-form-landMark">Landmark</Label>
                <Input
                  id="edit-form-landMark"
                  name="landMark"
                  value={editableOrderData.shippingAddress.landMark}
                  onChange={onAddressChange}
                  disabled={isSaving}
                />
              </div>
              <div>
                <Label htmlFor="edit-form-fullAdress">Full Address</Label>
                <Textarea
                  id="edit-form-fullAdress"
                  name="fullAdress"
                  value={editableOrderData.shippingAddress.fullAdress}
                  onChange={onAddressChange}
                  required
                  disabled={isSaving}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* The submit button is in the parent OrderDetailsPage's header, linked by form="order-edit-form" */}
    </form>
  );
};

export default OrderEditForm;
