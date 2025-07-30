// src/pages/Dashboard.tsx
import React, { useState, useEffect, useCallback } from "react";
import { getOrders } from "@/services/orderService";
import { getCustomerById, getCustomers } from "@/services/customerService";
import { getProducts } from "@/services/productService";
import { Order } from "@/data/order";
import { Customer } from "@/data/customer";
import { Product } from "@/data/products";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import {
  Loader2,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
} from "lucide-react";

// Import centralized utility functions
import { formatCurrency } from "@/lib/utils"; // Assuming utils.ts is in src/lib/

// Import newly created sub-components
import DashboardStats, {
  StatCardData,
} from "@/components/dashboard/DashboardStats";
import RecentOrdersTable from "@/components/dashboard/RecentOrdersTable";
import { Button } from "@/components/ui/button";

// Interface to hold both order and customer name
interface OrderWithCustomerName extends Order {
  customerName?: string;
}

function Dashboard() {
  // State for data
  const [recentOrders, setRecentOrders] = useState<OrderWithCustomerName[]>([]);
  // Customers and Products state might not be directly needed by Dashboard itself
  // if child components or hooks handle their own data fetching for stats.
  // However, they are fetched here to calculate stats.
  // const [customers, setCustomers] = useState<Customer[]>([]);
  // const [products, setProducts] = useState<Product[]>([]);

  // Loading states for different data segments
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true); // Combined loading for stats
  const [error, setError] = useState<string | null>(null); // General error for the page

  // State for the statistics cards
  const [statsCards, setStatsCards] = useState<StatCardData[]>([
    {
      title: "Total Orders",
      value: "0",
      change: "+0%",
      icon: ShoppingCart,
      isLoading: true,
    },
    {
      title: "Active Customers",
      value: "0",
      change: "+0%",
      icon: Users,
      isLoading: true,
    },
    {
      title: "Products",
      value: "0",
      change: "+0%",
      icon: Package,
      isLoading: true,
    },
    {
      title: "Revenue",
      value: "EGP 0.00",
      change: "+0%",
      icon: TrendingUp,
      isLoading: true,
    },
  ]);

  // Callback to fetch all necessary dashboard data
  const fetchDashboardData = useCallback(async () => {
    setIsLoadingOrders(true);
    setIsLoadingStats(true);
    setError(null);

    // Reset stats loading state individually if preferred
    setStatsCards((prev) => prev.map((card) => ({ ...card, isLoading: true })));

    try {
      // Fetch all data concurrently
      const [fetchedOrders, fetchedCustomers, fetchedProducts] =
        await Promise.all([getOrders(), getCustomers(), getProducts()]);

      // --- Process Orders and Fetch Customer Names ---
      // This mapping can be intensive if getCustomerById is called for each order.
      // It's better if customer data is already available (e.g., from fetchedCustomers).
      const ordersWithNamesPromises = fetchedOrders.map(async (order) => {
        const customerFromList = fetchedCustomers.find(
          (c) => c.id === order.customerId
        );
        if (customerFromList) {
          return { ...order, customerName: customerFromList.fullName || "N/A" };
        }
        // Fallback: Fetch individually if not found (should be rare if getCustomers is comprehensive)
        try {
          const customer = await getCustomerById(order.customerId);
          return { ...order, customerName: customer?.fullName || "N/A" };
        } catch (customerError) {
          console.error(
            `Failed to fetch customer ${order.customerId} for order ${order.id}`,
            customerError
          );
          return { ...order, customerName: "Error Fetching Name" };
        }
      });
      const ordersWithNames = await Promise.all(ordersWithNamesPromises);
      setRecentOrders(ordersWithNames);
      setIsLoadingOrders(false);

      // --- Update Stats Cards ---
      const totalRevenue = fetchedOrders.reduce(
        (sum, order) => sum + order.totalAmount,
        0
      );
      const activeCustomersCount = fetchedCustomers.filter(
        (c) => c.status !== "archived" && c.status !== "deleted"
      ).length;

      setStatsCards([
        {
          title: "Total Orders",
          value: fetchedOrders.length.toString(),
          change: "+12%",
          icon: ShoppingCart,
          isLoading: false,
        },
        {
          title: "Active Customers",
          value: activeCustomersCount.toLocaleString(),
          change: "+8%",
          icon: Users,
          isLoading: false,
        },
        {
          title: "Products",
          value: fetchedProducts.length.toString(),
          change: "+23%",
          icon: Package,
          isLoading: false,
        },
        {
          title: "Revenue",
          value: formatCurrency(totalRevenue),
          change: "+15%",
          icon: TrendingUp,
          isLoading: false,
        },
      ]);
      setIsLoadingStats(false);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to load dashboard data.";
      setError(errorMsg);
      toast({
        title: "Error Loading Dashboard",
        description: errorMsg,
        variant: "destructive",
      });
      // Set loading to false on error for stats
      setStatsCards((prev) =>
        prev.map((card) => ({ ...card, isLoading: false, value: "Error" }))
      );
      setIsLoadingOrders(false);
      setIsLoadingStats(false);
    }
  }, [toast]); // toast is a dependency for error handling

  // Effect to fetch data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]); // Depend on the callback

  // --- Render Logic ---

  // Display a general loading indicator or error if the main data fetching fails
  if (
    isLoadingStats &&
    isLoadingOrders &&
    recentOrders.length === 0 &&
    !error
  ) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-var(--header-height,60px))]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading Dashboard...</span>
      </div>
    );
  }

  if (error && recentOrders.length === 0) {
    // Show error if initial load completely failed
    return (
      <div className="text-destructive text-center mt-10 p-4">
        Error: {error}
        <Button
          onClick={fetchDashboardData} // Retry fetching
          variant="outline"
          className="ml-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Statistics Cards Section */}
      <DashboardStats stats={statsCards} />

      {/* Recent Orders Table Section */}
      <Card className="shadow-sm border rounded-lg">
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentOrdersTable
            orders={recentOrders}
            isLoading={isLoadingOrders}
            error={error} // Pass error specific to orders if needed, or general error
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default Dashboard;
