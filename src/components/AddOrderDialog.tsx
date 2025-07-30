// src/components/AddOrderDialog.tsx
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area"; // Using Shadcn UI ScrollArea

import AddOrderForm from "./AddOrderForm"; // Import the form component

interface AddOrderDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialCustomerId?: string; // Pass initial customer ID if needed
  onOrderCreated: (newOrderId: string) => void; // Pass the callback
}

const AddOrderDialog: React.FC<AddOrderDialogProps> = ({
  isOpen,
  onOpenChange,
  initialCustomerId,
  onOrderCreated,
}) => {
  // Handler to close dialog when form cancels
  const handleCancel = () => {
    onOpenChange(false);
  };

  // Handler to close dialog after successful creation
  const handleOrderCreated = (newOrderId: string) => {
    onOrderCreated(newOrderId); // Pass the ID up
    onOpenChange(false); // Close the dialog
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {/* REMOVED overflow-auto from here */}
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
          <DialogDescription>
            Select a customer, add products, and create the order.
          </DialogDescription>
        </DialogHeader>

        {/* Let ScrollArea handle the overflow */}
        {/* Consider adjusting padding/margin if needed, maybe apply padding INSIDE ScrollArea */}
        <ScrollArea className="flex-grow min-h-0">
          {/* You might want padding here or on the AddOrderForm root element */}
          <div className="pr-6">
            {" "}
            {/* Example: Add padding to the right inside scroll area */}
            {/* Render form only when dialog is open to fetch data */}
            {isOpen && (
              <AddOrderForm
                initialCustomerId={initialCustomerId}
                onOrderCreated={handleOrderCreated}
                onCancel={handleCancel}
              />
            )}
          </div>
        </ScrollArea>
        {/* Footer is now part of AddOrderForm */}
      </DialogContent>
    </Dialog>
  );
};

export default AddOrderDialog;
