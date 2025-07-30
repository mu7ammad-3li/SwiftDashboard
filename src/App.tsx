// src/App.tsx
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import SignInPage from "./pages/SignInPage";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import ProductPage from "./pages/ProductPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailsPage from "./pages/OrderDetailsPage";
import CustomersPage from "./pages/CustomersPage";
import CustomerDetailsPage from "./pages/CustomerDetailsPage";
import BlogManagementPage from "./pages/BlogManagementPage";
import ViewBlogPostPage from "./pages/ViewBlogPostPage";
import PurchasesPage from "./pages/PurchasesPage"; // Import the new page
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App: React.FC = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <SonnerToaster />
        <BrowserRouter>
          <Routes>
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/blog/:slug" element={<ViewBlogPostPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/:orderId" element={<OrderDetailsPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route
                path="customers/:customerId"
                element={<CustomerDetailsPage />}
              />
              <Route path="products" element={<ProductPage />} />
              <Route path="blog-management" element={<BlogManagementPage />} />
              <Route
                path="admin/blogs/view/:slug"
                element={<ViewBlogPostPage />}
              />
              {/* Accounting Routes */}
              <Route path="accounting/purchases" element={<PurchasesPage />} />
              {/* Add other accounting routes here */}
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;
