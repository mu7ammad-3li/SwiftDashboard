// src/components/dashboard/DashboardStats.tsx
import React from "react";
import StatsCardItem from "./StatsCardItem"; // Import the individual card item
import { ShoppingCart, Users, Package, TrendingUp } from "lucide-react"; // Assuming these are the icons used

// Interface for the data structure of each statistics card
export interface StatCardData {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType; // Type for Lucide icons
  isLoading: boolean;
}

// Props for the DashboardStats component, expects an array of StatCardData
interface DashboardStatsProps {
  stats: StatCardData[];
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Map through the stats data and render a StatsCardItem for each */}
      {stats.map((card) => (
        <StatsCardItem
          key={card.title} // Use a unique key, title is assumed unique here
          title={card.title}
          value={card.value}
          change={card.change}
          icon={card.icon}
          isLoading={card.isLoading}
        />
      ))}
    </div>
  );
};

export default DashboardStats;
