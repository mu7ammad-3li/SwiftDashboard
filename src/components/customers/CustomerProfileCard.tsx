// src/components/customers/CustomerProfileCard.tsx
import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Edit, Archive, Trash2, PlusCircle } from "lucide-react";
import { Customer } from "@/data/customer"; // Customer data type
import { getInitials, getCustomerStatusBadgeVariant } from "@/lib/utils"; // Centralized utility functions
import { cn } from "@/lib/utils"; // For conditional classnames
import {
  AlertDialog, // Only AlertDialogTrigger is used here, parent handles content
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Props for the CustomerProfileCard component
interface CustomerProfileCardProps {
  customer: Customer; // The customer data to display
  onEdit: () => void; // Callback when edit button is clicked
  onArchive: () => void; // Callback when archive button is clicked
  onDelete: () => void; // Callback to trigger delete confirmation (opens AlertDialog in parent)
  onAddNewOrder: () => void; // Callback to open the add new order dialog
  isArchiving: boolean; // Loading state for the archive action
  isDeleting: boolean; // Loading state for the delete action
  // isUpdating?: boolean; // Optional: if edit button should show loading
}

const CustomerProfileCard: React.FC<CustomerProfileCardProps> = ({
  customer,
  onEdit,
  onArchive,
  onDelete,
  onAddNewOrder,
  isArchiving,
  isDeleting,
  // isUpdating,
}) => {
  return (
    <Card className="shadow-md rounded-lg border bg-background">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-3 border-b">
        {/* Left Side: Avatar, Name, ID, Status */}
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            {/* Use utility function to get initials for avatar fallback */}
            <AvatarFallback>{getInitials(customer.fullName)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-xl font-bold">
              {customer.fullName || "Customer Details"}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground pt-1">
              Phone (ID): {customer.phone || customer.id}
            </CardDescription>
            <Badge
              variant={getCustomerStatusBadgeVariant(customer.status)}
              className={cn(
                "mt-1 text-xs font-normal", // Base styles
                customer.status === "active" &&
                  "bg-green-100 text-green-800 border-green-200",
                customer.status === "archived" &&
                  "bg-gray-100 text-gray-700 border-gray-300",
                customer.status === "deleted" &&
                  "bg-red-100 text-red-800 border-red-200"
              )}
            >
              {customer.status
                ? customer.status.charAt(0).toUpperCase() +
                  customer.status.slice(1)
                : "Active"}
            </Badge>
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center gap-1 pt-2 sm:pt-0 flex-wrap sm:flex-nowrap">
          {/* Add New Order Button */}
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={onAddNewOrder}
            title="Add New Order for this Customer"
          >
            <PlusCircle className="mr-1 h-3 w-3" /> New Order
          </Button>

          {/* Archive Button (conditional) */}
          {customer.status !== "archived" && customer.status !== "deleted" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-100/50"
              onClick={onArchive}
              title="Archive Customer"
              disabled={isArchiving}
            >
              {isArchiving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Archive className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Edit Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onEdit}
            title="Edit Customer"
            // disabled={isUpdating} // Example if you add an isUpdating prop
          >
            <Edit className="h-4 w-4" />
          </Button>

          {/* Delete Button (triggers AlertDialog in parent) */}
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
              title="Delete Customer"
              disabled={isDeleting}
              onClick={onDelete} // This onClick is primarily for the parent to set state for the dialog
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </AlertDialogTrigger>
        </div>
      </CardHeader>
      {/* No CardContent needed here as per original structure, details are in other cards */}
    </Card>
  );
};

export default CustomerProfileCard;
