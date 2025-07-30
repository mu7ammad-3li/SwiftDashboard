// src/components/customers/CustomerAddressInfoView.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home } from "lucide-react"; // Icon for the address card
import { Customer } from "@/data/customer"; // Customer data type
import { Skeleton } from "@/components/ui/skeleton"; // For loading state

// Props for the CustomerAddressInfoView component
interface CustomerAddressInfoViewProps {
  address: Customer["address"] | null | undefined; // Address object from Customer data
  isLoading: boolean; // Loading state, typically tied to the parent customer data loading
}

const CustomerAddressInfoView: React.FC<CustomerAddressInfoViewProps> = ({
  address,
  isLoading,
}) => {
  // Helper function to render an address detail item
  const renderDetailItem = (
    label: string,
    value: string | undefined | null
  ) => {
    if (isLoading) {
      return (
        <div>
          <span className="font-medium text-sm">{label}:</span>
          <Skeleton className="h-4 w-full mt-1" />
        </div>
      );
    }
    return (
      <div>
        <span className="font-medium text-sm">{label}:</span>
        <p className="text-muted-foreground text-sm">{value || "N/A"}</p>
      </div>
    );
  };

  // If loading, show a structured skeleton for the address card
  if (isLoading) {
    return (
      <Card className="shadow-sm rounded-lg border">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center">
            <Home className="mr-2 h-5 w-5 text-primary/80" />
            Address
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 text-sm space-y-3">
          {renderDetailItem("Full Address", undefined)}
          {renderDetailItem("City", undefined)}
          {renderDetailItem("Governorate", undefined)}
          {renderDetailItem("Landmark", undefined)}
        </CardContent>
      </Card>
    );
  }

  // If not loading and no address is provided
  if (!address) {
    return (
      <Card className="shadow-sm rounded-lg border">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center">
            <Home className="mr-2 h-5 w-5 text-primary/80" />
            Address
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 text-sm">
          <p className="text-muted-foreground italic">
            No address information provided.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Destructure address fields for cleaner access
  const { fullAdress, city, governorate, landMark } = address;

  return (
    <Card className="shadow-sm rounded-lg border">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center">
          <Home className="mr-2 h-5 w-5 text-primary/80" />
          Address
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 text-sm space-y-3">
        {renderDetailItem("Full Address", fullAdress)}
        {renderDetailItem("City", city)}
        {renderDetailItem("Governorate", governorate)}
        {renderDetailItem("Landmark", landMark)}
      </CardContent>
    </Card>
  );
};

export default CustomerAddressInfoView;
