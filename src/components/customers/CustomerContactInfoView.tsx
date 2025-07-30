// src/components/customers/CustomerContactInfoView.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone } from "lucide-react"; // Icons for contact info
import { Customer } from "@/data/customer"; // Customer data type
import { Skeleton } from "@/components/ui/skeleton"; // For loading state

// Props for the CustomerContactInfoView component
interface CustomerContactInfoViewProps {
  customer: Customer | null; // Customer data, can be null if not loaded
  isLoading: boolean; // Loading state for customer data
}

const CustomerContactInfoView: React.FC<CustomerContactInfoViewProps> = ({
  customer,
  isLoading,
}) => {
  // Helper function to render a contact detail item
  const renderDetailItem = (
    label: string,
    value: string | undefined | null,
    icon?: React.ReactNode
  ) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-between">
          <span className="font-medium">{label}:</span>
          <Skeleton className="h-4 w-32" />
        </div>
      );
    }
    return (
      <div className="flex items-center justify-between">
        <span className="font-medium flex items-center">
          {icon && <span className="mr-2 text-muted-foreground">{icon}</span>}
          {label}:
        </span>
        <span className="text-muted-foreground text-right">
          {value || "N/A"}
        </span>
      </div>
    );
  };

  return (
    <Card className="shadow-sm rounded-lg border">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center">
          {/* Using a generic contact icon or specific ones if preferred */}
          <Mail className="mr-2 h-5 w-5 text-primary/80" /> {/* Example icon */}
          Contact Information
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 text-sm space-y-2">
        {renderDetailItem("Email", customer?.email)}
        {renderDetailItem(
          "Secondary Phone",
          customer?.secondPhone,
          <Phone size={14} />
        )}
        {/* Primary phone is usually part of the main profile card, but can be added here if needed */}
        {/* renderDetailItem('Primary Phone', customer?.phone, <Phone size={14} />) */}

        {/* Message if customer data is loaded but some fields are empty */}
        {!isLoading && customer && !customer.email && !customer.secondPhone && (
          <p className="text-xs text-muted-foreground italic text-center pt-2">
            No additional contact information provided.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerContactInfoView;
