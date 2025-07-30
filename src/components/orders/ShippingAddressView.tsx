// src/components/orders/ShippingAddressView.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home } from "lucide-react"; // Icon for the card
import { Order } from "@/data/order"; // Order data type, which includes shippingAddress

// Props for the ShippingAddressView component
interface ShippingAddressViewProps {
  shippingAddress: Order["shippingAddress"] | null | undefined; // Shipping address object from the Order
}

const ShippingAddressView: React.FC<ShippingAddressViewProps> = ({
  shippingAddress,
}) => {
  // If no shipping address is provided, render a message indicating this
  if (!shippingAddress) {
    return (
      <Card className="shadow-sm rounded-lg border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <Home className="mr-2 h-5 w-5 text-primary/80" />
            Shipping Address
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 text-sm">
          <p className="text-muted-foreground italic">
            No shipping address provided for this order.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Destructure shipping address fields for easier access
  const { fullAdress, city, governorate, landMark } = shippingAddress;

  return (
    <Card className="shadow-sm rounded-lg border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center">
          <Home className="mr-2 h-5 w-5 text-primary/80" />
          Shipping Address
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 text-sm space-y-1">
        {/* Display the full address */}
        <p className="font-medium">{fullAdress || "N/A"}</p>
        {/* Display city and governorate */}
        <p className="text-muted-foreground">
          {city || "N/A"}, {governorate || "N/A"}
        </p>
        {/* Display landmark if available */}
        {landMark && (
          <p className="text-muted-foreground text-xs italic">
            Landmark: {landMark}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ShippingAddressView;
