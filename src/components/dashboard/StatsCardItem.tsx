// src/components/dashboard/StatsCardItem.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Props for the StatsCardItem component
interface StatsCardItemProps {
  title: string;
  value: string;
  change: string; // Example: "+12%"
  icon: React.ElementType; // For Lucide icons
  isLoading: boolean;
}

const StatsCardItem: React.FC<StatsCardItemProps> = ({
  title,
  value,
  change,
  icon: Icon, // Rename prop for clarity
  isLoading,
}) => {
  return (
    <Card className="shadow-sm border rounded-lg overflow-hidden">
      {/* CardHeader displays the title and icon */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-card">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      {/* CardContent displays the main value and change percentage */}
      <CardContent>
        {isLoading ? (
          // Show a loader if data is still loading
          <Loader2 className="h-6 w-6 animate-spin text-primary my-2" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">
              {change} from last month
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCardItem;
