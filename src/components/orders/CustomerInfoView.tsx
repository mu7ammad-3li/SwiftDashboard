// src/components/orders/CustomerInfoView.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton"; // For loading state
import { User } from "lucide-react"; // Icon for the card
import { Customer } from "@/data/customer"; // Customer data type

// Props for the CustomerInfoView component
interface CustomerInfoViewProps {
  customer: Customer | null; // Customer data, can be null if not loaded or not found
  orderCustomerId: string; // The customer ID from the order, used as a fallback or for navigation
  isLoading: boolean; // Loading state for customer data
  onCustomerClick: (customerId: string) => void; // Callback when customer name/ID is clicked
}

const CustomerInfoView: React.FC<CustomerInfoViewProps> = ({
  customer,
  orderCustomerId,
  isLoading,
  onCustomerClick,
}) => {
  // Determine the display name and ID, preferring fetched customer data
  const displayName = customer?.fullName || "N/A";
  const displayId = customer?.id || orderCustomerId;
  const displayEmail = customer?.email || "N/A";

  return (
    <Card className="shadow-sm rounded-lg border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center">
          <User className="mr-2 h-5 w-5 text-primary/80" />
          Customer Information
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 text-sm space-y-2">
        {isLoading ? (
          // Show skeleton loaders if customer data is loading
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        ) : (
          // Display customer information once loaded
          <>
            <div className="flex justify-between items-center">
              <span>
                <strong>Name:</strong>
              </span>
              {displayId ? (
                // Make name/ID clickable to navigate to customer details
                <Button
                  variant="link"
                  onClick={() => onCustomerClick(displayId)}
                  className="p-0 h-auto text-sm text-right"
                  title={`View details for ${displayName}`}
                >
                  {displayName}
                </Button>
              ) : (
                <span className="text-muted-foreground">{displayName}</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span>
                <strong>Phone (ID):</strong>
              </span>
              {displayId ? (
                <Button
                  variant="link"
                  onClick={() => onCustomerClick(displayId)}
                  className="p-0 h-auto text-sm text-right"
                  title={`View details for customer ID ${displayId}`}
                >
                  {displayId}
                </Button>
              ) : (
                <span className="text-muted-foreground">N/A</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span>
                <strong>Email:</strong>
              </span>
              <span className="text-muted-foreground text-right">
                {displayEmail}
              </span>
            </div>
            {/* Show a message if full customer details couldn't be loaded but an ID was present */}
            {!customer && !isLoading && orderCustomerId && (
              <p className="text-xs text-destructive italic text-center pt-2">
                Could not load full customer details.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerInfoView;
